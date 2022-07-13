const router = require('express').Router();
const { pool } = require('../dao');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtGenerator, jwtAccessGenerator } = require('../utils/jwtGenerator');
const { ROLE_CODE, ROLE_NAME } = require('../config/userRoleCode');
const { sendEmailOTP, sendMobileOTP } = require('./verification');
const {
  updateRefreshToken,
  findUser,
  findUserWithRefreshToken,
  findUserWithId,
  checkIfUserExists,
  checkIfUserRevokedOrDeleted,
  decodeBase64
} = require('../utils/helper');
const { deleteSensitive } = require('../utils/utility');
const { EMAIL_REGEX, MOBILE_REGEX } = require('../constants/generalConstants');
const { sendMobileOtp } = require('./SmsController');

// // registering
exports.register = async (req, res) => {
  try {
    const { email, password, confirmPassword, eSign, currentStep } = req.body;
    if (!password || !email || !confirmPassword)
      return res
        .status(400)
        .json({ message: 'Email and Password is required' });
    if (!eSign) return res.status(400).json({ message: 'missing E-sign' });

    // 2. check if user exists (throw error if exists)
    const user = await findUser(email);
    if (user.rows.length !== 0) {
      return res
        .status(409)
        .json({ message: 'User already exists with this Email' });
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ message: 'Password and confirm password should be same' });
    }
    //  3. bcrypt the user password
    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const bcryptPassword = await bcrypt.hash(decodeBase64(password), salt);

    // 5. generating the jwt token
    const expiry = '14d';
    const { access_token, refresh_token } = jwtGenerator(email, expiry);

    const nextStep = currentStep + 1;
    const name = 'user';

    const emailResult = EMAIL_REGEX.test(email);
    const mobileResult = MOBILE_REGEX.test(email);

    // 4. enter the user inside our database
    const newUser = await pool.query(
      'INSERT INTO "USERS"("NAME", "EMAIL", "PASSWORD", "REFRESH_TOKEN","ORG_ID","ROLE","IS_REGISTERED","ROLE_CODE","E_SIGN", "CURRENT_STEP") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [
        name,
        email,
        bcryptPassword,
        refresh_token,
        1,
        ROLE_NAME.INCOMPLETE_PROFILE,
        false,
        ROLE_CODE.INCOMPLETE_PROFILE,
        eSign,
        nextStep
      ]
    );

    const userData = deleteSensitive(newUser);

    const expiryDays = 14;
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      maxAge: expiryDays * 24 * 60 * 60 * 1000,
      sameSite: 'None',
      secure: true
    });
    const id = userData.ID;
    let message;

    if (emailResult) {
      message = sendEmailOTP(email, false);
    }
    if (mobileResult) {
      await pool.query('UPDATE "USERS" SET "MOBILE" = $1 WHERE "EMAIL" = $1', [
        email
      ]);
      message = sendMobileOTP(email, false);
    }

    res.status(201).json({
      token: access_token,
      refresh_token: refresh_token,
      userInfo: userData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// login route
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!password || !email)
      return res
        .status(400)
        .json({ message: 'Email and Password is required' });

    // 2. check if user exists (throw error if not exists)
    const user = await findUser(email);

    if (user.rows.length === 0) {
      return res
        .status(401)
        .json({ message: 'Password or Email is incorrect' });
    }

    const expired = await checkIfUserRevokedOrDeleted(user.rows[0].ID);
    if (expired)
      return res.status(400).json({
        message:
          'Your Account has been revoked or deleted by the owner, please contact the owner to unblock'
      });
    //  3. check if incoming password is same as the db password
    const validPassword = await bcrypt.compare(
      decodeBase64(password),
      user.rows[0].PASSWORD
    );
    if (!validPassword) {
      return res
        .status(401)
        .json({ message: 'Password or Email is incorrect' });
    }

    // 4. return jwt token
    const expiry = '14d';
    const { access_token, refresh_token } = jwtGenerator(email, expiry);

    const expiryDays = 14;
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      maxAge: expiryDays * 24 * 60 * 60 * 1000,
      sameSite: 'None',
      secure: true
    });
    // 5. update refresh tokens
    await updateRefreshToken(refresh_token, user.rows[0].ID);

    const userData = deleteSensitive(user);

    res.json({
      token: access_token,
      userInfo: userData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// // verify
exports.authorize = (req, res) => {
  try {
    res.json(true);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};
exports.isAuthenticated = async (req, res) => {
  try {
    const cookies = req.cookies;

    if (!cookies?.refresh_token) return res.sendStatus(401);

    const refresh_token = cookies.refresh_token;

    const foundUser = await findUserWithRefreshToken(refresh_token);

    if (foundUser.rowCount === 0) return res.sendStatus(403);

    jwt.verify(
      refresh_token,
      process.env.JWT_REFRESH_TOKEN,
      async (error, payload) => {
        if (error || payload.user !== foundUser.rows[0].EMAIL)
          return res.sendStatus(403);

        res.json({ isAuthenticated: true });
      }
    );
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  const cookies = req.cookies;
  try {
    if (!cookies?.refresh_token) return res.sendStatus(401);

    const refresh_token = cookies.refresh_token;

    const foundUser = await findUserWithRefreshToken(refresh_token);

    if (foundUser.rowCount === 0) return res.sendStatus(403);

    jwt.verify(
      refresh_token,
      process.env.JWT_REFRESH_TOKEN,
      async (error, payload) => {
        if (error || payload.user !== foundUser.rows[0].EMAIL)
          return res.sendStatus(403);

        const newToken = jwtAccessGenerator(payload.user);

        const userData = deleteSensitive(foundUser);

        res.json({ token: newToken.access_token, userInfo: userData });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// // refresh your access token here
exports.logout = async (req, res) => {
  try {
    const cookies = req.cookies;

    if (!cookies?.refresh_token) return res.sendStatus(204);

    const refresh_token = cookies.refresh_token;

    const foundUser = await findUserWithRefreshToken(refresh_token);

    if (foundUser.rowCount === 0) {
      res.clearCookie('refresh_token', {
        httpOnly: true,
        sameSite: 'None',
        secure: true
      });
      res.sendStatus(204);
    }

    await pool.query(
      'UPDATE "USERS" SET "REFRESH_TOKEN" = null WHERE "ID" = $1',
      [foundUser.rows[0].ID]
    );

    res.clearCookie('refresh_token', {
      httpOnly: true,
      sameSite: 'None',
      secure: true
    });

    return res.status(204).json({ msg: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.verifyEmail = async (req, res) => {
  let { id, uniqueString, currentStep } = req.body;
  if (!id) return res.status(400).json({ message: 'user id is missing' });
  try {
    const user = await findUserWithId(id);
    if (user.rowCount === 0)
      return res.status(403).json({
        message:
          "Account record doesn't exist or has been verified already. please sign up or login  "
      });
    const { EXPIRES_AT, OTP } = user.rows[0];

    if (EXPIRES_AT < Date.now()) {
      await pool.query('UPDATE "USERS" SET "OTP" = $1, "EXPIRES_AT" = $2', [
        null,
        null
      ]);
      return res.status(400).json({ message: 'Otp has been Expired' });
    }
    const validOtp = await bcrypt.compare(
      uniqueString.toString(),
      OTP.toString()
    );

    if (!validOtp)
      return res.status(400).json({ message: 'The OTP provided is incorrect' });

    const nextStep = currentStep + 1;
    const verified = true;
    const newUser = await pool.query(
      'UPDATE "USERS" SET "OTP" = $1, "EXPIRES_AT" = $2, "VERIFIED" = $3, "CURRENT_STEP" = $4 WHERE "ID" = $5 RETURNING *',
      [null, null, verified, nextStep, id]
    );
    res.status(200).json({
      verified: verified,
      userInfo: newUser.rows[0],
      message: 'Verification completed successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(404).json({ message: 'Missing parameter' });

  try {
    const user = await checkIfUserExists(id);

    if (user.rowCount === 0)
      return res.status(401).json({ message: 'User not found' });

    await pool.query('DELETE FROM "USERS" WHERE "ID" = $1', [id]);

    res.status(200).json({ userInfo: null, currentStep: 1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.userForgotPassword = async (req, res) => {
  const { emailOrMobile, password, confirmPassword } = req.body;
  if (!emailOrMobile || !password || !confirmPassword)
    return res.status(404).json({ message: 'Missing parameter' });

  try {
    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ message: 'Password and confirm password should be same' });
    }
    const user = await pool.query(
      `SELECT "PASSWORD", "VERIFIED", "EXPIRES_AT" FROM "USERS" WHERE "EMAIL" = $1`,
      [emailOrMobile]
    );
    if (user.rows[0].EXPIRES_AT < Date.now()) {
      const user = await pool.query(
        'UPDATE "USERS" SET "OTP" = $1, "EXPIRES_AT" = $2, "FP_CURRENT_STEP" = $3 WHERE "EMAIL" = $4 RETURNING *',
        [null, null, 1, emailOrMobile]
      );
      const filtered = deleteSensitive(user);
      return res
        .status(403)
        .json({ message: 'Otp has been Expired', userInfo: filtered });
    }
    if (!user.rows[0].VERIFIED) {
      const user = await pool.query(
        'UPDATE "USERS" SET "OTP" = $1, "EXPIRES_AT" = $2, "FP_CURRENT_STEP" = $3 WHERE "EMAIL" = $4 RETURNING *',
        [null, null, 1, emailOrMobile]
      );
      const filtered = deleteSensitive(user);
      res.status(403).json({
        message: 'Please verify to change password',
        userInfo: filtered
      });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].PASSWORD);
    if (validPassword) {
      return res
        .status(401)
        .json({ message: "Choose a password you haven't used before" });
    }

    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const bcryptPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      `UPDATE "USERS" SET "PASSWORD" = $1, "OTP" = $2, "EXPIRES_AT" = $3,"VERIFIED" = $4, "FP_CURRENT_STEP" = $5 WHERE "EMAIL" = $6 RETURNING *`,
      [bcryptPassword, null, null, false, 1, emailOrMobile]
    );
    const filtered = deleteSensitive(newUser);
    res
      .status(200)
      .json({ message: 'Password changed successfully', userInfo: filtered });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  const { id, password, confirmPassword, oldPassword } = req.body;
  if (!id || !password || !confirmPassword || !oldPassword)
    return res.status(404).json({ message: 'Missing parameter' });

  try {
    const user = await pool.query(
      `SELECT "PASSWORD", "FP_VERIFIED", "FP_EXPIRES_AT" FROM "USERS" WHERE "ID" = $1`,
      [id]
    );

    const validPassword = await bcrypt.compare(
      oldPassword,
      user.rows[0].PASSWORD
    );
    if (!validPassword) {
      return res.status(401).json({ message: 'Current Password is Incorrect' });
    }

    if (password !== confirmPassword) {
      return res
        .status(400)
        .json({ message: 'Password and confirm password should be same' });
    }

    const isSamePassword = await bcrypt.compare(
      password,
      user.rows[0].PASSWORD
    );
    if (isSamePassword) {
      return res
        .status(401)
        .json({ message: "Choose a password you haven't used before" });
    }

    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const bcryptPassword = await bcrypt.hash(password, salt);

    await pool.query(`UPDATE "USERS" SET "PASSWORD" = $1 WHERE "ID" = $2`, [
      bcryptPassword,
      id
    ]);
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

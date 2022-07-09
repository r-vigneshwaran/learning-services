var unirest = require('unirest');
const otpGenerator = require('otp-generator');
const { pool } = require('../dao');
const bcrypt = require('bcrypt');
var smsReq = unirest('POST', 'https://www.fast2sms.com/dev/bulkV2');
const {
  checkIfEmail,
  checkIfMobile,
  resetOthersVerified,
  checkIfUserExistswithEmail,
  checkIfUserExists,
  findUserWithMobile
} = require('../utils/helper');
const sendVerificationcode = require('./verification');
const { deleteSensitive } = require('../utils/utility');

exports.sendMobileOtp = ({ id, mobile, isFp }) => {
  if (!mobile) return 'Mobile number and user id is required';

  try {
    smsReq.headers({
      authorization: process.env.FAST2SMS_API_KEY
    });

    const uniqueString = otpGenerator.generate(5, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false
    });
    const saltRound = 10;
    bcrypt.hash(uniqueString, saltRound).then(async (hashed) => {
      if (isFp) {
        await pool.query(
          'UPDATE "USERS" SET "OTP" = $1, "FP_EXPIRES_AT" = $2 WHERE "EMAIL" = $3',
          [hashed, Date.now() + 7200000, mobile]
        );
      } else {
        await pool.query(
          'UPDATE "USERS" SET "OTP" = $1, "EXPIRES_AT" = $2 WHERE "EMAIL" = $3',
          [hashed, Date.now() + 7200000, mobile]
        );
      }
    });

    const data = {
      variables_values: uniqueString,
      route: 'otp',
      numbers: mobile.toString()
    };
    smsReq.form(data);
    smsReq.end(function (res) {
      if (res.error) {
        console.log(res.error);
        return res.error.message;
      }
      return res.body.message;
    });
  } catch (error) {
    return error.message;
  }
};

exports.sentOtpForDriver = async (req, res) => {
  const { mobile, id } = req.body;
  if (!mobile)
    return res.status(400).json({ message: 'Missing Parameter mobile number' });

  try {
    const user = await checkIfUserExists(id);
    if (!user.rows[0])
      return res.status(400).json({ message: `User does not exist` });

    const mobileExists = await findUserWithMobile(mobile);
    if (mobileExists.rowCount !== 0) {
      return res.status(400).json({
        message: `Mobile number (${mobile}) is already taken by another user`
      });
    }

    await pool.query(
      'UPDATE "USERS" SET "OTHERS_VERIFIED" = $1, "FP_VERIFIED" = $2 WHERE "EMAIL" = $3',
      [false, false, id]
    );

    smsReq.headers({
      authorization: process.env.FAST2SMS_API_KEY
    });

    const uniqueString = otpGenerator.generate(5, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false
    });
    const saltRound = 10;
    bcrypt.hash(uniqueString, saltRound).then(async (hashed) => {
      await pool.query(
        'UPDATE "USERS" SET "OTP" = $1, "FP_EXPIRES_AT" = $2 WHERE "EMAIL" = $3',
        [hashed, Date.now() + 7200000, id]
      );
    });

    const data = {
      variables_values: uniqueString,
      route: 'otp',
      numbers: mobile.toString()
    };

    smsReq.form(data);

    smsReq.end(function (result) {
      console.log(result.error);
      if (result.error)
        return res.status(500).json({ message: JSON.stringify(result.error) });

      console.log(res.body);
      res.json(res.body);
    });
  } catch (error) {
    res.json(error.message);
  }
};

exports.generateOtp = async (req, res) => {
  const { emailOrMobile, isFp } = req.body;
  if (!emailOrMobile)
    return res.status(404).json({
      message: 'Mobile number or Email Address and user id is required'
    });

  try {
    const user = await checkIfUserExistswithEmail(emailOrMobile);
    if (!user.rows[0])
      return res.status(400).json({ message: `User does not exist` });

    await pool.query(
      'UPDATE "USERS" SET "OTHERS_VERIFIED" = $1, "FP_VERIFIED" = $2 WHERE "EMAIL" = $3',
      [false, false, emailOrMobile]
    );

    if (checkIfEmail(emailOrMobile)) {
      sendVerificationcode({ email: emailOrMobile, isFp });
    }
    if (checkIfMobile(emailOrMobile)) {
      this.sendMobileOtp({ mobile: emailOrMobile, isFp });
    }

    res
      .status(200)
      .json({ message: 'Otp Send Successfully', ID: user.rows[0]?.ID });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
exports.resetVerification = async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(404).json({ message: 'MissingParameters' });

  try {
    await resetOthersVerified(id);
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.verifyOtp = async (req, res) => {
  const { id, uniqueString } = req.body;
  if (!id || !uniqueString)
    return res.status(404).json({ message: 'MissingParameters' });
  try {
    const user = await pool.query(
      `SELECT "EXPIRES_AT", "OTP" FROM "USERS" WHERE "ID" = $1`,
      [id]
    );

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

    const newUser = await pool.query(
      'UPDATE "USERS" SET "OTP" = $1, "EXPIRES_AT" = $2, "OTHERS_VERIFIED" = $3 WHERE "ID" = $4 RETURNING *',
      [null, null, true, id]
    );

    const filteredData = deleteSensitive(newUser);

    res.status(200).json({
      userInfo: filteredData,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    res.status(200).json({
      message: error.message
    });
  }
};

exports.fpVerifyOtp = async (req, res) => {
  const { uniqueString, emailOrMobile } = req.body;
  if (!emailOrMobile || !uniqueString)
    return res.status(404).json({ message: 'MissingParameters' });

  const user = await pool.query(
    `SELECT "FP_EXPIRES_AT", "OTP" FROM "USERS" WHERE "EMAIL" = $1`,
    [emailOrMobile]
  );
  if (user.rowCount === 0) {
    return res.status(404).json({ message: 'This User does not exist' });
  }
  const { FP_EXPIRES_AT, OTP } = user.rows[0];

  if (!OTP) {
    return res.status(401).json({ message: 'No OTP found in user record' });
  }
  if (FP_EXPIRES_AT < Date.now()) {
    await pool.query(
      'UPDATE "USERS" SET "OTP" = $1, "FP_EXPIRES_AT" = $2 WHERE "EMAIL" = $3',
      [null, null, emailOrMobile]
    );
    return res.status(400).json({ message: 'Otp has been Expired' });
  }
  const uniqueOtp = uniqueString.toString();
  const dbOtp = OTP.toString();
  const validOtp = await bcrypt.compare(uniqueOtp, dbOtp);

  if (!validOtp)
    return res.status(400).json({ message: 'The OTPprovided is incorrect' });

  const nextStep = 2;
  const newUser = await pool.query(
    'UPDATE "USERS" SET "OTP" = $1, "FP_VERIFIED" = $2, "FP_CURRENT_STEP" = $3 WHERE "EMAIL" = $4 RETURNING *',
    [null, true, nextStep, emailOrMobile]
  );
  res.status(200).json({
    verified: true,
    userInfo: newUser.rows[0],
    message: 'Verification completed successfully'
  });
};

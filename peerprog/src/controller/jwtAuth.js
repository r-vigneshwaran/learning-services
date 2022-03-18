const router = require('express').Router();
const { pool } = require('../dao');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { jwtGenerator, jwtAccessGenerator } = require('../utils/jwtGenerator');

const updateRefreshToken = async (token, userId) => {
  const response = await pool.query(
    `UPDATE "USERS" SET "REFRESH_TOKEN" = $1 WHERE "ID" = $2 RETURNING *`,
    [token, userId]
  );
  return response;
};

// // registering
exports.register = async (req, res) => {
  try {
    // 1. destructor thr req.body (name,email,password)
    const { name, email, password, rememberMe } = req.body;
    if (!name) return res.status(400).json({ message: 'username is required' });
    if (!password || !email)
      return res
        .status(400)
        .json({ message: 'Email and Password is required' });

    // 2. check if user exists (throw error if exists)
    const user = await pool.query(`SELECT * FROM "USERS" WHERE "EMAIL" = $1`, [
      email
    ]);
    if (user.rows.length !== 0) {
      return res
        .status(409)
        .json({ message: 'User already exists with this Email' });
    }

    //  3. bcrypt the user password
    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const bcryptPassword = await bcrypt.hash(password, salt);

    // 5. generating the jwt token
    const expiry = rememberMe ? '14d' : '1d';
    const { access_token, refresh_token } = jwtGenerator(email, expiry);

    // 4. enter the user inside our database
    const uuid = crypto.randomBytes(6 * 6).toString('base64');
    const newUser = await pool.query(
      'INSERT INTO "USERS"("ID","NAME", "EMAIL", "PASSWORD", "REFRESH_TOKEN","ORG_ID","ROLE") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [uuid, name, email, bcryptPassword, refresh_token, 1, 'CUSTOMER']
    );

    delete newUser['rows'][0]['REFRESH_TOKEN'];
    delete newUser['rows'][0]['PASSWORD'];

    const expiryDays = rememberMe ? 14 : 1;
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      maxAge: expiryDays * 24 * 60 * 60 * 1000,
      sameSite: 'None',
      secure: true
    });
    res.status(201).json({
      message: `New user ${name} created successfully`,
      token: access_token,
      refresh_token: refresh_token,
      userInfo: newUser.rows[0]
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: err.message });
  }
};

// // login route
exports.login = async (req, res) => {
  try {
    // 1. destructor thr req.body (name,email,password)
    const { email, password, rememberMe } = req.body;

    if (!password || !email)
      return res
        .status(400)
        .json({ message: 'Email and Password is required' });

    // 2. check if user exists (throw error if not exists)
    const user = await pool.query('SELECT * FROM "USERS" WHERE "EMAIL" = $1', [
      email
    ]);
    if (user.rows.length === 0) {
      return res
        .status(401)
        .json({ message: 'Password or Email is incorrect' });
    }

    //  3. check if incoming password is same as the db password
    const validPassword = await bcrypt.compare(password, user.rows[0].PASSWORD);
    if (!validPassword) {
      return res
        .status(401)
        .json({ message: 'Password or Email is incorrect' });
    }

    // 4. return jwt token
    const expiry = rememberMe ? '14d' : '1d';
    const { access_token, refresh_token } = jwtGenerator(email, expiry);

    const expiryDays = rememberMe ? 14 : 1;
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      maxAge: expiryDays * 24 * 60 * 60 * 1000,
      sameSite: 'None',
      secure: true
    });
    // 5. update refresh tokens
    await updateRefreshToken(refresh_token, user.rows[0].ID);

    delete user['rows'][0]['REFRESH_TOKEN'];
    delete user['rows'][0]['PASSWORD'];

    res.json({
      token: access_token,
      userInfo: user.rows[0]
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).json({ error: err.message });
  }
};

// // verify
exports.authorize = (req, res) => {
  try {
    res.json(true);
  } catch (error) {
    console.log(error.message);
    res.status(500).send({ error: error.message });
  }
};
exports.isAuthenticated = async (req, res) => {
  try {
    const cookies = req.cookies;

    if (!cookies?.refresh_token) return res.sendStatus(401);

    const refresh_token = cookies.refresh_token;

    const foundUser = await pool.query(
      `SELECT * FROM "USERS" WHERE "REFRESH_TOKEN" ='${refresh_token}'`
    );

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
    console.log(error.message);
    res.status(500).send({ error: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.refresh_token) return res.sendStatus(401);

  const refresh_token = cookies.refresh_token;

  const foundUser = await pool.query(
    `SELECT * FROM "USERS" WHERE "REFRESH_TOKEN" ='${refresh_token}'`
  );

  if (foundUser.rowCount === 0) return res.sendStatus(403);

  jwt.verify(
    refresh_token,
    process.env.JWT_REFRESH_TOKEN,
    async (error, payload) => {
      if (error || payload.user !== foundUser.rows[0].EMAIL)
        return res.sendStatus(403);

      const newToken = jwtAccessGenerator(payload.user);

      res.json({ token: newToken.access_token, userInfo: foundUser.rows[0] });
    }
  );
};

// // refresh your access token here
exports.logout = async (req, res) => {
  try {
    const cookies = req.cookies;

    if (!cookies?.refresh_token) return res.sendStatus(204);

    const refresh_token = cookies.refresh_token;

    const foundUser = await pool.query(
      `SELECT * FROM "USERS" WHERE "REFRESH_TOKEN" ='${refresh_token}'`
    );

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
    console.log(error.message);
    res.status(401).send({ error: error.message });
  }
};

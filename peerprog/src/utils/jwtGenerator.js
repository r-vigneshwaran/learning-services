const jwt = require('jsonwebtoken');
require('dotenv').config();
const pool = require('../dao');

function jwtGenerator(user_id, expiry) {
  const payload = {
    user: user_id
  };
  const access_token = jwt.sign(payload, process.env.JWT_ACCESS_TOKEN, {
    expiresIn: '5m'
  });
  const refresh_token = jwt.sign(payload, process.env.JWT_REFRESH_TOKEN, {
    expiresIn: '14d'
  });
  return { access_token, refresh_token };
}

function jwtAccessGenerator(user_id) {
  const payload = {
    user: user_id
  };
  const access_token = jwt.sign(payload, process.env.JWT_ACCESS_TOKEN, {
    expiresIn: '5m'
  });
  return { access_token };
}

function verifyRefreshToken(req, res, next) {
  const refresh_token = req.cookies?.refresh_token;

  console.log(refresh_token);

  if (!refresh_token)
    return res.sendStatus(401).json({ error: 'No Refresh Token Found' });

  const foundUser = pool.query(
    `SELECT * FROM "USERS" WHERE "REFRESH_TOKEN" =$1`,
    [refresh_token]
  );
  if (!foundUser)
    return res.sendStatus(403).json({ error: 'No Refresh Token Found in DB' });
  jwt.verify(refresh_token, process.env.JWT_REFRESH_TOKEN, (error, payload) => {
    if (error) return res.status(403).json({ error: error.message });
    if (foundUser.ID !== payload.user)
      return res.status(403).json({ error: 'ID mismatch' });

    const newToken = jwtGenerator(payload.user);
    // res.cookie('refresh_token', newToken.refresh_token, { httpOnly: true });
    return res.json({ token: newToken.access_token });
  });
}
module.exports = { jwtGenerator, verifyRefreshToken, jwtAccessGenerator };

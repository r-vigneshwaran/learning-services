const jwt = require('jsonwebtoken');
const { checkIfUserRevokedOrDeletedWithEmail } = require('../utils/helper');
require('dotenv').config();

exports.isRevoked = async (req, res, next) => {
  // getting user token from headers
  const authorization = req.header('Authorization');

  if (!authorization) return res.sendStatus(401);

  const jwtToken = authorization.split(' ')[1];

  // checking if the token exists
  if (!jwtToken) {
    return res.status(403).json({ msg: 'authorization denied' });
  }

  // verifying if the token is valid
  jwt.verify(jwtToken, process.env.JWT_ACCESS_TOKEN, async (err, payload) => {
    if (err) return sendStatus(403); //invalid token
    if (payload) {
      // returning the payload to the user
      req.user = payload.user;
      const expired = await checkIfUserRevokedOrDeletedWithEmail(payload.user);
      if (expired) {
        return res.status(404).json({
          message:
            'Your Account has been Revoked or Deleted, please contact the admin'
        });
      }
      next();
    }
  });
};

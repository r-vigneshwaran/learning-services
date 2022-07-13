const { EMAIL_REGEX, MOBILE_REGEX } = require('../constants/generalConstants');
const { pool } = require('../dao');

const updateRefreshToken = async (token, userId) => {
  const response = await pool.query(
    `UPDATE "USERS" SET "REFRESH_TOKEN" = $1 WHERE "ID" = $2 RETURNING *`,
    [token, userId]
  );
  return response;
};

const findUser = async (email) => {
  const response = await pool.query(
    `SELECT * FROM "USERS" WHERE "EMAIL" = $1`,
    [email]
  );
  return response;
};

const findUserWithRefreshToken = async (token) => {
  return await pool.query(`SELECT * FROM "USERS" WHERE "REFRESH_TOKEN" = $1`, [
    token
  ]);
};
const findUserWithId = async (id) => {
  return await pool.query(`SELECT * FROM "USERS" WHERE "ID" = $1`, [id]);
};
const findUserWithMobile = async (mobile) => {
  return await pool.query('SELECT "ID" FROM "USERS" WHERE "MOBILE" = $1', [
    mobile
  ]);
};
const checkIfUserExists = async (id) => {
  return await pool.query('SELECT "ID" FROM "USERS" WHERE "ID" = $1', [id]);
};
const checkIfUserExistswithEmail = async (email) => {
  return await pool.query('SELECT "ID" FROM "USERS" WHERE "EMAIL" = $1', [
    email
  ]);
};
const findVehicleWithId = async (id) => {
  return await pool.query(
    'SELECT * FROM "VEHICLE" LEFT JOIN "VEHICLE_IMAGES" ON "VEHICLE_IMAGES"."VEHICLE_ID" = "VEHICLE"."ID" WHERE "ORG_ID" = $1 AND "DELETED" = $2',
    [id, false]
  );
};
const checkIfUserRevokedOrDeleted = async (id) => {
  const response = await pool.query(
    'SELECT "ID", "REVOKE_EXPIRES_AT" FROM "USERS" WHERE "DELETED" = false AND "ID" = $1',
    [id]
  );
  if (response.rows[0].REVOKE_EXPIRES_AT) {
    const today = new Date();
    const expireDate = new Date(response.rows[0].REVOKE_EXPIRES_AT);
    return expireDate > today;
  } else {
    return false;
  }
};
const checkIfUserRevoked = async (id) => {
  const response = await pool.query(
    'SELECT "ID", "REVOKE_EXPIRES_AT" FROM "USERS" WHERE "ID" = $1',
    [id]
  );
  if (response.rows[0].REVOKE_EXPIRES_AT) {
    const today = new Date();
    const expireDate = new Date(response.rows[0].REVOKE_EXPIRES_AT);
    return expireDate > today;
  } else {
    return false;
  }
};
const checkIfUserRevokedOrDeletedWithEmail = async (email) => {
  const response = await pool.query(
    'SELECT "ID", "REVOKE_EXPIRES_AT", "REVOKED" FROM "USERS" WHERE "EMAIL" = $1',
    [email]
  );
  if (response.rows[0].REVOKED && response.rows[0]?.REVOKE_EXPIRES_AT) {
    const today = new Date();
    const expireDate = new Date(response.rows[0].REVOKE_EXPIRES_AT);
    return expireDate > today;
  } else {
    return false;
  }
};
const findRecord = async (table, id) => {
  return await pool.query(`SELECT * FROM "${table}" WHERE "ID" = $1`, [id]);
};
const checkIfAadharExists = async (aadharNumber) => {
  return await pool.query(
    `SELECT "ID" FROM "USERS" WHERE "AADHAR_NUMBER" = $1`,
    [aadharNumber]
  );
};
const checkIfLicenceExists = async (licenceNumber) => {
  return await pool.query(
    `SELECT "ID" FROM "USERS" WHERE "DRIVER_LICENCE_NO" = $1`,
    [licenceNumber]
  );
};
const checkIfEmail = (emailOrMobile) => {
  const emailResult = EMAIL_REGEX.test(emailOrMobile);
  return emailResult;
};
const checkIfMobile = (emailOrMobile) => {
  const mobileResult = MOBILE_REGEX.test(emailOrMobile);
  return mobileResult;
};
const checkIfOthersVerified = async (id) => {
  const isVerified = await pool.query(
    `SELECT "OTHERS_VERIFIED" FROM "USERS" WHERE "ID" = $1`,
    [id]
  );
  if (!isVerified.rows[0]) {
    return res
      .status(400)
      .json({ message: `Please Verify to proceed further` });
  }
};
const resetOthersVerified = async (id) => {
  return await pool.query(
    `UPDATE "USERS" SET "OTHERS_VERIFIED" = $1 WHERE "ID" = $2`,
    [false, id]
  );
};
const filterExpired = (rows) => {
  const today = new Date();
  const filtered = rows.filter((item) => {
    const expiresAt = new Date(item.TO_DATE);
    expiresAt.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return expiresAt >= today;
  });
  return filtered;
};
const decodeBase64 = (data) => {
  return Buffer.from(data, 'base64').toString('utf8');
};

module.exports = {
  updateRefreshToken,
  findUser,
  findUserWithRefreshToken,
  findUserWithId,
  findVehicleWithId,
  findRecord,
  checkIfAadharExists,
  checkIfLicenceExists,
  checkIfUserExists,
  checkIfUserRevokedOrDeleted,
  checkIfUserRevokedOrDeletedWithEmail,
  checkIfUserRevoked,
  checkIfEmail,
  checkIfMobile,
  checkIfOthersVerified,
  resetOthersVerified,
  filterExpired,
  checkIfUserExistswithEmail,
  decodeBase64,
  findUserWithMobile
};

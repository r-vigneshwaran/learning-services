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
const checkIfUserExists = async (id) => {
  return await pool.query('SELECT "ID" FROM "USERS" WHERE "ID" = $1', [id]);
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
    'SELECT "ID", "REVOKE_EXPIRES_AT" FROM "USERS" WHERE "DELETED" = false AND "EMAIL" = $1',
    [email]
  );
  if (response.rows[0].REVOKE_EXPIRES_AT) {
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
  checkIfUserRevoked
};

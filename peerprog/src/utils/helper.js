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
const findVehicleWithId = async (id) => {
  return await pool.query(
    'SELECT * FROM "VEHICLE" LEFT JOIN "VEHICLE_IMAGES" ON "VEHICLE_IMAGES"."VEHICLE_ID" = "VEHICLE"."ID" WHERE "ORG_ID" = $1 AND "DELETED" = $2',
    [id, false]
  );
};
const findRecord = async (table, id) => {
  return await pool.query(`SELECT * FROM "${table}" WHERE "ID" = $1`, [id]);
};

module.exports = {
  updateRefreshToken,
  findUser,
  findUserWithRefreshToken,
  findUserWithId,
  findVehicleWithId,
  findRecord
};

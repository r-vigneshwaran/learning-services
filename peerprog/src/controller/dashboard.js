const { pool } = require('../dao');
const { CATEGORY_CODE } = require('../config/userRoleCode');

exports.home = async (req, res) => {
  let { page, size } = req.query;
  page = page ? page : 1;
  size = size ? size : 5;
  try {
    const query = `SELECT "T"."ID" as "TRIP_ID", "T"."FROM_LOCATION" as "FROM_LOCATION", "T"."TO_LOCATION" AS "TO_LOCATION",
    "T"."CAPACITY" AS "CAPACITY", "T"."FROM_DATE" AS "FROM_DATE", "T"."TO_DATE" AS "TO_DATE", "T"."PRICE" AS "PRICE",
    "U"."ID" AS "USER_ID", "U"."NAME" AS "NAME", "U"."EMAIL" AS "EMAIL", "U"."MOBILE" AS "MOBILE", "U"."ROLE" AS "ROLE",
    "U"."ROLE_CODE" AS "ROLE_CODE", "U"."DRIVER_LICENCE_NO" AS "DRIVER_LICENCE_NO", "U"."YEAR_OF_EXPERIENCE" AS "YEAR_OF_EXPERIENCE",
    "U"."DRIVER_LICENCE_VALIDITY" AS "DRIVER_LICENCE_VALIDITY", "V"."REG_NO" AS "REG_NO", "V"."CAPACITY_UNIT" AS "CAPACITY_UNIT",
    "V"."TYPE" AS "TYPE" , "V"."VEHICLE_NAME" AS "VEHICLE_NAME", "V"."CATEGORY_CODE" AS "CATEGORY_CODE", "V"."MODEL_YEAR" AS "MODEL_YEAR",
    "V"."RC_VALIDITY" AS "RC_VALIDITY" , "V"."OWNERSHIP" AS "OWNERSHIP", "V"."OWNER_NAME" AS "OWNERNAME", "V"."CITY" AS "CITY",
    "V"."IS_AVAILABLE" AS "IS_AVAILABLE", "V"."ID" AS "ID" , "VI"."IMAGE" AS "IMAGE"
    FROM "TRIPS" "T" LEFT JOIN "USERS" "U" ON "T"."DRIVER_ID" = "U"."ID"
    LEFT JOIN "VEHICLE" "V" ON "T"."VEHICLE_ID" = "V"."ID" 
    LEFT JOIN "VEHICLE_IMAGES" "VI" ON "V"."ID" = "VI"."VEHICLE_ID" 
    WHERE "V"."DELETED" = false AND "T"."DELETED" = $3
    LIMIT $2 OFFSET (($1 - 1) * $2);`;
    const { rows } = await pool.query(query, [page, size, false]);

    const noOfUsers = await pool.query(
      `SELECT COUNT('ID') FROM "TRIPS" "T" LEFT JOIN "VEHICLE" "V" ON "T"."VEHICLE_ID" = "V"."ID" WHERE "V"."DELETED" = false AND "T"."DELETED" = $1`,
      [false]
    );
    const today = new Date();
    const filtered = rows.filter((item) => {
      const expiresAt = new Date(item.TO_DATE);
      return expiresAt > today;
    });
    res.status(200).json({
      currentPage: page,
      content: filtered,
      totalNoOfRecords: parseInt(noOfUsers.rows[0].count)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.testing = async (req, res) => {
  let { page, size } = req.query;
  page = page ? page : 1;
  size = size ? size : 5;
  try {
    const query = `SELECT "T"."ID" as "TRIP_ID", "T"."FROM_LOCATION" as "FROM_LOCATION", "T"."TO_LOCATION" AS "TO_LOCATION",
    "T"."CAPACITY" AS "CAPACITY", "T"."FROM_DATE" AS "FROM_DATE", "T"."TO_DATE" AS "TO_DATE", "T"."PRICE" AS "PRICE",
    "U"."ID" AS "USER_ID", "U"."NAME" AS "NAME", "U"."EMAIL" AS "EMAIL", "U"."MOBILE" AS "MOBILE", "U"."ROLE" AS "ROLE",
    "U"."ROLE_CODE" AS "ROLE_CODE", "U"."DRIVER_LICENCE_NO" AS "DRIVER_LICENCE_NO", "U"."YEAR_OF_EXPERIENCE" AS "YEAR_OF_EXPERIENCE",
    "U"."DRIVER_LICENCE_VALIDITY" AS "DRIVER_LICENCE_VALIDITY", "V"."REG_NO" AS "REG_NO", "V"."CAPACITY_UNIT" AS "CAPACITY_UNIT",
    "V"."TYPE" AS "TYPE" , "V"."VEHICLE_NAME" AS "VEHICLE_NAME", "V"."CATEGORY_CODE" AS "CATEGORY_CODE", "V"."MODEL_YEAR" AS "MODEL_YEAR",
    "V"."RC_VALIDITY" AS "RC_VALIDITY" , "V"."OWNERSHIP" AS "OWNERSHIP", "V"."OWNER_NAME" AS "OWNERNAME", "V"."CITY" AS "CITY",
    "V"."IS_AVAILABLE" AS "IS_AVAILABLE", "V"."ID" AS "ID" , "VI"."IMAGE" AS "IMAGE"
    FROM "TRIPS" "T" LEFT JOIN "USERS" "U" ON "T"."DRIVER_ID" = "U"."ID"
    LEFT JOIN "VEHICLE" "V" ON "T"."VEHICLE_ID" = "V"."ID" 
    LEFT JOIN "VEHICLE_IMAGES" "VI" ON "V"."ID" = "VI"."VEHICLE_ID" 
    WHERE "V"."DELETED" = false AND "T"."DELETED" = $3
    LIMIT $2 OFFSET (($1 - 1) * $2);`;
    const { rows } = await pool.query(query, [page, size, false]);

    const noOfUsers = await pool.query(
      `SELECT COUNT('ID') FROM "TRIPS" "T" LEFT JOIN "VEHICLE" "V" ON "T"."VEHICLE_ID" = "V"."ID" WHERE "V"."DELETED" = false AND "T"."DELETED" = $1`,
      [false]
    );
    const today = new Date();
    const filtered = rows.filter((item) => {
      const expiresAt = new Date(item.TO_DATE);
      return expiresAt > today;
    });
    res
      .status(200)
      .json({ filtered: filtered.length, unFiltered: rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.largeVehicles = async (req, res) => {
  let { page, size } = req.query;
  page = page ? page : 1;
  size = size ? size : 5;
  try {
    const query = `SELECT "T"."ID" as "TRIP_ID", "T"."FROM_LOCATION" as "FROM_LOCATION", "T"."TO_LOCATION" AS "TO_LOCATION",
    "T"."CAPACITY" AS "CAPACITY", "T"."FROM_DATE" AS "FROM_DATE", "T"."TO_DATE" AS "TO_DATE", "T"."PRICE" AS "PRICE",
    "U"."ID" AS "USER_ID", "U"."NAME" AS "NAME", "U"."EMAIL" AS "EMAIL", "U"."MOBILE" AS "MOBILE", "U"."ROLE" AS "ROLE",
    "U"."ROLE_CODE" AS "ROLE_CODE", "U"."DRIVER_LICENCE_NO" AS "DRIVER_LICENCE_NO", "U"."YEAR_OF_EXPERIENCE" AS "YEAR_OF_EXPERIENCE",
    "U"."DRIVER_LICENCE_VALIDITY" AS "DRIVER_LICENCE_VALIDITY", "V"."REG_NO" AS "REG_NO", "V"."CAPACITY_UNIT" AS "CAPACITY_UNIT",
    "V"."TYPE" AS "TYPE" , "V"."VEHICLE_NAME" AS "VEHICLE_NAME", "V"."CATEGORY_CODE" AS "CATEGORY_CODE", "V"."MODEL_YEAR" AS "MODEL_YEAR",
    "V"."RC_VALIDITY" AS "RC_VALIDITY" , "V"."OWNERSHIP" AS "OWNERSHIP", "V"."OWNER_NAME" AS "OWNERNAME", "V"."CITY" AS "CITY",
    "V"."IS_AVAILABLE" AS "IS_AVAILABLE", "V"."ID" AS "ID" , "VI"."IMAGE" AS "IMAGE" 
    , count(*) OVER() AS "TOTAL_COUNT"
    FROM "TRIPS" "T" LEFT JOIN "USERS" "U" ON "T"."DRIVER_ID" = "U"."ID"
    LEFT JOIN "VEHICLE" "V" ON "T"."VEHICLE_ID" = "V"."ID" AND "V"."DELETED" = false
    LEFT JOIN "VEHICLE_IMAGES" "VI" ON "V"."ID" = "VI"."VEHICLE_ID" 
    WHERE "V"."CATEGORY_CODE" = $3 AND "T"."DELETED" = $4
    LIMIT $2 OFFSET (($1 - 1) * $2);`;
    const { rows } = await pool.query(query, [
      page,
      size,
      CATEGORY_CODE.LARGE_VEHICLE,
      false
    ]);
    const noOfUsers = await pool.query(
      `SELECT COUNT('ID') FROM "TRIPS" "T" LEFT JOIN "VEHICLE" "V" ON "T"."VEHICLE_ID" = "V"."ID" WHERE "V"."DELETED" = false AND "V"."CATEGORY_CODE" = $1 AND "T"."DELETED" = $2`,
      [CATEGORY_CODE.LARGE_VEHICLE, false]
    );
    const today = new Date();
    const filtered = rows.filter((item) => {
      const expiresAt = new Date(item.TO_DATE);
      return expiresAt > today;
    });
    res.status(200).json({
      currentPage: page,
      content: filtered,
      totalNoOfRecords: parseInt(noOfUsers.rows[0].count)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.smallVehicles = async (req, res) => {
  let { page, size } = req.query;
  page = page ? page : 1;
  size = size ? size : 5;
  try {
    const query = `SELECT "T"."ID" as "TRIP_ID", "T"."FROM_LOCATION" as "FROM_LOCATION", "T"."TO_LOCATION" AS "TO_LOCATION",
    "T"."CAPACITY" AS "CAPACITY", "T"."FROM_DATE" AS "FROM_DATE", "T"."TO_DATE" AS "TO_DATE", "T"."PRICE" AS "PRICE",
    "U"."ID" AS "USER_ID", "U"."NAME" AS "NAME", "U"."EMAIL" AS "EMAIL", "U"."MOBILE" AS "MOBILE", "U"."ROLE" AS "ROLE",
    "U"."ROLE_CODE" AS "ROLE_CODE", "U"."DRIVER_LICENCE_NO" AS "DRIVER_LICENCE_NO", "U"."YEAR_OF_EXPERIENCE" AS "YEAR_OF_EXPERIENCE",
    "U"."DRIVER_LICENCE_VALIDITY" AS "DRIVER_LICENCE_VALIDITY", "V"."REG_NO" AS "REG_NO", "V"."CAPACITY_UNIT" AS "CAPACITY_UNIT",
    "V"."TYPE" AS "TYPE" , "V"."VEHICLE_NAME" AS "VEHICLE_NAME", "V"."CATEGORY_CODE" AS "CATEGORY_CODE", "V"."MODEL_YEAR" AS "MODEL_YEAR",
    "V"."RC_VALIDITY" AS "RC_VALIDITY" , "V"."OWNERSHIP" AS "OWNERSHIP", "V"."OWNER_NAME" AS "OWNERNAME", "V"."CITY" AS "CITY",
    "V"."IS_AVAILABLE" AS "IS_AVAILABLE", "V"."ID" AS "ID" , "VI"."IMAGE" AS "IMAGE"
    , count(*) OVER() AS "TOTAL_COUNT"
    FROM "TRIPS" "T" LEFT JOIN "USERS" "U" ON "T"."DRIVER_ID" = "U"."ID"
    LEFT JOIN "VEHICLE" "V" ON "T"."VEHICLE_ID" = "V"."ID" AND "V"."DELETED" = false
    LEFT JOIN "VEHICLE_IMAGES" "VI" ON "V"."ID" = "VI"."VEHICLE_ID" 
    WHERE "V"."CATEGORY_CODE" = $3 AND "T"."DELETED" = $4
    LIMIT $2 OFFSET (($1 - 1) * $2);`;
    const { rows } = await pool.query(query, [
      page,
      size,
      CATEGORY_CODE.SMALL_VEHICLE,
      false
    ]);
    const noOfUsers = await pool.query(
      `SELECT COUNT('ID') FROM "TRIPS" "T" LEFT JOIN "VEHICLE" "V" ON "T"."VEHICLE_ID" = "V"."ID" WHERE "V"."DELETED" = false AND "V"."CATEGORY_CODE" = $1 AND "T"."DELETED" = $2`,
      [CATEGORY_CODE.SMALL_VEHICLE, false]
    );

    const today = new Date();
    const filtered = rows.filter((item) => {
      const expiresAt = new Date(item.TO_DATE);
      return expiresAt > today;
    });
    res.status(200).json({
      currentPage: page,
      content: filtered,
      totalNoOfRecords: parseInt(noOfUsers.rows[0].count)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

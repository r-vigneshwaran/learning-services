const { pool } = require('../dao');

exports.home = async (req, res) => {
  try {
    const userData = await pool.query(
      `SELECT "T"."ID" as "TRIP_ID", "T"."FROM_LOCATION" as "FROM_LOCATION", "T"."TO_LOCATION" AS "TO_LOCATION",
      "T"."CAPACITY" AS "CAPACITY", "T"."FROM_DATE" AS "FROM_DATE", "T"."TO_DATE" AS "TO_DATE", "T"."PRICE" AS "PRICE",
      "U"."ID" AS "USER_ID", "U"."NAME" AS "NAME", "U"."EMAIL" AS "EMAIL", "U"."MOBILE" AS "MOBILE", "U"."ROLE" AS "ROLE",
      "U"."ROLE_CODE" AS "ROLE_CODE", "U"."DRIVER_LICENCE_NO" AS "DRIVER_LICENCE_NO", "U"."YEAR_OF_EXPERIENCE" AS "YEAR_OF_EXPERIENCE",
      "U"."DRIVER_LICENCE_VALIDITY" AS "DRIVER_LICENCE_VALIDITY", "V"."REG_NO" AS "REG_NO", "V"."CAPACITY_UNIT" AS "CAPACITY_UNIT",
      "V"."TYPE" AS "TYPE" , "V"."VEHICLE_NAME" AS "VEHICLE_NAME", "V"."CATEGORY_CODE" AS "CATEGORY_CODE", "V"."MODEL_YEAR" AS "MODEL_YEAR",
      "V"."RC_VALIDITY" AS "RC_VALIDITY" , "V"."OWNERSHIP" AS "OWNERSHIP", "V"."OWNER_NAME" AS "OWNERNAME", "V"."CITY" AS "CITY",
      "V"."IS_AVAILABLE" AS "IS_AVAILABLE", "V"."ID" AS "ID" , "VI"."IMAGE" AS "IMAGE"
      FROM "TRIPS" "T" LEFT JOIN "USERS" "U" ON "T"."DRIVER_ID" = "U"."ID"
      LEFT JOIN "VEHICLE" "V" ON "T"."VEHICLE_ID" = "V"."ID" AND "V"."DELETED" = false 
      LEFT JOIN "VEHICLE_IMAGES" "VI" ON "V"."ID" = "VI"."VEHICLE_ID" 
      ;`
    );
    res.json({ data: userData.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

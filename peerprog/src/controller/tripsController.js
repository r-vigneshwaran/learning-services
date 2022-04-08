const { pool } = require('../dao');
const { findVehicleWithId, findUserWithId } = require('../utils/helper');
const { deleteSensitive } = require('../utils/utility');

exports.getTripDetails = async (req, res) => {
  const { id } = req.params;
  if (!id) res.status(404).json({ message: 'insufficient data' });

  try {
    const trips = await pool.query(
      'SELECT * FROM "TRIPS" WHERE "VEHICLE_ID" = $1 ',
      [id]
    );
    res.status(200).json({ trip: trips.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.editTripDetails = async (req, res) => {
  const { id } = req.params;
  const {
    fromDate,
    toDate,
    fromLocation,
    toLocation,
    userId,
    vehicleId,
    orgId,
    availableCapacity,
    price
  } = req.body;
  if (
    !fromDate ||
    !toDate ||
    !fromLocation ||
    !toLocation ||
    !userId ||
    !vehicleId ||
    !orgId ||
    !availableCapacity ||
    !price ||
    !id
  )
    return res.status(404).json({ message: 'insufficient data' });

  try {
    const tripExist = await pool.query(
      'SELECT "ID" FROM "TRIPS" WHERE "VEHICLE_ID" = $1',
      [id]
    );
    if (tripExist.rowCount === 0) {
      return res.status(404).json({ message: 'Trip Doest not exist' });
    }

    const trips = await pool.query(
      'UPDATE "TRIPS" SET "FROM_LOCATION" = $1, "TO_LOCATION" = $2, "CAPACITY" = $3, "DRIVER_ID" = $4, "ORG_ID" = $5, "VEHICLE_ID" = $6, "FROM_DATE" = $7, "TO_DATE" = $8 , "PRICE" = $9 WHERE "VEHICLE_ID" = $10',
      [
        fromLocation,
        toLocation,
        availableCapacity,
        userId,
        orgId,
        vehicleId,
        fromDate,
        toDate,
        price,
        id
      ]
    );
    res.status(200).json({ trip: trips.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getSpecificTripDetails = async (req, res) => {
  const { id } = req.params;
  if (!id) res.status(404).json({ message: 'insufficient data' });

  try {
    const trips = await pool.query(
      `SELECT "T"."ID" as "TRIP_ID", "T"."FROM_LOCATION" as "FROM_LOCATION", "T"."TO_LOCATION" AS "TO_LOCATION",
      "T"."CAPACITY" AS "CAPACITY", "T"."FROM_DATE" AS "FROM_DATE", "T"."TO_DATE" AS "TO_DATE", "T"."PRICE" AS "PRICE",
      "U"."ID" AS "USER_ID", "U"."NAME" AS "NAME", "U"."EMAIL" AS "EMAIL", "U"."MOBILE" AS "MOBILE", "U"."ROLE" AS "ROLE",
      "U"."ROLE_CODE" AS "ROLE_CODE", "U"."DRIVER_LICENCE_NO" AS "DRIVER_LICENCE_NO", "U"."YEAR_OF_EXPERIENCE" AS "YEAR_OF_EXPERIENCE",
      "U"."DRIVER_LICENCE_VALIDITY" AS "DRIVER_LICENCE_VALIDITY", "V"."REG_NO" AS "REG_NO", "V"."CAPACITY_UNIT" AS "CAPACITY_UNIT",
      "V"."TYPE" AS "TYPE" , "V"."VEHICLE_NAME" AS "VEHICLE_NAME", "V"."CATEGORY_CODE" AS "CATEGORY_CODE", "V"."MODEL_YEAR" AS "MODEL_YEAR",
      "V"."RC_VALIDITY" AS "RC_VALIDITY" , "V"."OWNERSHIP" AS "OWNERSHIP", "V"."OWNER_NAME" AS "OWNERNAME", "V"."CITY" AS "CITY",
      "V"."IS_AVAILABLE" AS "IS_AVAILABLE", "V"."ID" AS "ID" , "VI"."IMAGE" AS "IMAGE", "V"."ID" AS "ID"
      FROM "TRIPS" "T" LEFT JOIN "USERS" "U" ON "T"."DRIVER_ID" = "U"."ID"
      LEFT JOIN "VEHICLE" "V" ON "T"."VEHICLE_ID" = "V"."ID" AND "V"."DELETED" = false 
      LEFT JOIN "VEHICLE_IMAGES" "VI" ON "V"."ID" = "VI"."VEHICLE_ID" WHERE "T"."VEHICLE_ID" = $1
      ;`,
      [id]
    );
    if (trips.rowCount === 0)
      return res.status(404).json({ message: 'Trip Not found' });

    res.status(200).json({ trip: trips.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message, trip: {} });
  }
};

const { ROLE_CODE, ROLE_NAME } = require('../config/userRoleCode');
const { pool } = require('../dao');
const { checkIfAadharExists } = require('../utils/helper');
const { deleteSensitive } = require('../utils/utility');

exports.createCustomerProfile = async (req, res) => {
  try {
    const {
      name,
      orgName,
      city,
      id,
      code,
      currentStep,
      aadharNumber,
      userImage,
      ownerShip
    } = req.body;
    if (
      !name ||
      !orgName ||
      !city ||
      !id ||
      !code ||
      !currentStep ||
      !aadharNumber ||
      !userImage ||
      !ownerShip
    )
      return res.status(400).json({ message: 'insufficent data' });

    const organization = await pool.query(
      'SELECT * FROM "ORGANIZATION" WHERE "CODE" = $1',
      [code]
    );

    if (organization.rowCount === 1)
      return res
        .status(400)
        .json({ message: `origanization ${orgName} already exist` });

    const newOrg = await pool.query(
      'INSERT INTO "ORGANIZATION" ("NAME","CODE") VALUES ($1, $2) RETURNING *',
      [orgName, code]
    );
    const nextStep = currentStep;
    var orgId = newOrg.rows[0].ID;
    const isUniqueAadhar = await checkIfAadharExists(aadharNumber);

    if (isUniqueAadhar.rowCount !== 0)
      return res
        .status(400)
        .json({ message: 'Someone has already taken this Aadhar number' });

    const newUser = await pool.query(
      'UPDATE "USERS" SET "ORG_ID" = $1, "ROLE" = $2, "ROLE_CODE" = $3, "CURRENT_STEP" = $4,"CITY" = $5,  "AADHAR_NUMBER" = $6, "OWNERSHIP" = $7, "IS_REGISTERED" = $8, "NAME" = $9 WHERE "ID"= $10 RETURNING *',
      [
        orgId,
        ROLE_NAME.CUSTOMER,
        ROLE_CODE.CUSTOMER,
        nextStep,
        city,
        aadharNumber,
        ownerShip,
        true,
        name,
        id
      ]
    );
    var newUserId = newUser.rows[0].ID;

    const newUserImg = await pool.query(
      'INSERT INTO "USER_IMAGES" ("IMAGE", "USER_ID") VALUES($1, $2) RETURNING *',
      [userImage, newUserId]
    );

    var userImgId = newUserImg.rows[0].ID;

    const userData = deleteSensitive(newUser);

    const newUserData = {
      ...userData,
      USER_IMAGE: newUserImg.rows[0].IMAGE
    };

    res.json({ userInfo: newUserData });
  } catch (error) {
    res.status(500).json({ message: error.message });
    if (orgId)
      await pool.query('DELETE FROM "ORGANIZATION" WHERE "ID" = $1', [orgId]);
    if (newUserId)
      await pool.query('DELETE FROM "USERS" WHERE "ID" = $1', [newUserId]);
    if (userImgId)
      await pool.query('DELETE FROM "USER_IMAGES" WHERE "ID" = $1', [
        userImgId
      ]);
  }
};

exports.editCustomerProfile = async (req, res) => {
  try {
    const {
      name,
      orgName,
      code,
      ownerShip,
      aadharNumber,
      orgId,
      userImage,
      userLogin,
      id
    } = req.body;
    if (
      !name ||
      !orgName ||
      !ownerShip ||
      !aadharNumber ||
      !id ||
      !userImage ||
      !userLogin ||
      !id ||
      !userImage
    )
      return res.status(400).json({ message: 'insufficent data' });

    let updatedOrgId;
    let updatedOrg;
    if (orgId) {
      const organization = await pool.query(
        'SELECT * FROM "ORGANIZATION" WHERE "ID" = $1',
        [orgId]
      );

      if (organization.rowCount === 0)
        return res
          .status(400)
          .json({ message: `origanization does not exist` });

      updatedOrg = await pool.query(
        'UPDATE "ORGANIZATION" SET "NAME" = $1, "CODE" = $2 WHERE "ID" = $3 RETURNING *',
        [orgName, code, orgId]
      );
      updatedOrgId = orgId;
    } else {
      updatedOrg = await pool.query(
        'INSERT INTO "ORGANIZATION" ("NAME","CODE") VALUES ($1, $2) RETURNING *',
        [orgName, code]
      );
      updatedOrgId = newOrg.rows[0].ID;
    }

    const newUser = await pool.query(
      'UPDATE "USERS" SET "ORG_ID" = $1, "AADHAR_NUMBER" = $2, "OWNERSHIP" = $3, "NAME" = $4, "EMAIL" = $5  WHERE "ID"= $6 RETURNING *',
      [updatedOrgId, aadharNumber, ownerShip, name, userLogin, id]
    );
    const newUserId = newUser.rows[0].ID;

    const newUserImg = await pool.query(
      'INSERT INTO "USER_IMAGES" ("IMAGE", "USER_ID") VALUES($1, $2) RETURNING *',
      [userImage, newUserId]
    );

    const userData = deleteSensitive(newUser);
    const newUserData = {
      ...userData,
      USER_IMAGE: newUserImg.rows[0].IMAGE
    };

    res.json({ profile: newUserData, organization: updatedOrg.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.bookTrip = async (req, res) => {
  try {
    const { tripId, userId, eSign, vehicleId } = req.body;
    if (!tripId || !userId || !eSign || !vehicleId)
      return res.status(400).json({ message: 'Insufficient Data' });

    const userRole = await pool.query(
      `SELECT "ROLE_CODE" FROM "USERS" WHERE "ID" = $1`,
      [userId]
    );
    if (parseInt(userRole.rows[0]) !== ROLE_CODE.CUSTOMER)
      return res
        .status(403)
        .json({ message: 'you are not a customer to book this trip' });

    const trip = await pool.query(
      'SELECT "USERS"."MOBILE" AS "MOBILE", "USERS"."NAME" AS "NAME" FROM "TRIPS" LEFT JOIN "USERS" ON "USERS"."ID" = "TRIPS"."DRIVER_ID" WHERE "TRIPS"."ID" = $1 AND "TRIPS"."DELETED" = $2',
      [tripId, false]
    );
    if (trip.rowCount === 0)
      return res
        .status(400)
        .json({ message: 'Sorry This Trip has been Expired' });

    const book = await pool.query(
      `SELECT * FROM "BOOKING" WHERE "TRIP_ID" = $1 AND "CUSTOMER_ID" = $2`,
      [tripId, userId]
    );
    if (book.rowCount !== 0)
      return res
        .status(400)
        .json({ message: 'This Trip is already booked by you' });

    const today = new Date();

    await pool.query(
      'INSERT INTO "BOOKING"("TRIP_ID", "CUSTOMER_ID", "E_SIGN", "DATE", "VEHICLE_ID") VALUES($1, $2, $3, $4, $5) RETURNING *',
      [tripId, userId, eSign, today, vehicleId]
    );
    res.status(200).json({
      message: 'Trip Booked successfully',
      isBooked: true
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.customerBookingHistory = async (req, res) => {
  let { id } = req.params;
  let { page, size } = req.query;
  if (!id) return res.status(400).json({ message: 'Insufficient Data' });
  try {
    if (!page || !size) {
      page = 1;
      size = 5;
    }
    const history = await pool.query(
      `SELECT "B"."E_SIGN", "B"."DATE", "B"."ID" AS "BOOKING_ID",
      "V"."ID" AS "VEHICLE_ID", "V"."VEHICLE_NAME", "U"."NAME" AS "DRIVER_NAME" FROM "BOOKING" "B" 
      LEFT JOIN "VEHICLE" "V" ON "B"."VEHICLE_ID" = "V"."ID"
      LEFT JOIN "TRIPS" "T" ON "B"."TRIP_ID" = "T"."ID"
      LEFT JOIN "USERS" "U" ON "T"."DRIVER_ID" = "U"."ID"
      WHERE "CUSTOMER_ID" = $3 ORDER BY "B"."ID" LIMIT $2 OFFSET (($1 - 1) * $2)`,
      [page, size, id]
    );
    const bookingCount = await pool.query(
      'SELECT COUNT("ID") FROM "BOOKING" WHERE "CUSTOMER_ID" = $1',
      [id]
    );
    res.status(200).json({
      content: history.rows,
      currentPage: page,
      totalNoOfRecords: bookingCount.rows[0]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

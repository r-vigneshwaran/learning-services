const { ROLE_CODE, ROLE_NAME } = require('../config/userRoleCode');
const { pool } = require('../dao');
const { findUserWithId, findVehicleWithId } = require('../utils/helper');
const { deleteSensitive } = require('../utils/utility');

exports.createCustomerProfile = async (req, res) => {
  try {
    const {
      name,
      orgName,
      mobile,
      city,
      id,
      code,
      currentStep,
      aadharNumber,
      userImage,
      email,
      ownerShip
    } = req.body;
    if (
      !name ||
      !orgName ||
      !mobile ||
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
    const personalEmail = email ? email : null;
    const newUser = await pool.query(
      'UPDATE "USERS" SET "MOBILE" = $1, "ORG_ID" = $2, "ROLE" = $3, "ROLE_CODE" = $4, "CURRENT_STEP" = $5,"CITY" = $6,  "AADHAR_NUMBER" = $7, "USER_IMAGE" = $8, "OWNERSHIP" = $9, "IS_REGISTERED" = $10, "PERSONAL_EMAIL" = $11, "NAME" = $12 WHERE "ID"= $13 RETURNING *',
      [
        mobile,
        newOrg.rows[0].ID,
        ROLE_NAME.CUSTOMER,
        ROLE_CODE.CUSTOMER,
        nextStep,
        city,
        aadharNumber,
        userImage,
        ownerShip,
        true,
        personalEmail,
        name,
        id
      ]
    );
    const userData = deleteSensitive(newUser);

    res.json({ userInfo: userData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.editCustomerProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      orgName,
      code,
      mobile,
      ownerShip,
      aadharNumber,
      personalEmail,
      orgId
    } = req.body;
    if (!name || !orgName || !mobile || !ownerShip || !aadharNumber || !id)
      return res.status(400).json({ message: 'insufficent data' });

    const user = await findUserWithId(id);
    if (user.rowCount === 0)
      return res.status(401).json({ message: 'User not found' });

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
      'UPDATE "USERS" SET "MOBILE" = $1, "AADHAR_NUMBER" = $2, "OWNERSHIP" = $3, "NAME" = $4, "ORG_ID" = $5, "PERSONAL_EMAIL" = $6  WHERE "ID"= $7 RETURNING *',
      [mobile, aadharNumber, ownerShip, name, updatedOrgId, personalEmail, id]
    );
    const userData = deleteSensitive(newUser);

    res.json({ profile: userData, organization: updatedOrg.rows[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.bookTrip = async (req, res) => {
  try {
    const { tripId, userId, eSign } = req.body;
    if (!tripId || !userId || !eSign)
      return res.status(400).json({ message: 'Insufficient Data' });

    const trip = await pool.query(
      'SELECT "USERS"."MOBILE" AS "MOBILE", "USERS"."NAME" AS "NAME" FROM "TRIPS" LEFT JOIN "USERS" ON "USERS"."ID" = "TRIPS"."DRIVER_ID" WHERE "TRIPS"."ID" = $1',
      [tripId]
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

    await pool.query(
      'INSERT INTO "BOOKING"("TRIP_ID", "CUSTOMER_ID", "E_SIGN") VALUES($1, $2, $3) RETURNING *',
      [tripId, userId, eSign]
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
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: 'Insufficient Data' });
  try {
    const history = await pool.query('SELECT * FROM ""');
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

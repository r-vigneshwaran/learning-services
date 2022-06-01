const { pool } = require('../dao');
const {
  findVehicleWithId,
  checkIfUserExists,
  checkIfUserRevoked,
  findUser,
  findUserWithId
} = require('../utils/helper');
const { deleteSensitive } = require('../utils/utility');
const bcrypt = require('bcrypt');

exports.getUsers = async (req, res) => {
  const { page, size } = req.query;
  if (!page || !size)
    return res.status(404).json({ message: 'Insufficient Data' });

  try {
    const query = ` SELECT "ID", "NAME", "EMAIL", "MOBILE", "ROLE" FROM "USERS" ORDER BY "USERS"."ID" LIMIT $2 OFFSET (($1 - 1) * $2)`;
    const { rows } = await pool.query(query, [page, size]);
    const noOfRecords = await pool.query('SELECT count("ID") FROM "USERS"');

    res.status(200).json({
      currentPage: page,
      content: rows,
      totalNoOfRecords: noOfRecords.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getVehicles = async (req, res) => {
  const { page, size } = req.query;
  if (!page || !size)
    return res.status(404).json({ message: 'Insufficient Data' });

  try {
    const query = `SELECT "ID", "REG_NO", "VEHICLE_NAME", "OWNER_NAME", "TYPE" FROM "VEHICLE" ORDER BY "VEHICLE"."ID" LIMIT $2 OFFSET (($1 - 1) * $2)`;
    const { rows } = await pool.query(query, [page, size]);
    const noOfRecords = await pool.query('SELECT count("ID") FROM "VEHICLE"');

    res.status(200).json({
      currentPage: page,
      content: rows,
      totalNoOfRecords: noOfRecords.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrganizations = async (req, res) => {
  const { page, size } = req.query;
  if (!page || !size)
    return res.status(404).json({ message: 'Insufficient Data' });

  try {
    const query = `SELECT "O"."ID" AS "ORG_ID", "O"."NAME" AS "ORG_NAME", "O"."CODE" AS "ORG_CODE", "U"."NAME" AS "USER_NAME", "U"."ID" AS "ID" FROM "ORGANIZATION" "O" LEFT JOIN "USERS" "U" ON "O"."ID" = "U"."ORG_ID" ORDER BY "O"."ID" LIMIT $2 OFFSET (($1 - 1) * $2)`;
    const { rows } = await pool.query(query, [page, size]);
    const noOfRecords = await pool.query(
      'SELECT count("ID") FROM "ORGANIZATION"'
    );

    res.status(200).json({
      currentPage: page,
      content: rows,
      totalNoOfRecords: noOfRecords.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getQueries = async (req, res) => {
  const { page, size } = req.query;
  if (!page || !size)
    return res.status(404).json({ message: 'Insufficient Data' });

  try {
    const query = `SELECT * FROM "QUERIES" "Q" ORDER BY "Q"."ID" LIMIT $2 OFFSET (($1 - 1) * $2)`;
    const { rows } = await pool.query(query, [page, size]);
    const noOfRecords = await pool.query('SELECT count("ID") FROM "QUERIES"');

    res.status(200).json({
      currentPage: page,
      content: rows,
      totalNoOfRecords: noOfRecords.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTrips = async (req, res) => {
  const { page, size } = req.query;
  if (!page || !size)
    return res.status(404).json({ message: 'Insufficient Data' });

  try {
    const query = `SELECT "T"."ID" as "TRIP_ID", "T"."FROM_LOCATION" as "FROM_LOCATION", "T"."TO_LOCATION" AS "TO_LOCATION",
   "T"."FROM_DATE" AS "FROM_DATE", "T"."TO_DATE" AS "TO_DATE", "T"."PRICE" AS "PRICE",
   "U"."ID" AS "USER_ID", "U"."NAME" AS "NAME", "V"."REG_NO" AS "REG_NO",
   "V"."TYPE" AS "TYPE" , "V"."VEHICLE_NAME" AS "VEHICLE_NAME",
   "V"."IS_AVAILABLE" AS "IS_AVAILABLE", "V"."ID" AS "ID"
   FROM "TRIPS" "T" LEFT JOIN "USERS" "U" ON "T"."DRIVER_ID" = "U"."ID"
   LEFT JOIN "VEHICLE" "V" ON "T"."VEHICLE_ID" = "V"."ID" AND "V"."DELETED" = false 
   ORDER BY "T"."ID" LIMIT $2 OFFSET (($1 - 1) * $2);`;
    const { rows } = await pool.query(query, [page, size]);
    const noOfRecords = await pool.query('SELECT count("ID") FROM "TRIPS"');

    res.status(200).json({
      currentPage: page,
      content: rows,
      totalNoOfRecords: noOfRecords.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBookings = async (req, res) => {
  const { page, size } = req.query;
  if (!page || !size)
    return res.status(404).json({ message: 'Insufficient Data' });

  try {
    const query = `SELECT "B"."CUSTOMER_ID", "T"."FROM_LOCATION", "T"."TO_LOCATION",
    "T"."PRICE", "T"."FROM_DATE", "T"."TO_DATE", "B"."VEHICLE_ID", "V"."VEHICLE_NAME",
    "U"."NAME", "B"."ID" FROM "BOOKING" "B" LEFT JOIN "TRIPS" "T" ON "B"."TRIP_ID" = "T"."ID"
    LEFT JOIN "VEHICLE" "V" ON "V"."ID" = "B"."VEHICLE_ID"
    LEFT JOIN "USERS" "U" ON "U"."ID" = "B"."CUSTOMER_ID" ORDER BY "B"."ID" LIMIT $2 OFFSET (($1 - 1) * $2);`;
    const { rows } = await pool.query(query, [page, size]);
    const noOfRecords = await pool.query('SELECT count("ID") FROM "BOOKING"');

    res.status(200).json({
      currentPage: page,
      content: rows,
      totalNoOfRecords: noOfRecords.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUsersBasedOnRole = async (req, res) => {
  const { page, size, role } = req.query;
  if (!page || !size || !role)
    return res.status(404).json({ message: 'Insufficient Data' });

  try {
    const query = `SELECT "ID", "NAME", "EMAIL", "MOBILE", "ROLE" FROM "USERS" WHERE "USERS"."DELETED" = false AND "ROLE" = $3 ORDER BY "USERS"."ID" LIMIT $2 OFFSET (($1 - 1) * $2)`;
    const { rows } = await pool.query(query, [page, size, role]);
    const noOfRecords = await pool.query(
      'SELECT count("ID") FROM "USERS" WHERE "ROLE" = $1',
      [role]
    );

    res.status(200).json({
      currentPage: page,
      content: rows,
      totalNoOfRecords: noOfRecords.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getVehiclesBasedOncategory = async (req, res) => {
  const { page, size, category } = req.query;
  if (!page || !size || !category)
    return res.status(404).json({ message: 'Insufficient Data' });

  try {
    const query = `SELECT "ID", "REG_NO", "VEHICLE_NAME", "OWNER_NAME", "TYPE" FROM "VEHICLE" WHERE "CATEGORY_CODE" = $3 ORDER BY "VEHICLE"."ID" LIMIT $2 OFFSET (($1 - 1) * $2)`;
    const { rows } = await pool.query(query, [page, size, category]);
    const noOfRecords = await pool.query(
      'SELECT count("ID") FROM "VEHICLE" WHERE "CATEGORY_CODE" = $1',
      [category]
    );

    res.status(200).json({
      currentPage: page,
      content: rows,
      totalNoOfRecords: noOfRecords.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserDetails = async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(404).json({ message: 'Insufficient Data' });
  const user = await pool.query(
    `SELECT *,"U"."ID" AS "USER_ID", "U"."NAME" AS "USER_NAME", "UI"."IMAGE" AS "USER_IMAGE", "O"."NAME" AS "ORG_NAME" FROM "USERS" "U" LEFT JOIN "USER_IMAGES" "UI" ON "U"."ID" = "UI"."USER_ID" LEFT JOIN "ORGANIZATION" "O" ON "U"."ORG_ID" = "O"."ID"  WHERE "U"."ID" = $1`,
    [id]
  );

  if (user.rowCount === 0) {
    return res.status(404).json({ message: 'User Not Found' });
  }

  const orgId = user.rows[0].ORG_ID;

  const vehicles = await findVehicleWithId(orgId, false);

  const trips = await pool.query(
    'SELECT * FROM "TRIPS" WHERE "DRIVER_ID" = $1',
    [id]
  );
  const bookings = await pool.query(
    `SELECT "B"."E_SIGN", "B"."DATE", "B"."ID" AS "BOOKING_ID",
    "V"."ID" AS "VEHICLE_ID", "V"."VEHICLE_NAME", "U"."NAME" AS "DRIVER_NAME" FROM "BOOKING" "B" 
    LEFT JOIN "VEHICLE" "V" ON "B"."VEHICLE_ID" = "V"."ID"
    LEFT JOIN "TRIPS" "T" ON "B"."TRIP_ID" = "T"."ID"
    LEFT JOIN "USERS" "U" ON "T"."DRIVER_ID" = "U"."ID"
    WHERE "CUSTOMER_ID" = $1`,
    [id]
  );

  const userData = deleteSensitive(user);

  res.status(200).json({
    userData: userData,
    vehicles: vehicles.rows,
    noOfVehicleOwned: vehicles.rowCount,
    trips: trips.rows,
    noOftrip: trips.rowCount,
    bookings: bookings.rows,
    noOfBookings: bookings.rowCount
  });

  try {
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getQueryDetails = async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(404).json({ message: 'Insufficient Data' });

  const query = await pool.query('SELECT * FROM "QUERIES" WHERE "ID" = $1', [
    id
  ]);

  res.status(200).json({
    queryDetails: query.rows[0]
  });
  try {
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getVehicleDetails = async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(404).json({ message: 'Insufficient Data' });
  const vehicle = await pool.query(
    `SELECT *,"V"."ID" AS "ID" FROM "VEHICLE" "V" LEFT JOIN "VEHICLE_IMAGES" "VI" ON "V"."ID" = "VI"."VEHICLE_ID" WHERE "V"."ID" = $1`,
    [id]
  );

  if (vehicle.rowCount === 0) {
    return res.status(404).json({ message: 'Vehicle Not Found' });
  }
  const orgId = vehicle.rows[0].ORG_ID;

  const userDetails = await pool.query(
    'SELECT "ID" FROM "USERS" WHERE "ORG_ID" = $1',
    [orgId]
  );
  const userId = userDetails.rows[0].ID;

  const user = await pool.query(
    `SELECT "U"."ID" AS "USER_ID", "U"."NAME" AS "USER_NAME", "U"."EMAIL", "U"."CITY", "UI"."IMAGE" AS "USER_IMAGE" FROM "USERS" "U" LEFT JOIN "USER_IMAGES" "UI" ON "U"."ID" = "UI"."USER_ID" WHERE "U"."ID" = $1 `,
    [userId]
  );

  const trips = await pool.query(
    'SELECT * FROM "TRIPS" WHERE "VEHICLE_ID" = $1',
    [id]
  );

  res.status(200).json({
    userDetails: user.rows[0],
    vehicleData: vehicle.rows[0],
    trips: trips.rows,
    noOftrip: trips.rowCount
  });

  try {
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTripDetails = async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(404).json({ message: 'Insufficient Data' });

  try {
    const query = `SELECT "T"."ID" as "TRIP_ID", "T"."FROM_LOCATION" as "FROM_LOCATION", "T"."TO_LOCATION" AS "TO_LOCATION",
    "T"."CAPACITY" AS "CAPACITY", "T"."FROM_DATE" AS "FROM_DATE", "T"."TO_DATE" AS "TO_DATE", "T"."PRICE" AS "PRICE",
    "U"."ID" AS "USER_ID", "U"."ORG_ID" AS "ORG_ID","U"."NAME" AS "NAME", "U"."EMAIL" AS "EMAIL", "U"."MOBILE" AS "MOBILE",
    "U"."DRIVER_LICENCE_NO" AS "DRIVER_LICENCE_NO", "U"."YEAR_OF_EXPERIENCE" AS "YEAR_OF_EXPERIENCE",
    "U"."DRIVER_LICENCE_VALIDITY" AS "DRIVER_LICENCE_VALIDITY", "V"."REG_NO" AS "REG_NO", "V"."CAPACITY_UNIT" AS "CAPACITY_UNIT",
    "V"."TYPE" AS "TYPE" , "V"."VEHICLE_NAME" AS "VEHICLE_NAME", "V"."CATEGORY_CODE" AS "CATEGORY_CODE", "V"."MODEL_YEAR" AS "MODEL_YEAR",
    "V"."RC_VALIDITY" AS "RC_VALIDITY" , "V"."OWNERSHIP" AS "OWNERSHIP", "V"."OWNER_NAME" AS "OWNERNAME", "V"."CITY" AS "CITY",
    "V"."IS_AVAILABLE" AS "IS_AVAILABLE", "V"."ID" AS "VEHICLE_ID" , "VI"."IMAGE" AS "VEHICLE_IMAGE",
    "B"."CUSTOMER_ID" AS "CUSTOMER_ID", "UI"."IMAGE" AS "USER_IMAGE"
    FROM "TRIPS" "T" LEFT JOIN "USERS" "U" ON "T"."DRIVER_ID" = "U"."ID"
    LEFT JOIN "VEHICLE" "V" ON "T"."VEHICLE_ID" = "V"."ID" AND "V"."DELETED" = false 
    LEFT JOIN "BOOKING" "B" ON "T"."ID" = "B"."TRIP_ID"
    LEFT JOIN "VEHICLE_IMAGES" "VI" ON "V"."ID" = "VI"."VEHICLE_ID"
    LEFT JOIN "USER_IMAGES" "UI" ON "U"."ID" = "UI"."USER_ID"
    WHERE "T"."ID" = $1`;
    const { rows } = await pool.query(query, [id]);
    const noOfRecords = await pool.query(
      'SELECT count("ID") FROM "BOOKING" WHERE "TRIP_ID" = $1',
      [id]
    );

    res.status(200).json({
      tripData: rows[0],
      noOfBookings: noOfRecords.rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBookingDetails = async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(404).json({ message: 'Insufficient Data' });

  try {
    const query = `SELECT "B"."CUSTOMER_ID", "T"."FROM_LOCATION", "T"."TO_LOCATION",
    "T"."PRICE", "T"."FROM_DATE", "T"."TO_DATE", "B"."VEHICLE_ID", "V"."VEHICLE_NAME",
    "VI"."IMAGE" AS "VEHICLE_IMAGE", "UI"."IMAGE" AS "USER_IMAGE", "U"."ID" AS "USER_ID",
    "V"."ID" AS "VEHICLE_ID","V"."VEHICLE_NAME" AS "VEHICLE_NAME","V"."REG_NO", "T"."ID" AS "TRIP_ID",
    "U"."EMAIL", "U"."CITY" AS "CUSTOMER_CITY", "V"."TYPE", "V"."MODEL_YEAR", "V"."CITY" AS "VEHICLE_CITY",
    "U"."NAME" AS "CUSTOMER_NAME", "B"."ID" FROM "BOOKING" "B"
    LEFT JOIN "TRIPS" "T" ON "B"."TRIP_ID" = "T"."ID"
    LEFT JOIN "VEHICLE" "V" ON "V"."ID" = "B"."VEHICLE_ID"
    LEFT JOIN "VEHICLE_IMAGES" "VI" ON "V"."ID" = "VI"."VEHICLE_ID"
    LEFT JOIN "USERS" "U" ON "U"."ID" = "B"."CUSTOMER_ID"
    LEFT JOIN "USER_IMAGES" "UI" ON "U"."ID" = "UI"."USER_ID"
    WHERE "B"."ID" = $1
    `;
    const { rows } = await pool.query(query, [id]);

    res.status(200).json({
      bookingData: rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrganizationDetails = async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(404).json({ message: 'Insufficient Data' });

  try {
    const query = `SELECT "UI"."IMAGE" AS "USER_IMAGE", "O"."ID" AS "ORG_ID", "O"."NAME" AS "ORG_NAME", "O"."CODE" AS "ORG_CODE", "U"."NAME" AS "USER_NAME", "U"."ID" AS "ID" FROM "ORGANIZATION" "O" LEFT JOIN "USERS" "U" ON "O"."ID" = "U"."ORG_ID" LEFT JOIN "USER_IMAGES" "UI" ON "U"."ID" = "UI"."USER_ID" WHERE "O"."ID" = $1`;
    const { rows } = await pool.query(query, [id]);

    res.status(200).json({
      orgDetails: rows[0]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(404).json({ message: 'Insufficient Data' });

  const user = await checkIfUserExists(id);

  if (user.rowCount === 0) {
    return res.status(404).json({ message: 'User Not Found' });
  }
  if (user.rows[0].DELETED) {
    return res
      .status(404)
      .json({ message: 'User Account has been already deleted' });
  }
  await pool.query(
    'UPDATE "USERS" SET "DELETED" = $1, "REFRESH_TOKEN" = $2 WHERE "ID" = $3',
    [true, null, id]
  );
  res
    .status(200)
    .json({ message: 'User Account has been deleted successfully' });
  try {
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteQuery = async (req, res) => {
  const { id } = req.query;
  if (!id) return res.status(404).json({ message: 'Insufficient Data' });

  await pool.query(`DELETE FROM "QUERIES" WHERE "ID" = $1`, [id]);
  res.status(200).json({ message: 'Query deleted successfully' });

  try {
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.recoverVehicle = async (req, res) => {
  const { vehicleId } = req.body;
  if (!vehicleId) return res.status(404).json({ message: 'Insufficient Data' });

  await pool.query('UPDATE "VEHICLE" SET "DELETED" = $1 WHERE "ID" = $2', [
    false,
    vehicleId
  ]);
  res.status(200).json({ message: 'Vehicle Recovered successfully' });
  try {
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.revokeUser = async (req, res) => {
  const { id, expiresAt } = req.body;
  if (!id || !expiresAt)
    return res.status(404).json({ message: 'Insufficient Data' });

  const isRevoked = await checkIfUserRevoked(id);
  if (isRevoked.rowCount === 0) {
    return res.status(404).json({ message: 'User Not Found' });
  }
  if (isRevoked) {
    return res.status(404).json({ message: 'User has been already Revoked' });
  }

  await pool.query(
    'UPDATE "USERS" SET "REVOKE_EXPIRES_AT" = $1, "REFRESH_TOKEN" = $2 WHERE "ID" = $3',
    [expiresAt, null, id]
  );
  res
    .status(200)
    .json({ message: 'User Account has been revoked successfully' });

  try {
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.unBlockUser = async (req, res) => {
  const { id } = req.body;

  if (!id) return res.status(404).json({ message: 'Insufficient Data' });

  const isRevoked = await checkIfUserRevoked(id);
  if (isRevoked.rowCount === 0) {
    return res.status(404).json({ message: 'User Not Found' });
  }
  if (!isRevoked) {
    return res.status(404).json({ message: 'User is not revoked, to unblock' });
  }

  await pool.query(
    'UPDATE "USERS" SET "REVOKE_EXPIRES_AT" = $1, "REFRESH_TOKEN" = $2 WHERE "ID" = $3',
    [null, null, id]
  );
  res
    .status(200)
    .json({ message: 'User Account has been Unblocked successfully' });

  try {
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.editUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      mobile,
      city,
      orgName,
      licenceNumber,
      yearOfExperience,
      licenceValidity,
      aadharNumber,
      ownerShip,
      orgId,
      code
    } = req.body;
    if (
      !name ||
      !id ||
      !orgName ||
      !licenceNumber ||
      !yearOfExperience ||
      !licenceValidity ||
      !aadharNumber ||
      !ownerShip ||
      !code ||
      !orgId ||
      !email ||
      !mobile ||
      !city
    )
      return res.status(400).json({ message: 'insufficent data' });

    const user = await checkIfUserExists(id);
    if (user.rowCount === 0)
      return res.status(401).json({ message: 'User not found' });

    const organization = await pool.query(
      'SELECT * FROM "ORGANIZATION" WHERE "ID" = $1',
      [orgId]
    );

    if (organization.rowCount === 0)
      return res.status(400).json({ message: `origanization does not exist` });

    const updatedOrg = await pool.query(
      'UPDATE "ORGANIZATION" SET "NAME" = $1, "CODE" = $2 WHERE "ID" = $3 RETURNING "NAME" AS "ORG_NAME"',
      [orgName, code, orgId]
    );

    const newUser = await pool.query(
      'UPDATE "USERS" SET "NAME" = $1, "DRIVER_LICENCE_NO" = $2, "YEAR_OF_EXPERIENCE" = $3, "DRIVER_LICENCE_VALIDITY" = $4, "AADHAR_NUMBER" = $5, "OWNERSHIP" = $6, "EMAIL" = $7, "MOBILE" = $8, "CITY" = $9  WHERE "ID"= $10 RETURNING *,"NAME" AS "USER_NAME"',
      [
        name,
        licenceNumber,
        yearOfExperience,
        licenceValidity,
        aadharNumber,
        ownerShip,
        email,
        mobile,
        city,
        id
      ]
    );
    const userData = deleteSensitive(newUser);

    res.json({
      userData: { ...userData, ...updatedOrg.rows[0] }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.editOrg = async (req, res) => {
  try {
    const { orgId, orgName, code } = req.body;
    if (!orgId || !orgName)
      return res.status(400).json({ message: 'insufficent data' });

    const organization = await pool.query(
      'SELECT * FROM "ORGANIZATION" WHERE "ID" = $1',
      [orgId]
    );

    if (organization.rowCount === 0)
      return res.status(400).json({ message: `origanization does not exist` });

    await pool.query(
      'UPDATE "ORGANIZATION" SET "NAME" = $1, "CODE" = $2 WHERE "ID" = $3 RETURNING "NAME" AS "ORG_NAME"',
      [orgName, code, orgId]
    );
    res.status(200).json({ message: 'Organization Name updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addUserProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      city,
      orgName,
      licenceNumber,
      yearOfExperience,
      licenceValidity,
      aadharNumber,
      ownerShip,
      code,
      password,
      confirmPassword,
      role,
      roleCode,
      userImage
    } = req.body;
    if (
      !name ||
      !licenceNumber ||
      !yearOfExperience ||
      !licenceValidity ||
      !aadharNumber ||
      !ownerShip ||
      !code ||
      !email ||
      !city ||
      !password ||
      !confirmPassword ||
      !role ||
      !roleCode
    )
      return res.status(400).json({ message: 'insufficent data' });

    if (!userImage)
      return res.status(400).json({ message: 'User Image is required' });

    if (password !== confirmPassword) {
      return res
        .status(404)
        .json({ message: 'Password and Confirm password should be same' });
    }

    const user = await findUser(email);
    if (user.rows.length !== 0) {
      return res
        .status(409)
        .json({ message: 'User already exists with this Email' });
    }

    const organization = await pool.query(
      'SELECT * FROM "ORGANIZATION" WHERE "CODE" = $1',
      [code]
    );

    if (organization.rowCount === 1)
      return res
        .status(400)
        .json({ message: `origanization ${orgName} already exist` });

    const newOrg = await pool.query(
      'INSERT INTO "ORGANIZATION" ("NAME","IS_ACTIVE","CODE") VALUES ($1, $2, $3) RETURNING *',
      [orgName, true, code]
    );
    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const bcryptPassword = await bcrypt.hash(password, salt);

    const orgId = newOrg.rows[0].ID;
    const newUser = await pool.query(
      `INSERT INTO "USERS" ("NAME", "DRIVER_LICENCE_NO", "YEAR_OF_EXPERIENCE",
      "DRIVER_LICENCE_VALIDITY", "AADHAR_NUMBER", "OWNERSHIP", "EMAIL",
      "CITY", "PASSWORD", "ROLE", "ROLE_CODE", "IS_REGISTERED", "VERIFIED", "CURRENT_STEP","ORG_ID")
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [
        name,
        licenceNumber,
        yearOfExperience,
        licenceValidity,
        aadharNumber,
        ownerShip,
        email,
        city,
        bcryptPassword,
        role,
        roleCode,
        true,
        true,
        4,
        orgId
      ]
    );

    const newUserId = newUser.rows[0].ID;

    await pool.query(
      'INSERT INTO "USER_IMAGES" ("IMAGE", "USER_ID") VALUES($1, $2) RETURNING *',
      [userImage, newUserId]
    );

    res.json({
      message: 'User Added successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.writeMessage = async (req, res) => {
  const { message, userId, type } = req.body;
  const today = new Date();
  let params;
  const query = `INSERT INTO "MESSAGES" ("USER_ID", "IS_SINGLE_USER", "IS_GROUP", "IS_CATEGORY", "IS_BROADCAST", "MESSAGE", "CREATED_AT") VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
  switch (type) {
    case 'SINGLE':
      params = [Array[userId], true, false, false, false, message, today];
      break;
    case 'GROUP':
      params = [Array[userId], false, true, false, false, message, today];
      break;
    case 'CATEGORY':
      params = [null, false, true, 'DRIVER', false, message, today];
      break;
    case 'BROADCAST':
      params = [null, false, true, false, true, message, today];
      break;
    default:
      params = [Array[userId], true, false, false, false, message, today];
      break;
  }
  var authors = ['a', 'b', 'c'];

  var result = userId.reduce(function (author, val, index) {
    var comma = author.length ? ',' : '';
    return author + comma + val;
  }, '');
  
  res.json({ results: result });
};

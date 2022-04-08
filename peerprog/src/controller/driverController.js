const { ROLE_CODE, ROLE_NAME } = require('../config/userRoleCode');
const { pool } = require('../dao');
const { findUserWithId, findVehicleWithId } = require('../utils/helper');
const { deleteSensitive } = require('../utils/utility');

exports.createProfile = async (req, res) => {
  try {
    const {
      id,
      name,
      isActive = false,
      orgName,
      mobile,
      city,
      code,
      currentStep,
      licenceNumber,
      yearOfExperience,
      licenceValidity,
      aadharNumber,
      userImage
    } = req.body;
    if (
      !name ||
      !id ||
      !orgName ||
      !mobile ||
      !city ||
      !code ||
      !currentStep ||
      !licenceNumber ||
      !yearOfExperience ||
      !licenceValidity ||
      !aadharNumber ||
      !userImage
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
      'INSERT INTO "ORGANIZATION" ("NAME","IS_ACTIVE","CODE") VALUES ($1, $2, $3) RETURNING *',
      [orgName, isActive, code]
    );
    const nextStep = currentStep + 1;
    const newUser = await pool.query(
      'UPDATE "USERS" SET "MOBILE" = $1, "ORG_ID" = $2, "ROLE" = $3, "ROLE_CODE" = $4, "CURRENT_STEP" = $5, "DRIVER_LICENCE_NO" = $6, "YEAR_OF_EXPERIENCE" = $7, "DRIVER_LICENCE_VALIDITY" = $8, "AADHAR_NUMBER" = $9, "USER_IMAGE" = $10 WHERE "ID"= $11 RETURNING *',
      [
        mobile,
        newOrg.rows[0].ID,
        ROLE_NAME.DRIVER,
        ROLE_CODE.DRIVER,
        nextStep,
        licenceNumber,
        yearOfExperience,
        licenceValidity,
        aadharNumber,
        userImage,
        id
      ]
    );
    const userData = deleteSensitive(newUser);

    res.json({ userInfo: userData });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

exports.addVehicle = async (req, res) => {
  const {
    regNo,
    orgId,
    capacityUnit,
    type,
    vehicleName,
    categoryCode,
    modelYear,
    RcValidity,
    ownerShip,
    ownerName,
    city,
    vehicleImage
  } = req.body;

  if (
    !regNo ||
    !orgId ||
    !capacityUnit ||
    !type ||
    !vehicleName ||
    !categoryCode ||
    !modelYear ||
    !RcValidity ||
    !ownerShip ||
    !ownerName ||
    !city ||
    !vehicleImage
  )
    return res.status(404).json({ message: 'insufficient data' });
  try {
    const org = await pool.query(
      'SELECT * FROM "ORGANIZATION" WHERE "ID" = $1',
      [orgId]
    );
    if (org.rowCount === 0) {
      return res
        .status(404)
        .json({ message: 'No Organization found with this details' });
    }
    const uniqueVehicle = await pool.query(
      'SELECT * FROM "VEHICLE" WHERE "REG_NO" = $1',
      [regNo]
    );
    if (uniqueVehicle.rowCount !== 0) {
      return res.status(404).json({
        message: 'There is already one vehicle registered with this number'
      });
    }

    const vehicleDetails = await pool.query(
      'INSERT INTO "VEHICLE" ("REG_NO", "ORG_ID", "CAPACITY_UNIT", "TYPE", "VEHICLE_NAME", "CATEGORY_CODE", "MODEL_YEAR", "RC_VALIDITY", "OWNERSHIP", "OWNER_NAME", "CITY") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [
        regNo,
        orgId,
        capacityUnit,
        type,
        vehicleName,
        categoryCode,
        modelYear,
        RcValidity,
        ownerShip,
        ownerName,
        city
      ]
    );
    const vehicleId = vehicleDetails.rows[0].ID;

    const vehicleImageTable = await pool.query(
      'INSERT INTO "VEHICLE_IMAGES" ("IMAGE", "VEHICLE_ID") VALUES($1, $2) RETURNING *',
      [vehicleImage, vehicleId]
    );

    const vehicleData = {
      ...vehicleDetails.rows[0],
      VEHICLE_IMAGE: vehicleImageTable.rows[0].IMAGE
    };
    res.status(200).json({
      message: 'Vehicle Added to profile successfully',
      vehicle: vehicleData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.editVehicle = async (req, res) => {
  const {
    regNo,
    orgId,
    capacityUnit,
    type,
    vehicleName,
    categoryCode,
    modelYear,
    RcValidity,
    ownerShip,
    ownerName,
    city,
    vehicleImage,
    vId
  } = req.body;

  if (
    !regNo ||
    !orgId ||
    !capacityUnit ||
    !type ||
    !vehicleName ||
    !categoryCode ||
    !modelYear ||
    !RcValidity ||
    !ownerShip ||
    !ownerName ||
    !city ||
    !vehicleImage ||
    !vId
  )
    return res.status(404).json({ message: 'insufficient data' });
  try {
    const org = await pool.query(
      'SELECT * FROM "ORGANIZATION" WHERE "ID" = $1',
      [orgId]
    );
    if (org.rowCount === 0) {
      return res
        .status(404)
        .json({ message: 'No Organization found with this details' });
    }
    const uniqueVehicle = await pool.query(
      'SELECT * FROM "VEHICLE" WHERE "ID" = $1',
      [vId]
    );
    if (uniqueVehicle.rowCount === 0) {
      return res.status(404).json({
        message: 'There is no vehicle found with this id under your profile'
      });
    }

    const vehicleDetails = await pool.query(
      'UPDATE "VEHICLE" SET "REG_NO" = $1, "ORG_ID" = $2, "CAPACITY_UNIT" = $3, "TYPE" = $4, "VEHICLE_NAME" = $5, "CATEGORY_CODE" = $6, "MODEL_YEAR" = $7, "RC_VALIDITY" = $8, "OWNERSHIP" = $9, "OWNER_NAME" = $10, "CITY" = $11   WHERE "ID" = $12 RETURNING *',
      [
        regNo,
        orgId,
        capacityUnit,
        type,
        vehicleName,
        categoryCode,
        modelYear,
        RcValidity,
        ownerShip,
        ownerName,
        city,
        vId
      ]
    );

    const vehicleId = vehicleDetails.rows[0].ID;

    const vehicleImageTable = await pool.query(
      'UPDATE "VEHICLE_IMAGES" SET "IMAGE" = $1 WHERE "VEHICLE_ID" = $2 RETURNING *',
      [vehicleImage, vehicleId]
    );
    const vehicleData = {
      ...vehicleDetails.rows[0],
      VEHICLE_IMAGE: vehicleImageTable.rows[0].IMAGE
    };
    res.status(200).json({
      message: 'Vehicle has been updated successfully',
      vehicle: vehicleData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProfileVehicles = async (req, res) => {
  const { orgId } = req.body;
  if (!orgId) return res.status(404).json({ message: 'insufficient data' });
  try {
    const organization = await pool.query(
      'SELECT * FROM "ORGANIZATION" WHERE "ID" = $1',
      [orgId]
    );
    if (organization.rowCount === 0) {
      return res.status(404).json({ message: 'organization not found' });
    }
    const vehicle = await findVehicleWithId(orgId);
    if (vehicle.rowCount === 0) {
      return res.status(200).json({
        message: 'This profile does not contain any vehicles',
        vehicles: []
      });
    }
    res
      .status(200)
      .json({ vehicles: vehicle.rows, noOfVehicles: vehicle.rowCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteVehicle = async (req, res) => {
  const { vehicleId, orgId } = req.params;
  if (!vehicleId || !orgId)
    return res.status(404).json({ message: 'insufficient data' });

  try {
    const vehicle = await pool.query(
      'SELECT * FROM "VEHICLE" LEFT JOIN "VEHICLE_IMAGES" ON "VEHICLE_IMAGES"."VEHICLE_ID" = "VEHICLE"."ID" WHERE "ORG_ID" = $1 AND "VEHICLE"."ID" = $2 AND "DELETED" = $3',
      [orgId, vehicleId, false]
    );
    if (vehicle.rowCount === 0) {
      return res.status(200).json({
        message: 'This profile does not own this vehicle or already deleted',
        vehicles: []
      });
    }
    await pool.query(
      `DELETE FROM "VEHICLE_IMAGES" WHERE "VEHICLE_ID" = ( SELECT "ID" from "VEHICLE" where "ID" = $1)`,
      [vehicleId]
    );
    await pool.query('UPDATE "VEHICLE" SET "DELETED" = $1 WHERE "ID" = $2', [
      true,
      vehicleId
    ]);
    res.status(200).json({ message: 'Vehicle Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.completeRegistration = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(404).json({ message: 'insufficient data' });

  try {
    const user = await findUserWithId(id);
    if (user.rowCount === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const isVerified = user.rows[0].VERIFIED;
    const isRegistered = user.rows[0].IS_REGISTERED;
    if (!isVerified)
      return res.status(403).json({ message: 'verify your account' });

    if (isRegistered)
      return res
        .status(409)
        .json({ message: 'Account has been already registered' });

    const response = await pool.query(
      'UPDATE "USERS" SET "IS_REGISTERED" = $1 WHERE "ID" = $2 RETURNING *',
      [true, id]
    );
    const userData = deleteSensitive(response);
    res.status(200).json({
      message: 'Registration Completed Successfully',
      userInfo: userData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addVehicleAvailability = async (req, res) => {
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
    !price
  )
    return res.status(404).json({ message: 'insufficient data' });

  try {
    const user = await findUserWithId(userId);
    if (user.rowCount === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const isVerified = user.rows[0].VERIFIED;
    const isRegistered = user.rows[0].IS_REGISTERED;

    if (!isVerified)
      return res.status(403).json({
        message: 'Please verify your account to add vehicle to your profile'
      });

    if (!isRegistered)
      return res.status(403).json({
        message: 'Please Register your account to add vehicle to your profile'
      });

    const vehicle = await pool.query(
      'SELECT * FROM "VEHICLE" LEFT JOIN "VEHICLE_IMAGES" ON "VEHICLE_IMAGES"."VEHICLE_ID" = "VEHICLE"."ID" WHERE "ORG_ID" = $1 AND "VEHICLE"."ID" = $2 AND "DELETED" = $3',
      [orgId, vehicleId, false]
    );
    if (vehicle.rowCount === 0) {
      return res.status(200).json({
        message: 'This profile does not contain any vehicles',
        vehicles: []
      });
    }
    const tripsCheck = await pool.query(
      'SELECT * FROM "TRIPS" WHERE "VEHICLE_ID" = $1',
      [vehicleId]
    );
    if (tripsCheck.rowCount !== 0) {
      return res.status(200).json({
        message: 'This trip already exists',
        vehicles: []
      });
    }

    await pool.query(
      'INSERT INTO "TRIPS" ("FROM_LOCATION", "TO_LOCATION", "CAPACITY", "DRIVER_ID", "ORG_ID", "VEHICLE_ID", "FROM_DATE", "TO_DATE" , "PRICE") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [
        fromLocation,
        toLocation,
        availableCapacity,
        userId,
        orgId,
        vehicleId,
        fromDate,
        toDate,
        price
      ]
    );
    const IS_AVAILABLE = true;
    const vehicleResponse = await pool.query(
      'UPDATE "VEHICLE" SET "IS_AVAILABLE" = $1 WHERE "ID" = $2  RETURNING *',
      [IS_AVAILABLE, vehicleId]
    );
    res.json({
      vehicleDetails: vehicleResponse.rows[0],
      message: 'You have successfully added availability to the vehicle'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

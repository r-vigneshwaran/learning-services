const { ROLE_CODE, ROLE_NAME } = require('../config/userRoleCode');
const { pool } = require('../dao');
const {
  findUserWithId,
  findVehicleWithId,
  checkIfAadharExists,
  checkIfLicenceExists,
  checkIfUserExists,
  checkIfOthersVerified,
  resetOthersVerified
} = require('../utils/helper');
const { deleteSensitive } = require('../utils/utility');

exports.createDriverProfile = async (req, res) => {
  try {
    const {
      id,
      name,
      isActive = false,
      orgName,
      city,
      code,
      currentStep,
      licenceNumber,
      yearOfExperience,
      licenceValidity,
      aadharNumber,
      userImage,
      ownerShip
    } = req.body;
    if (
      !name ||
      !id ||
      !orgName ||
      !city ||
      !code ||
      !currentStep ||
      !licenceNumber ||
      !yearOfExperience ||
      !licenceValidity ||
      !aadharNumber ||
      !userImage ||
      !ownerShip
    )
      return res.status(400).json({ message: 'insufficent data' });

    await checkIfOthersVerified(id);

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

    const isUniqueAadhar = await checkIfAadharExists(aadharNumber);

    if (isUniqueAadhar.rowCount !== 0)
      return res
        .status(400)
        .json({ message: 'Someone has already taken this Aadhar number' });

    const isUniqueLicence = await checkIfLicenceExists(licenceNumber);

    if (isUniqueLicence.rowCount !== 0)
      return res
        .status(400)
        .json({ message: 'Someone has already taken this License number' });

    const newUser = await pool.query(
      'UPDATE "USERS" SET "ORG_ID" = $1, "ROLE" = $2, "ROLE_CODE" = $3, "CURRENT_STEP" = $4, "DRIVER_LICENCE_NO" = $5, "YEAR_OF_EXPERIENCE" = $6, "DRIVER_LICENCE_VALIDITY" = $7, "AADHAR_NUMBER" = $8, "OWNERSHIP" = $9, "CITY" = $10, "NAME" = $11, "OTHERS_VERIFIED" = $12 WHERE "ID"= $13 RETURNING *',
      [
        newOrg.rows[0].ID,
        ROLE_NAME.DRIVER,
        ROLE_CODE.DRIVER,
        nextStep,
        licenceNumber,
        yearOfExperience,
        licenceValidity,
        aadharNumber,
        ownerShip,
        city,
        name,
        false,
        id
      ]
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

    res.json({ userInfo: newUserData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};
exports.editProfile = async (req, res) => {
  try {
    const {
      aadharNumber,
      code,
      id,
      licenceNumber,
      licenceValidity,
      emailOrMobile,
      name,
      orgId,
      orgName,
      ownerShip,
      userImage,
      yearOfExperience
    } = req.body;
    if (
      !aadharNumber ||
      !code ||
      !id ||
      !licenceNumber ||
      !licenceValidity ||
      !emailOrMobile ||
      !name ||
      !orgId ||
      !orgName ||
      !ownerShip ||
      !userImage ||
      !yearOfExperience
    )
      return res.status(400).json({ message: 'Insufficent data' });

    const user = await checkIfUserExists(id);
    if (user.rowCount === 0)
      return res.status(401).json({ message: 'User not found' });

    await checkIfOthersVerified(id);
    const organization = await pool.query(
      'SELECT * FROM "ORGANIZATION" WHERE "ID" = $1',
      [orgId]
    );

    if (organization.rowCount === 0)
      return res.status(400).json({ message: `origanization does not exist` });

    const updatedOrg = await pool.query(
      'UPDATE "ORGANIZATION" SET "NAME" = $1, "CODE" = $2 WHERE "ID" = $3 RETURNING *',
      [orgName, code, orgId]
    );

    const newUser = await pool.query(
      'UPDATE "USERS" SET "NAME" = $1, "DRIVER_LICENCE_NO" = $2, "YEAR_OF_EXPERIENCE" = $3, "DRIVER_LICENCE_VALIDITY" = $4, "AADHAR_NUMBER" = $5, "OWNERSHIP" = $6, "OTHERS_VERIFIED" = $7, "EMAIL" = $8  WHERE "ID"= $9 RETURNING *',
      [
        name,
        licenceNumber,
        yearOfExperience,
        licenceValidity,
        aadharNumber,
        ownerShip,
        false,
        emailOrMobile,
        id
      ]
    );
    const newUserId = newUser.rows[0].ID;

    const newUserImg = await pool.query(
      'UPDATE "USER_IMAGES" SET "IMAGE" = $1, "USER_ID" = $2 RETURNING *',
      [userImage, newUserId]
    );

    const userData = deleteSensitive(newUser);
    const newUserData = {
      ...userData,
      USER_IMAGE: newUserImg.rows[0].IMAGE
    };

    res.json({ profile: newUserData, organization: updatedOrg.rows[0] });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
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
    vehicleImage,
    userId
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
    !userId
  )
    return res.status(404).json({ message: 'insufficient data' });
  try {
    await checkIfOthersVerified(userId);
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

    await resetOthersVerified(userId);

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
    vId,
    userId
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
    !vId ||
    !userId
  )
    return res.status(404).json({ message: 'insufficient data' });
  try {
    await checkIfOthersVerified(userId);
    const org = await pool.query(
      'SELECT "ID" FROM "ORGANIZATION" WHERE "ID" = $1',
      [orgId]
    );
    if (org.rowCount === 0) {
      return res
        .status(404)
        .json({ message: 'No Organization found with this details' });
    }
    const uniqueVehicle = await pool.query(
      'SELECT "ID" FROM "VEHICLE" WHERE "ID" = $1',
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

    await resetOthersVerified(userId);

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
    const vehicle = await pool.query(
      'SELECT * FROM "VEHICLE" LEFT JOIN "VEHICLE_IMAGES" ON "VEHICLE_IMAGES"."VEHICLE_ID" = "VEHICLE"."ID" WHERE "ORG_ID" = $1 AND "DELETED" = $2',
      [orgId, false]
    );
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
    // await pool.query(
    //   `DELETE FROM "VEHICLE_IMAGES" WHERE "VEHICLE_ID" = ( SELECT "ID" from "VEHICLE" where "ID" = $1)`,
    //   [vehicleId]
    // );
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

    // const isVerified = user.rows[0].VERIFIED;
    // const isRegistered = user.rows[0].IS_REGISTERED;
    // if (!isVerified)
    //   return res.status(403).json({ message: 'verify your account' });

    // if (isRegistered)
    //   return res
    //     .status(409)
    //     .json({ message: 'Account has been already registered' });

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

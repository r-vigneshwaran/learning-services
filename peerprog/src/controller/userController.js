const { pool } = require('../dao');
const { findVehicleWithId, findUserWithId } = require('../utils/helper');
const { deleteSensitive } = require('../utils/utility');

exports.getUserProfileDetails = async (req, res) => {
  const { id } = req.params;
  if (!id) res.status(400).json({ message: 'insufficient data' });

  try {
    const user = await pool.query(
      `SELECT *, "UI"."IMAGE" AS "USER_IMAGE" FROM "USERS" "U" LEFT JOIN "USER_IMAGES" "UI" ON "U"."ID" = "UI"."USER_ID" WHERE "U"."ID" = $1 `,
      [id]
    );
    if (user.rowCount === 0) {
      return res.status(401).json({ message: 'User not found' });
    }
    const userData = deleteSensitive(user);

    const orgId = user.rows[0].ORG_ID;
    const organization = await pool.query(
      'SELECT * FROM "ORGANIZATION" WHERE "ID" = $1',
      [orgId]
    );
    if (organization.rowCount === 0)
      return res.status(404).json({ message: 'No Organization Found' });

    const vehicles = await pool.query(
      `SELECT * FROM "VEHICLE" "V"
       LEFT JOIN "VEHICLE_IMAGES" "VI" ON "VI"."VEHICLE_ID" = "V"."ID"
      WHERE "V"."ORG_ID" = $1 AND "V"."DELETED" = $2`,
      [orgId, false]
    );

    res.status(200).json({
      profile: userData,
      vehicles: vehicles.rowCount === 0 ? [] : vehicles.rows,
      noOfVehicles: vehicles.rowCount,
      organization: organization.rows[0]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.contactUs = async (req, res) => {
  const { name, message, email, userId } = req.body;
  if (!name || !message || !email)
    res.status(400).json({ message: 'insufficient data' });

  try {
    const today = new Date();
    await pool.query(
      `INSERT INTO "QUERIES"("NAME", "EMAIL", "MESSAGE", "CREATED_AT", "USER_ID") VALUES($1, $2, $3, $4, $5)`,
      [name, email, message, today, userId]
    );
    res
      .status(200)
      .json({ message: 'Thank you for sharing this valuable message' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getUserImage = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(404).json({ message: 'Missing Parameters' });

  try {
    const userImage = await pool.query(
      'SELECT "IMAGE" AS "USER_IMAGE" FROM "USER_IMAGES" WHERE "USER_ID" = $1',
      [id]
    );
    res.status(200).json({
      image: userImage.rows[0]?.USER_IMAGE ? userImage.rows[0]?.USER_IMAGE : ''
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.forgotPasswordDetails = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(404).json({ message: 'Missing Parameters' });

  try {
    const user = await pool.query(
      `SELECT "FP_EXPIRES_AT" FROM "USERS" WHERE "ID" = $1`,
      [id]
    );

    const { FP_EXPIRES_AT } = user.rows[0];

    if (FP_EXPIRES_AT < Date.now()) {
      await pool.query('UPDATE "USERS" SET "OTP" = $1, "FP_EXPIRES_AT" = $2', [
        null,
        null
      ]);
      return res.status(403).json({ message: 'Otp has been Expired' });
    }

    res.status(200).json({ message: 'OTP is still valid', validatable: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserInfo = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(404).json({ message: 'Missing Parameters' });

  try {
    const user = await findUserWithId(id);
    if (user.rowCount === 0) {
      return res.status(401).json({ message: 'No User Found' });
    }
    const filtered = deleteSensitive(user);
    
    res.status(200).json({
      userInfo: filtered
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

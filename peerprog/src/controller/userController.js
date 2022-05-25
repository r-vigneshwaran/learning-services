const { pool } = require('../dao');
const { findVehicleWithId } = require('../utils/helper');
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

    for await (const variable of vehicles.rows) {
      const vId = variable.ID;
      console.log(vId);

      // const expiresAt = new Date(vehicles.rows[i].TO_DATE);
      // const today = new Date();
      // expiresAt.setHours(0, 0, 0, 0);
      // today.setHours(0, 0, 0, 0);
      // vehicles.rows[i].IS_AVAILABLE = expiresAt >= today;
      // console.log(vehicles.rows[i].ID, vehicles.rows[i].IS_AVAILABLE);
    }
    vehicles.rows.forEach(async (vehicle) => {
      const vId = vehicle.ID;
      const tripDetails = await pool.query(
        `SELECT "TO_DATE" FROM "TRIPS" WHERE "VEHICLE_ID" = $1`,
        [vId]
      );
      
    });

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

const { pool } = require('../dao');

exports.home = async (req, res) => {
  try {
    // res.user has the payload
    const { user } = req;
    const userData = await pool.query(
      `SELECT * FROM "VEHICLE" LEFT JOIN "VEHICLE_IMAGES" ON "VEHICLE_IMAGES"."VEHICLE_ID" = "VEHICLE"."ID"`
    );
    res.json({ data: userData.rows });
  } catch (error) {
    console.log(error.message);
    res.status(500).json('Server Error');
  }
};

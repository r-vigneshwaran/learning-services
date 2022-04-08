const { pool } = require('../dao');
const { findVehicleWithId, findUserWithId } = require('../utils/helper');
const { deleteSensitive } = require('../utils/utility');

exports.getUserProfileDetails = async (req, res) => {
  const { id } = req.params;
  if (!id) res.status(400).json({ message: 'insufficient data' });

  try {
    const user = await findUserWithId(id);
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

    const vehicles = await findVehicleWithId(orgId);

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

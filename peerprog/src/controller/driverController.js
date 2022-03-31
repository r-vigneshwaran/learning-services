const { ROLE_CODE, ROLE_NAME } = require('../config/userRoleCode');
const { pool } = require('../dao');

exports.createProfile = async (req, res) => {
  try {
    const {
      id,
      name,
      isActive = false,
      orgName,
      mobile,
      city,
      code
    } = req.body;
    if (!name || !id || !orgName || !mobile || !city || !code)
      return res.status(400).json({ message: 'insufficent data' });

    const organization = await pool.query(
      'SELECT * FROM "ORGANIZATION" WHERE "CODE" = $1',
      [code]
    );

    if (organization.rowCount === 1)
      return res
        .status(400)
        .json({ message: `origanization ${name} already exist` });

    const newOrg = await pool.query(
      'INSERT INTO "ORGANIZATION" ("NAME","IS_ACTIVE","CODE") VALUES ($1, $2, $3) RETURNING *',
      [orgName, isActive, code]
    );

    const updateUser = await pool.query(
      'UPDATE "USERS" SET "MOBILE" = $1, "IS_REGISTERED" = $2, "ORG_ID" = $3, "ROLE" = $4, "ROLE_CODE" = $5 WHERE "ID"= $6 RETURNING *',
      [mobile, true, newOrg.rows[0].ID, ROLE_NAME.DRIVER, ROLE_CODE.DRIVER, id]
    );
    res.json(newOrg.rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

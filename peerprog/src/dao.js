const Pool = require('pg').Pool;
// const pool = new Pool({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'dev',
//   password: 'root',
//   port: 5432
// });

const pool = new Pool({
  user: 'postgres',
  password: 'admin123',
  host: 'localhost',
  port: 5432,
  database: 'e-gadi'
});

const getUsers = async () => {
  return await pool.query(`SELECT * FROM "USERS"`);
};
module.exports = { getUsers, pool };

require('dotenv').config();

const Pool = require('pg').Pool;
// const pool = new Pool({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'dev',
//   password: 'root',
//   port: 5432
// });

const pool = new Pool({
  user: process.env.PG_USER,
  password: process.env.PG_PASS,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DB
});

const getUsers = async () => {
  return await pool.query(`SELECT * FROM "USERS"`);
};
module.exports = { getUsers, pool };

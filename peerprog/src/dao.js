const Pool = require('pg').Pool
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'dev',
    password: 'root',
    port: 5432,
})

export const getUsers = async () => {
    return await pool.query(`SELECT * FROM "USERS"`)
}
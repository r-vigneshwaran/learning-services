var CronJob = require('cron').CronJob;
const { pool } = require('../dao');

const job = new CronJob(
  '0 0 0 * * *',
  async function () {
    await pool.query(
      `UPDATE "TRIPS" SET "DELETED" = $1 WHERE "TO_DATE" < CURRENT_DATE AND "DELETED" = false RETURNING "ID";`,
      [true]
    );
    await pool.query(
      `UPDATE "VEHICLE" AS "V" SET "IS_AVAILABLE" = false FROM "TRIPS" AS "T" WHERE "V"."ID" = "T"."VEHICLE_ID" AND "T"."TO_DATE" < CURRENT_DATE AND "IS_AVAILABLE" = $1 RETURNING "V"."ID";`,
      [true]
    );
  },
  null,
  true,
  'Asia/Kolkata'
);

module.exports = job;

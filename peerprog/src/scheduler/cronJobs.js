var CronJob = require('cron').CronJob;
const { pool } = require('../dao');

// */10 * * * * * every 10 seconds
// 0 0 0 * * * everyday night 12am

const job = new CronJob(
  '0 0 0 * * *',
  async function () {
    const start = performance.now();
    console.log('****** Cron Job Started ******');
    await pool.query(
      `UPDATE "TRIPS" SET "DELETED" = $1 WHERE "TO_DATE" < CURRENT_DATE AND "DELETED" = false RETURNING "ID";`,
      [true]
    );
    await pool.query(
      `UPDATE "VEHICLE" AS "V" SET "IS_AVAILABLE" = false FROM "TRIPS" AS "T" WHERE "V"."ID" = "T"."VEHICLE_ID" AND "T"."TO_DATE" < CURRENT_DATE AND "IS_AVAILABLE" = $1 RETURNING "V"."ID";`,
      [true]
    );
    await pool.query(
      `DELETE FROM "BOOKING" WHERE "TRIP_ID" IN (SELECT "ID" FROM "TRIPS" WHERE "DRIVER_ID" IN (SELECT "ID" FROM "USERS" WHERE "DELETED" = true))`
    );
    await pool.query(
      `DELETE FROM "TRIPS" WHERE "DRIVER_ID" IN (SELECT "ID" FROM "USERS" WHERE "DELETED" = true)`
    );
    await pool.query(
      `DELETE FROM "USER_IMAGES" WHERE "USER_ID" IN (SELECT "ID" FROM "USERS" WHERE "DELETED" = true)`
    );
    await pool.query(`DELETE FROM "USERS" WHERE "DELETED" = true`);
    console.log('******  Cron Job Ended  ******');
    const duration = performance.now() - start;
    console.log('Function Execution have taken ' + duration + ' milliseconds');
  },
  null,
  true,
  'Asia/Kolkata'
);

module.exports = job;

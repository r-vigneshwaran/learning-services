const { getUsers } = require('../dao');
const { responseBody } = require('../utils/interface');
var unirest = require('unirest');
const otpGenerator = require('otp-generator');
const { pool } = require('../dao');
const bcrypt = require('bcrypt');
var smsReq = unirest('POST', 'https://www.fast2sms.com/dev/bulkV2');
var http = require('http');
const {
  checkIfEmail,
  checkIfMobile,
  checkIfUserExists,
  resetOthersVerified,
  checkIfUserExistswithEmail
} = require('../utils/helper');
const sendVerificationcode = require('./verification');

exports.sendMobileOtp = ({ id, mobile, isFp }) => {
  if (!mobile) return 'Mobile number and user id is required';

  try {
    smsReq.headers({
      authorization:
        'VUrbYq23CBpAm1lkQcLnWOsSDZa0tyeThIoEiJdw8xGuXKgv6903qnmrhd1IEv8BcMJUFZQXRjafAzbg'
    });

    const uniqueString = otpGenerator.generate(5, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false
    });
    const saltRound = 10;
    bcrypt.hash(uniqueString, saltRound).then(async (hashed) => {
      if (isFp) {
        await pool.query(
          'UPDATE "USERS" SET "OTP" = $1, "FP_EXPIRES_AT" = $2 WHERE "EMAIL" = $3',
          [hashed, Date.now() + 7200000, mobile]
        );
      } else {
        await pool.query(
          'UPDATE "USERS" SET "OTP" = $1, "EXPIRES_AT" = $2 WHERE "EMAIL" = $3',
          [hashed, Date.now() + 7200000, mobile]
        );
      }
    });

    const data = {
      variables_values: uniqueString,
      route: 'otp',
      numbers: mobile.toString()
    };
    smsReq.form(data);
    smsReq.end(function (result) {
      if (result.error) {
        return result.error.message;
      }
      return result.body.message;
    });
  } catch (error) {
    return error.message;
  }
};

exports.generateOtp = async (req, res) => {
  const { emailOrMobile, isFp } = req.body;
  if (!emailOrMobile)
    return res.status(404).json({
      message: 'Mobile number or Email Address and user id is required'
    });

  try {
    const user = await checkIfUserExistswithEmail(emailOrMobile);
    if (!user.rows[0])
      return res.status(400).json({ message: `User does not exist` });

    await pool.query(
      'UPDATE "USERS" SET "OTHERS_VERIFIED" = $1, "FP_VERIFIED" = $2 WHERE "EMAIL" = $3',
      [false, false, emailOrMobile]
    );

    if (checkIfEmail(emailOrMobile)) {
      sendVerificationcode({ email: emailOrMobile, isFp });
    }
    if (checkIfMobile(emailOrMobile)) {
      this.sendMobileOtp({ mobile: emailOrMobile, isFp });
    }

    res.status(200).json({ message: 'Otp Send Successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
exports.resetVerification = async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(404).json({ message: 'Missing Parameters' });

  try {
    await resetOthersVerified(id);
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.verifyOtp = async (req, res) => {
  const { id, uniqueString } = req.body;
  if (!id || !uniqueString)
    return res.status(404).json({ message: 'Missing Parameters' });

  const user = await pool.query(
    `SELECT "EXPIRES_AT", "OTP" FROM "USERS" WHERE "ID" = $1`,
    [id]
  );

  const { EXPIRES_AT, OTP } = user.rows[0];

  if (EXPIRES_AT < Date.now()) {
    await pool.query('UPDATE "USERS" SET "OTP" = $1, "EXPIRES_AT" = $2', [
      null,
      null
    ]);
    return res.status(400).json({ message: 'Otp has been Expired' });
  }
  const validOtp = await bcrypt.compare(
    uniqueString.toString(),
    OTP.toString()
  );

  if (!validOtp)
    return res.status(400).json({ message: 'The OTP provided is incorrect' });

  const newUser = await pool.query(
    'UPDATE "USERS" SET "OTP" = $1, "EXPIRES_AT" = $2, "OTHERS_VERIFIED" = $3 WHERE "ID" = $4 RETURNING *',
    [null, null, true, id]
  );
  res.status(200).json({
    verified: true,
    userInfo: newUser.rows[0],
    message: 'Verification completed successfully'
  });
};

exports.fpVerifyOtp = async (req, res) => {
  const { uniqueString, emailOrMobile } = req.body;
  if (!emailOrMobile || !uniqueString)
    return res.status(404).json({ message: 'Missing Parameters' });

  const user = await pool.query(
    `SELECT "FP_EXPIRES_AT", "OTP", "FP_CURRENT_STEP" FROM "USERS" WHERE "EMAIL" = $1`,
    [emailOrMobile]
  );
  if (user.rowCount === 0) {
    return res.status(404).json({ message: 'This User does not exist' });
  }
  const { FP_EXPIRES_AT, OTP, FP_CURRENT_STEP } = user.rows[0];

  if (!OTP) {
    return res.status(401).json({ message: 'No OTP found in user record' });
  }
  if (FP_EXPIRES_AT < Date.now()) {
    await pool.query(
      'UPDATE "USERS" SET "OTP" = $1, "FP_EXPIRES_AT" = $2 WHERE "EMAIL" = $3',
      [null, null, emailOrMobile]
    );
    return res.status(400).json({ message: 'Otp has been Expired' });
  }
  const uniqueOtp = uniqueString.toString();
  const dbOtp = OTP.toString();
  const validOtp = await bcrypt.compare(uniqueOtp, dbOtp);

  if (!validOtp)
    return res.status(400).json({ message: 'The OTP provided is incorrect' });

  const nextStep = parseInt(FP_CURRENT_STEP) + 1;
  const newUser = await pool.query(
    'UPDATE "USERS" SET "OTP" = $1, "FP_EXPIRES_AT" = $2, "FP_VERIFIED" = $3, "FP_CURRENT_STEP" = $4 WHERE "EMAIL" = $5 RETURNING *',
    [null, null, true, nextStep, emailOrMobile]
  );
  res.status(200).json({
    verified: true,
    userInfo: newUser.rows[0],
    message: 'Verification completed successfully'
  });
};

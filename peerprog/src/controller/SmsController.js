var unirest = require('unirest');
const otpGenerator = require('otp-generator');
const { pool } = require('../dao');
const bcrypt = require('bcrypt');
const {
  checkIfEmail,
  checkIfMobile,
  resetOthersVerified,
  checkIfUserExistswithEmail,
  checkIfUserExists,
  findUserWithMobile,
  findUserWithId
} = require('../utils/helper');
const {
  sendVerificationcode,
  sendEmailOTP,
  sendMobileOTP
} = require('./verification');
const { deleteSensitive } = require('../utils/utility');

exports.sendMobileOtp = ({ id, mobile, isFp }) => {
  if (!mobile) return 'Mobile number and user id is required';

  var smsReq = unirest('POST', 'https://www.fast2sms.com/dev/bulkV2');
  try {
    smsReq.headers({
      authorization: process.env.FAST2SMS_API_KEY
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
    smsReq.end(function (res) {
      if (res.error) {
        console.log(res.error);
        return res.error.message;
      }
      return res.body.message;
    });
  } catch (error) {
    return error.message;
  }
};

exports.checkIfMobile = async (req, res) => {
  const { id } = req.params;
  if (!id)
    return res.status(400).json({ message: 'Missing Parameter mobile number' });

  try {
    const user = await findUserWithId(id);
    if (user.rowCount === 0)
      return res.status(400).json({ message: 'user does not exist' });

    const isMobile = user.rows[0].MOBILE ? true : false;

    res.status(200).json({ isMobile });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.sentOtpForDriver = async (req, res) => {
  const { mobile, id } = req.body;
  if (!mobile)
    return res.status(400).json({ message: 'Missing Parameter mobile number' });

  var smsReq = unirest('POST', 'https://www.fast2sms.com/dev/bulkV2');
  try {
    const user = await checkIfUserExists(id);
    if (!user.rows[0])
      return res.status(400).json({ message: `User does not exist` });

    const mobileExists = await findUserWithMobile(mobile);
    if (mobileExists.rowCount !== 0) {
      return res.status(400).json({
        message: `Mobile number (${mobile}) is already taken by another user`
      });
    }

    smsReq.headers({
      authorization: process.env.FAST2SMS_API_KEY
    });

    const uniqueString = otpGenerator.generate(5, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false
    });
    const saltRound = 10;
    bcrypt.hash(uniqueString, saltRound).then(async (hashed) => {
      await pool.query(
        'UPDATE "USERS" SET "OTP" = $1, "OTHERS_EXPIRES_AT" = $2, "OTHERS_VERIFIED" = $3 WHERE "ID" = $4',
        [hashed, Date.now() + 7200000, false, id]
      );
    });

    const data = {
      variables_values: uniqueString,
      route: 'otp',
      numbers: mobile.toString()
    };

    smsReq.form(data);

    smsReq.end(function (result) {
      console.log(result.error);
      if (result.error)
        return res.status(500).json({ message: JSON.stringify(result.error) });
      return res.json({ message: result.body?.message[0] });
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
      sendMobileOTP({ mobile: emailOrMobile, isFp });
    }

    res
      .status(200)
      .json({ message: 'Otp Send Successfully', ID: user.rows[0]?.ID });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
exports.resetVerification = async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(404).json({ message: 'MissingParameters' });

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
    return res.status(404).json({ message: 'MissingParameters' });
  try {
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

    const filteredData = deleteSensitive(newUser);

    res.status(200).json({
      userInfo: filteredData,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    res.status(200).json({
      message: error.message
    });
  }
};

exports.fpVerifyOtp = async (req, res) => {
  const { uniqueString, emailOrMobile } = req.body;
  if (!emailOrMobile || !uniqueString)
    return res.status(404).json({ message: 'Missing Parameters' });

  const user = await pool.query(
    `SELECT "FP_EXPIRES_AT", "OTP" FROM "USERS" WHERE "EMAIL" = $1`,
    [emailOrMobile]
  );
  if (user.rowCount === 0) {
    return res.status(404).json({ message: 'This User does not exist' });
  }
  const { FP_EXPIRES_AT, OTP } = user.rows[0];

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

  const nextStep = 2;
  const newUser = await pool.query(
    'UPDATE "USERS" SET "OTP" = $1, "FP_VERIFIED" = $2, "FP_CURRENT_STEP" = $3 WHERE "EMAIL" = $4 RETURNING *',
    [null, true, nextStep, emailOrMobile]
  );
  res.status(200).json({
    verified: true,
    userInfo: newUser.rows[0],
    message: 'Verification completed successfully'
  });
};

exports.fpVerifyDriverMobileOtp = async (req, res) => {
  const { uniqueString, id } = req.body;
  if (!id || !uniqueString)
    return res.status(404).json({ message: 'Missing Parameters' });

  const user = await pool.query(
    `SELECT "OTHERS_EXPIRES_AT", "OTP" FROM "USERS" WHERE "ID" = $1`,
    [id]
  );
  if (user.rowCount === 0) {
    return res.status(404).json({ message: 'This User does not exist' });
  }
  const { OTHERS_EXPIRES_AT, OTP } = user.rows[0];

  if (!OTP) {
    return res.status(401).json({ message: 'No OTP found in user record' });
  }
  if (OTHERS_EXPIRES_AT < Date.now()) {
    await pool.query(
      'UPDATE "USERS" SET "OTP" = $1, "OTHERS_EXPIRES_AT" = $2 WHERE "ID" = $3',
      [null, null, id]
    );
    return res.status(400).json({ message: 'Otp has been Expired' });
  }
  const uniqueOtp = uniqueString.toString();
  const dbOtp = OTP.toString();
  const validOtp = await bcrypt.compare(uniqueOtp, dbOtp);

  if (!validOtp)
    return res.status(400).json({ message: 'The OTP provided is incorrect' });

  const newUser = await pool.query(
    'UPDATE "USERS" SET "OTP" = $1, "OTHERS_VERIFIED" = $2, "OTHERS_EXPIRES_AT" = $3 WHERE "ID" = $4 RETURNING *',
    [null, true, null, id]
  );
  res.status(200).json({
    verified: true,
    userInfo: newUser.rows[0],
    message: 'Verification completed successfully'
  });
};
exports.verifyAddVehicleOTP = async (req, res) => {
  let { id, uniqueString, currentStep } = req.body;
  if (!id) return res.status(400).json({ message: 'user id is missing' });
  try {
    const user = await findUserWithId(id);
    if (user.rowCount === 0)
      return res.status(403).json({
        message:
          "Account record doesn't exist or has been verified already. please sign up or login  "
      });
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

    res.status(200).json({
      message: 'Verification completed successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.generateOneTimePassword = async (req, res, next) => {
  const { emailOrMobile, checkIfMobileExists, id, isForgotPassword } = req.body;
  if (!emailOrMobile)
    return res.status(404).json({
      message: 'Mobile number or Email Address and user id is required'
    });

  try {
    if (checkIfMobileExists) {
      const mobileExists = await findUserWithMobile(emailOrMobile);
      if (mobileExists.rowCount !== 0) {
        return res.status(400).json({
          message: `Mobile number (${emailOrMobile}) is already taken by another user`
        });
      }
      await pool.query(
        'UPDATE "USERS" SET "OTP" = $1, "VERIFIED" = $2 WHERE "ID" = $3',
        [false, false, id]
      );
    } else {
      await pool.query(
        'UPDATE "USERS" SET "OTP" = $1, "VERIFIED" = $2 WHERE "EMAIL" = $3',
        [false, false, emailOrMobile]
      );
    }
    let string;
    if (checkIfEmail(emailOrMobile)) {
      string = await sendEmailOTP(emailOrMobile, checkIfMobileExists, id);
    }
    if (checkIfMobile(emailOrMobile)) {
      string = await sendMobileOTP(emailOrMobile, checkIfMobileExists, id);
    }
    if (isForgotPassword) {
      await pool.query(
        'UPDATE "USERS" SET "FP_CURRENT_STEP" = $1 WHERE "EMAIL" = $2',
        [1, emailOrMobile]
      );
    }
    res.status(200).json({
      message: string ? string : `Otp Send Successfully to ${emailOrMobile}`
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
exports.verifyOneTimePassword = async (req, res) => {
  const { id, uniqueString, goToNext, currentStep } = req.body;
  if (!id || !uniqueString)
    return res.status(404).json({ message: 'MissingParameters' });
  try {
    const user = await pool.query(
      `SELECT "EXPIRES_AT", "OTP" FROM "USERS" WHERE "ID" = $1`,
      [id]
    );
    const { EXPIRES_AT, OTP } = user.rows[0];

    if (EXPIRES_AT < Date.now()) {
      await pool.query(
        'UPDATE "USERS" SET "OTP" = $1, "EXPIRES_AT" = $2 WHERE "ID" = $3',
        [null, null, id]
      );
      return res.status(400).json({ message: 'Otp has been Expired' });
    }
    const validOtp = await bcrypt.compare(
      uniqueString.toString(),
      OTP.toString()
    );

    if (!validOtp)
      return res.status(400).json({ message: 'The OTP provided is incorrect' });

    let newUser;
    newUser = await pool.query(
      'UPDATE "USERS" SET "OTP" = $1, "EXPIRES_AT" = $2, "VERIFIED" = $3 WHERE "ID" = $4 RETURNING *',
      [null, null, true, id]
    );
    if (goToNext) {
      const nextStep = currentStep + 1;
      newUser = await pool.query(
        'UPDATE "USERS" SET "CURRENT_STEP" = $1, "VERIFIED" = $2 WHERE "ID" = $3 RETURNING *',
        [nextStep, false, id]
      );
    }
    const filteredData = deleteSensitive(newUser);

    res.status(200).json({
      userInfo: filteredData,
      message: 'OTP verified successfully',
      isVerified: true
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
exports.verifyForgotPasswordOneTimePassword = async (req, res) => {
  const { emailOrMobile, uniqueString } = req.body;
  if (!emailOrMobile || !uniqueString)
    return res.status(404).json({ message: 'MissingParameters' });
  try {
    const user = await pool.query(
      `SELECT "EXPIRES_AT", "OTP" FROM "USERS" WHERE "EMAIL" = $1`,
      [emailOrMobile]
    );

    const { EXPIRES_AT, OTP } = user.rows[0];

    if (EXPIRES_AT < Date.now()) {
      await pool.query(
        'UPDATE "USERS" SET "OTP" = $1, "EXPIRES_AT" = $2, "FP_CURRENT_STEP" = $3 WHERE "ID" = $4',
        [null, null, 1, id]
      );
      return res.status(400).json({ message: 'Otp has been Expired' });
    }
    if (!OTP) {
      return res.status(400).json({ message: 'OTP not found' });
    }
    const validOtp = await bcrypt.compare(
      uniqueString.toString(),
      OTP.toString()
    );

    if (!validOtp)
      return res.status(400).json({ message: 'The OTP provided is incorrect' });

    const newUser = await pool.query(
      'UPDATE "USERS" SET "OTP" = $1, "VERIFIED" = $2, "FP_CURRENT_STEP" = $3 WHERE "EMAIL" = $4 RETURNING *',
      [null, true, 2, emailOrMobile]
    );
    const filteredData = deleteSensitive(newUser);

    res.status(200).json({
      verified: true,
      userInfo: filteredData,
      message: 'Verification completed successfully'
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
exports.reset = async (req, res) => {
  const { id, emailOrMobile } = req.body;
  try {
    if (id) {
      await pool.query(
        'UPDATE "USERS" SET "OTP" = $1, "VERIFIED" = $2 WHERE "OTP" = $3',
        [null, false, id]
      );
    }
    if (emailOrMobile) {
      await pool.query(
        'UPDATE "USERS" SET "OTP" = $1, "VERIFIED" = $2 WHERE "EMAIL" = $3',
        [null, false, emailOrMobile]
      );
    }
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
exports.isVerified = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: 'Missing Parameter Id' });
  try {
    const user = await pool.query(
      'SELECT "VERIFIED" FROM "USERS" WHERE "ID" = $1',
      [id]
    );
    if (user.rowCount === 0) {
      return res.status(403).json({ message: 'User not found' });
    }
    res.status(200).json({ isVerified: user.rows[0].VERIFIED });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

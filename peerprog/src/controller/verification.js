const nodemailer = require('nodemailer');
const { pool } = require('../dao');
const bcrypt = require('bcrypt');
var unirest = require('unirest');
require('dotenv').config();
const otpGenerator = require('otp-generator');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.log('error', error);
  }
});

exports.sendVerificationcode = async (emailOrMobile) => {
  if (!emailOrMobile)
    return res.status(404).json({
      message: 'Mobile number or Email Address and user id is required'
    });

  try {
    await pool.query(
      'UPDATE "USERS" SET "OTP" = $1, "VERIFIED" = $2 WHERE "EMAIL" = $3',
      [false, false, emailOrMobile]
    );
    let string = await this.sendEmailOTP(emailOrMobile, false, id);

    res.status(200).json({
      message: string ? string : 'Otp Send Successfully'
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.sendEmailOTP = async (email, checkIfMobileExists, id) => {
  try {
    const uniqueString = otpGenerator.generate(5, {
      upperCaseAlphabets: false,
      specialChars: false,
      lowerCaseAlphabets: false
    });

    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: 'Verify your Email (Do Not Reply)',
      html: `<p>Verify yourself before completing the process</p>
       <br/> 
       <p>This OTP <b>expires in 2 hours</b>.</p>
        <br/>
        <h1>Your OTP is ${uniqueString}</h1>`
    };

    const saltRound = 10;
    bcrypt.hash(uniqueString, saltRound).then(async (hashed) => {
      if (checkIfMobileExists) {
        await pool.query(
          'UPDATE "USERS" SET "OTP" = $1, "EXPIRES_AT" = $2 WHERE "ID" = $3',
          [hashed, Date.now() + 7200000, id]
        );
      } else {
        await pool.query(
          'UPDATE "USERS" SET "OTP" = $1, "EXPIRES_AT" = $2 WHERE "EMAIL" = $3',
          [hashed, Date.now() + 7200000, email]
        );
      }
    });
    transporter
      .sendMail(mailOptions)
      .then(() => {
        return `Verification Mail send successfully to ${emailOrMobile}`;
      })
      .catch((err) => {
        return 'Unable to send OTP';
      });
  } catch (error) {
    return error.message;
  }
};

exports.sendMobileOTP = async (mobile, checkIfMobileExists, id) => {
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
      if (checkIfMobileExists) {
        await pool.query(
          'UPDATE "USERS" SET "OTP" = $1, "EXPIRES_AT" = $2 WHERE "ID" = $3',
          [hashed, Date.now() + 7200000, id]
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
        return 'Unable to send OTP';
      }
      return `${res.body?.message[0]} to ${mobile}`;
    });
  } catch (error) {
    return error.message;
  }
};

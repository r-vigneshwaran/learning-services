const nodemailer = require('nodemailer');
const { pool } = require('../dao');
const bcrypt = require('bcrypt');
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

async function sendVerificationcode({ id, email, isFp = false }) {
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
      if (isFp) {
        await pool.query(
          'UPDATE "USERS" SET "OTP" = $1, "FP_EXPIRES_AT" = $2 WHERE "EMAIL" = $3',
          [hashed, Date.now() + 7200000, email]
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
        return 'Verification Mail send successfully';
      })
      .catch((err) => {
        return 'Unable to send OTP';
      });
  } catch (error) {
    return error.message;
  }
}

module.exports = sendVerificationcode;

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
  } else {
    // console.log('Ready to Mail');
    // console.log(success);
  }
});

async function sendVerificationcode({ id, email }, res) {
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
      html: `<p>Verify your email address to complete the sign up and login to your account</p>
       <br/> 
       <p>This OTP <b>expires in 2 hours</b>.</p>
        <br/>
        <h1>Your OTP is ${uniqueString}</h1>`
    };

    const saltRound = 10;
    bcrypt.hash(uniqueString, saltRound).then(async (hashed) => {
      await pool.query(
        'UPDATE "USERS" SET "OTP" = $1, "EXPIRES_AT" = $2 WHERE "ID" = $3',
        [hashed, Date.now() + 7200000, id]
      );
    });
    transporter
      .sendMail(mailOptions)
      .then(() => {
        return 'Verification Mail send successfully';
      })
      .catch((err) => {
        return 'Verification Email Failed';
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

module.exports = sendVerificationcode;

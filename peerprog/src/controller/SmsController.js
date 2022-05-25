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
  resetOthersVerified
} = require('../utils/helper');
const sendVerificationcode = require('./verification');

exports.sendMobileOtp = ({ id, mobile }) => {
  if (!id || !mobile) return 'Mobile number and user id is required';

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
      await pool.query(
        'UPDATE "USERS" SET "OTP" = $1, "EXPIRES_AT" = $2 WHERE "ID" = $3',
        [hashed, Date.now() + 7200000, id]
      );
    });

    const data = {
      variables_values: uniqueString,
      route: 'otp',
      numbers: mobile.toString()
    };
    smsReq.form(data);
    smsReq.end(function (result) {
      if (result.error) {
        console.log(res.error);
        return result.error.message;
      }
      console.log(result.body);
      return result.body.message;
    });
  } catch (error) {
    return error.message;
  }
};

// exports.getUsers = async function (req, res) {
//   let result = responseBody;
//   await getUsers()
//     .then((userRes) => {
//       result.Body.data = userRes.rows;
//     })
//     .catch((err) => {
//       result.Body.error = err.message;
//     });
//   res.status(200).json(result);
// };

// exports.sendSms = function (req, res) {
//   const { to } = req.body;
//   const accountSid = 'AC78e193e4827fbe84fd698faeb43de80c'; //process.env.TWILIO_ACCOUNT_SID;
//   const authToken = '5d4bcbf8a5cd125a8dc8e8d3271bfd92'; //process.env.TWILIO_AUTH_TOKEN;
//   const client = require('twilio')(accountSid, authToken);

//   client.messages
//     .create({
//       body: 'This is the ship that made the Kessel Run in fourteen parsecs?',
//       from: '+1828882290',
//       to: `+91${to}`
//     })
//     .then((message) => {
//       console.log(message);
//       return res.send(`Message sent to ${message.to}`);
//     })
//     .catch((error) => {
//       console.log(error);
//       return res.send(`Error sending message - ${error.message}`);
//     });
// };

// exports.recieveSms = function (req, res) {
//   const MessagingResponse = require('twilio').twiml.MessagingResponse;
//   const twiml = new MessagingResponse();
//   const msgFrom = req.body.From;

//   console.log(req.body, '\n\n', msgFrom);
//   twiml.message(`Hey ${msgFrom}, Your msg received!!`);

//   res.writeHead(200, { 'Content-Type': 'text/xml' });
//   res.end(twiml.toString());
// };

exports.generateOtp = async (req, res) => {
  const { id, emailOrMobile } = req.body;
  if (!id || !emailOrMobile)
    return res.status(404).json({
      message: 'Mobile number or Email Address and user id is required'
    });

  try {
    const user = await checkIfUserExists(id);
    if (!user.rows[0])
      return res.status(400).json({ message: 'User Does not exist' });

    await pool.query(
      'UPDATE "USERS" SET "OTHERS_VERIFIED" = $1 WHERE "ID" = $2',
      [false, id]
    );

    if (checkIfEmail(emailOrMobile)) {
      sendVerificationcode({ id, email: emailOrMobile });
    }
    if (checkIfMobile(emailOrMobile)) {
      this.sendMobileOtp({ id, mobile: emailOrMobile });
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

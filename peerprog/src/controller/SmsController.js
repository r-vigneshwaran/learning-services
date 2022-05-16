const { getUsers } = require('../dao');
const { responseBody } = require('../utils/interface');
var unirest = require('unirest');
const otpGenerator = require('otp-generator');
const { pool } = require('../dao');
const bcrypt = require('bcrypt');
var smsReq = unirest('POST', 'https://www.fast2sms.com/dev/bulkV2');
var http = require('http');

// var urlencode = require('urlencode');

exports.sendMessage = function (req, res) {
  const { message, toNumber } = req.body;
  const encodedMessage = encodeURIComponent(message);
  // const toNumber = encodeURIComponent(user.toNumber);
  const apiKey = process.env.TEXTLOCAL_API_KEY;
  // var url = `https://api.textlocal.in/send/?apikey=${apiKey}&numbers=${toNumber}&sender=TXTLCL&message=${message}`;
  const data =
    'send/?apikey=' +
    apiKey +
    '&numbers=' +
    toNumber +
    '&sender=TXTLCL&message=' +
    encodedMessage;
  var options = {
    host: 'api.textlocal.in',
    path: data
  };

  callback = function (response) {
    var str = '';

    response.on('data', function (chunk) {
      str += chunk;
    });

    response.on('end', function () {
      console.log(str);

      res.end(JSON.stringify({ success: 'success' }));
    });
  };

  console.log(options);

  http.request(options, callback).end();
};

exports.sendMobileOtp = ({ id, email }) => {
  if (!id || !email) return;

  try {
    smsReq.headers({
      authorization:
        'lEmQGOiR6nF2yM1UdP4DtaoTWNqw5ZkBvzAYxgCse78fbchruVJwTxCsjym8QZrFA2D6fi4XSOpe1oRB'
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
      numbers: email.toString()
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

exports.ping = function (req, res) {
  res.send('Ping Success !!!');
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

exports.sendSms = function (req, res) {
  const { to } = req.body;
  const accountSid = 'AC78e193e4827fbe84fd698faeb43de80c'; //process.env.TWILIO_ACCOUNT_SID;
  const authToken = '5d4bcbf8a5cd125a8dc8e8d3271bfd92'; //process.env.TWILIO_AUTH_TOKEN;
  const client = require('twilio')(accountSid, authToken);

  client.messages
    .create({
      body: 'This is the ship that made the Kessel Run in fourteen parsecs?',
      from: '+1828882290',
      to: `+91${to}`
    })
    .then((message) => {
      console.log(message);
      return res.send(`Message sent to ${message.to}`);
    })
    .catch((error) => {
      console.log(error);
      return res.send(`Error sending message - ${error.message}`);
    });
};

exports.recieveSms = function (req, res) {
  const MessagingResponse = require('twilio').twiml.MessagingResponse;
  const twiml = new MessagingResponse();
  const msgFrom = req.body.From;

  console.log(req.body, '\n\n', msgFrom);
  twiml.message(`Hey ${msgFrom}, Your msg received!!`);

  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
};

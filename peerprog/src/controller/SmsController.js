const { getUsers } = require('../dao');
const { responseBody } = require('../utils/interface');

exports.ping = function (req, res) {
  res.send('Ping Success !!!');
};

exports.getUsers = async function (req, res) {
  let result = responseBody;
  await getUsers()
    .then((userRes) => {
      result.Body.data = userRes.rows;
    })
    .catch((err) => {
      result.Body.error = err.message;
    });
  res.status(200).json(result);
};

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

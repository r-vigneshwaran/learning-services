const express = require('express');
const app = express();
const routes = require('./src/routes');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const credentials = require('./src/config/credentials');
const corsOptions = require('./src/config/corsOptions');
var bodyParser = require('body-parser');

app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(
  bodyParser.urlencoded({
    limit: '50mb',
    extended: true,
    parameterLimit: 50000,
    type: 'application/x-www-form-urlencoded'
  })
);

// const whitelist = ['http://localhost:8080'];
// const corsOptions = {
//   credentials: true,
//   origin: (origin, callback) => {
//     if (whitelist.includes(origin)) return callback(null, true);
//     callback(new Error('Not allowed by CORS'));
//   }
// };
app.use(credentials);
app.use(cors(corsOptions));
// app.use(cors());
app.use('/', routes);
var port = process.env.PORT || 8000;

app.listen(port, function () {
  console.log('App listening on port - %s', port);
});

module.exports = app;

const express = require('express');
const app = express();
const routes = require('./src/routes');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const credentials = require('./src/config/credentials');
const corsOptions = require('./src/config/corsOptions');

app.use(express.json());
app.use(cookieParser());

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
var port = 8000;

app.listen(port, function () {
  console.log('App listening on port - %s', port);
});

module.exports = app;

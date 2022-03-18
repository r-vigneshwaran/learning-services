const {
  ping,
  sendSms,
  recieveSms,
  getUsers
} = require('./controller/SmsController');
const {
  register,
  login,
  authorize,
  refreshToken,
  logout,
  isAuthenticated
} = require('./controller/jwtAuth');
const validator = require('./middleware/validator');
const authorization = require('./middleware/authorization');

var router = require('express').Router();
var bodyParser = require('body-parser');
const { verifyRefreshToken } = require('./utils/jwtGenerator');
const { home } = require('./controller/dashboard');

router.use(bodyParser.urlencoded({ extended: false }));
// router.get('/', ping);
router.get('/sendsms', sendSms);
router.post('/recievesms', recieveSms);
router.get('/getusers', getUsers);

// Authentication and Authorizations Routes
router.post('/auth/register', validator, register);
router.post('/auth/login', validator, login);
router.get('/auth/is-verified', authorization, authorize);
router.get('/auth/is-authenticated', isAuthenticated);
router.get('/auth/refresh-token', refreshToken);
router.get('/auth/logout', logout);

// dashboard routes
router.get('/dashboard', home);

module.exports = router;

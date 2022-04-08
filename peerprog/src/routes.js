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
  isAuthenticated,
  verifyEmail
} = require('./controller/jwtAuth');
const validator = require('./middleware/validator');
const authorization = require('./middleware/authorization');

var router = require('express').Router();
var bodyParser = require('body-parser');
const { home } = require('./controller/dashboard');
const {
  createProfile,
  addVehicle,
  getProfileVehicles,
  deleteVehicle,
  completeRegistration,
  addVehicleAvailability,
  editVehicle
} = require('./controller/driverController');
const {
  getTripDetails,
  editTripDetails,
  getSpecificTripDetails
} = require('./controller/tripsController');
const { getUserProfileDetails } = require('./controller/userController');

router.use(bodyParser.urlencoded({ extended: false }));
// router.get('/', ping);
router.post('/sendsms', sendSms);
router.post('/recievesms', recieveSms);
router.get('/getusers', getUsers);

// Authentication and Authorizations Routes
router.post('/auth/register', validator, register);
router.post('/auth/login', validator, login);
router.get('/auth/is-verified', authorization, authorize);
router.get('/auth/is-authenticated', isAuthenticated);
router.get('/auth/refresh-token', refreshToken);
router.get('/auth/logout', logout);

// verification
router.post('/user/verify', verifyEmail);

// dashboard routes
router.get('/dashboard', home);
router.get('/api/get-trip-details/:id', getSpecificTripDetails);

// user route
router.get(
  '/api/driver/profile-details/:id',
  authorization,
  getUserProfileDetails
);
router.post('/api/driver/add-availability', addVehicleAvailability);
router.get('/api/driver/get-trip-details/:id', getTripDetails);

router.put('/api/driver/edit-trip-details/:id', editTripDetails);

// drivers route
router.post('/api/driver/create-profile', authorization, createProfile);
router.post('/api/driver/add-vehicle', addVehicle);
router.post('/api/driver/edit-vehicle', editVehicle);
router.post('/api/driver/get-vehicles', authorization, getProfileVehicles);
router.delete('/api/driver/delete-vehicle/:vehicleId/:orgId', deleteVehicle);
router.put(
  '/api/driver/complete-registration/:id',
  authorization,
  completeRegistration
);

module.exports = router;

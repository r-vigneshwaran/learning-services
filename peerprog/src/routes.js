const {
  ping,
  sendSms,
  recieveSms,
  sendMobileOtp,
  sendMessage
} = require('./controller/SmsController');
const {
  register,
  login,
  authorize,
  refreshToken,
  logout,
  isAuthenticated,
  verifyEmail,
  deleteUser
} = require('./controller/jwtAuth');
const validator = require('./middleware/validator');
const authorization = require('./middleware/authorization');

var router = require('express').Router();
var bodyParser = require('body-parser');
const {
  home,
  largeVehicles,
  smallVehicles,
  testing
} = require('./controller/dashboard');
const {
  addVehicle,
  getProfileVehicles,
  deleteVehicle,
  completeRegistration,
  editVehicle,
  editProfile,
  createDriverProfile
} = require('./controller/driverController');
const {
  getTripDetails,
  editTripDetails,
  getSpecificTripDetails,
  addVehicleAvailability,
  removeVehicleAvailability
} = require('./controller/tripsController');
const {
  getUserProfileDetails,
  contactUs
} = require('./controller/userController');
const {
  createCustomerProfile,
  editCustomerProfile,
  bookTrip,
  customerBookingHistory
} = require('./controller/customerController');
const { getUsers } = require('./controller/adminController');
const { isRevoked } = require('./middleware/isRevoked');

router.use(bodyParser.urlencoded({ extended: false }));
// router.get('/', ping);

router.post('/sendsms', sendSms);
router.post('/recievesms', recieveSms);
router.post('/api/sent-otp', sendMobileOtp);
router.post('/api/sent-message', sendMessage);

// Authentication and Authorizations Routes
router.post('/auth/register', validator, register);
router.post('/auth/login', validator, login);
router.get('/auth/is-verified', authorization, authorize);
router.get('/auth/is-authenticated', isAuthenticated);
router.get('/auth/refresh-token', refreshToken);
router.get('/auth/logout', logout);

// verification
router.post('/user/verify', verifyEmail);
router.post('/user/delete-user/:id', deleteUser);

// dashboard routes
router.get('/dashboard', home);
router.get('/testing', testing);
router.get('/api/home/large-vehicles', largeVehicles);
router.get('/api/home/small-vehicles', smallVehicles);
router.post('/api/get-trip-details', getSpecificTripDetails);

// user route
router.get(
  '/api/driver/profile-details/:id',
  authorization,
  getUserProfileDetails
);
router.post('/api/driver/add-availability', isRevoked, addVehicleAvailability);
router.put('/api/driver/remove-availability/:id', removeVehicleAvailability);
router.get('/api/driver/get-trip-details/:id', getTripDetails);

router.put('/api/driver/edit-trip-details/:id', editTripDetails);

// drivers route
router.post('/api/driver/create-profile', authorization, createDriverProfile);
router.put('/api/driver/edit-profile/:id', authorization, editProfile);
router.post('/api/driver/add-vehicle', addVehicle);
router.post('/api/driver/edit-vehicle', editVehicle);
router.post('/api/driver/get-vehicles', authorization, getProfileVehicles);
router.delete(
  '/api/driver/delete-vehicle/:vehicleId/:orgId',
  isRevoked,
  deleteVehicle
);
router.put(
  '/api/driver/complete-registration/:id',
  authorization,
  completeRegistration
);

// customer route
router.post(
  '/api/customer/create-profile',
  authorization,
  createCustomerProfile
);
router.post('/api/customer/book-this-ride', isRevoked, bookTrip);
router.put('/api/customer/edit-profile/:id', isRevoked, editCustomerProfile);
router.get('/api/customer/get-booking-log/:id', customerBookingHistory);
router.post('/api/user/contact-us', contactUs);

module.exports = router;

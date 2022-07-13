const {
  generateOtp,
  verifyOtp,
  resetVerification,
  fpVerifyOtp,
  sentOtpTest,
  sentOtpForDriver,
  checkIfMobile,
  fpVerifyDriverMobileOtp,
  verifyAddVehicleOTP,
  generateOneTimePassword,
  verifyOneTimePassword,
  reset,
  verifyForgotPasswordOneTimePassword,
  isVerified
} = require('./controller/SmsController');
const {
  register,
  login,
  authorize,
  refreshToken,
  logout,
  isAuthenticated,
  verifyEmail,
  deleteUser,
  userForgotPassword,
  changePassword
} = require('./controller/jwtAuth');
const validator = require('./middleware/validator');
const authorization = require('./middleware/authorization');

var router = require('express').Router();
var bodyParser = require('body-parser');
const {
  home,
  largeVehicles,
  smallVehicles,
  testing,
  getBroadcastMessage
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
  contactUs,
  getUserImage,
  forgotPasswordDetails,
  getUserInfo
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

// router.post('/sendsms', sendSms);
// router.post('/recievesms', recieveSms);
router.post('/api/user/generate-otp', generateOtp);
router.post('/api/driver/generate-otp', sentOtpForDriver);
router.post('/api/user/mobile-or-email/:id', checkIfMobile);
router.get('/api/user/user-info/:id', getUserInfo);
router.post('/api/user/verify-driver-otp', fpVerifyDriverMobileOtp);
router.post('/api/user/verify-fp-otp', fpVerifyOtp);
router.post('/api/user/reset-verification', resetVerification);
router.post('/api/user/user-forgot-password', userForgotPassword);
router.post('/api/user/change-password', changePassword);

// Authentication and Authorizations Routes
router.post('/api/auth/register', validator, register);
router.post('/api/auth/login', validator, login);
router.get('/api/auth/is-authenticated', isAuthenticated);
router.get('/api/auth/refresh-token', refreshToken);
router.get('/api/auth/logout', logout);

// verification
router.post('/api/user/verify', verifyEmail);
router.post('/api/user/add-vehicle-verify', verifyAddVehicleOTP);
router.post('/api/user/delete-user/:id', deleteUser);

// dashboard routes
router.get('/api/dashboard', home);
router.get('/api/testing', testing);
router.get('/api/home/large-vehicles', largeVehicles);
router.get('/api/home/small-vehicles', smallVehicles);
router.post('/api/get-trip-details', getSpecificTripDetails);
router.get('/api/get-broadcast', getBroadcastMessage);

// user route
router.get(
  '/api/driver/profile-details/:id',
  // authorization,
  getUserProfileDetails
);
router.post('/api/driver/add-availability', isRevoked, addVehicleAvailability);
router.put('/api/driver/remove-availability/:id', removeVehicleAvailability);
router.get('/api/driver/get-trip-details/:id', getTripDetails);
router.get('/api/user/get-user-image/:id', getUserImage);
router.get('/api/user/forgot-password-details/:id', forgotPasswordDetails);

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
router.put('/api/customer/edit-profile', editCustomerProfile);
router.get('/api/customer/get-booking-log/:id', customerBookingHistory);
router.post('/api/user/contact-us', contactUs);

router.post('/api/send-otp/register', generateOneTimePassword); // id, emailOrMobile
router.post('/api/send-otp/driver-mobile-number', generateOneTimePassword); // id, emailOrMobile, checkIfMobileExists
router.post('/api/send-otp/add-vehicle', generateOneTimePassword); // id, emailOrMobile
router.post('/api/send-otp/forgot-password', generateOneTimePassword); // emailOrMobile

router.post('/api/verify/register', verifyOneTimePassword); // id, uniqueString
router.post('/api/verify/driver-mobile-number', verifyOneTimePassword); // id, uniqueString
router.post('/api/verify/add-vehicle', verifyOneTimePassword); // id, uniqueString
router.post('/api/verify/forgot-password', verifyForgotPasswordOneTimePassword); // emailOrMobile, uniqueString

router.post('/api/verify/reset', reset); // emailOrMobile , id
router.get('/api/verify/is-verified/:id', isVerified); // id

module.exports = router;

var router = require('express').Router();
var bodyParser = require('body-parser');
const {
  getUsers,
  getUserDetails,
  editUserProfile,
  deleteUser,
  revokeUser,
  unBlockUser,
  addUserProfile,
  getUsersBasedOnRole,
  getVehicles,
  getVehicleDetails,
  recoverVehicle,
  getVehiclesBasedOncategory,
  getOrganizations,
  getOrganizationDetails,
  editOrg,
  getTrips,
  getTripDetails,
  getQueries,
  getQueryDetails,
  deleteQuery,
  getBookings,
  getBookingDetails,
  writeMessage,
  adminDashboard
} = require('./controller/adminController');
const { isRevoked } = require('./middleware/isRevoked');

// admin route
router.post('/get-users', getUsers);
router.get('/get-vehicles', getVehicles);
router.get('/get-organizations', getOrganizations);
router.get('/get-trips', getTrips);
router.get('/get-queries', getQueries);
router.get('/get-bookings', getBookings);
router.post('/get-specific-users', getUsersBasedOnRole);
router.post('/get-specific-vehicles', getVehiclesBasedOncategory);
router.get('/get-user-details', getUserDetails);
router.get('/get-vehicle-details', getVehicleDetails);
router.get('/get-organization-details', getOrganizationDetails);
router.get('/get-trip-details', getTripDetails);
router.get('/get-query-details', getQueryDetails);
router.get('/get-booking-details', getBookingDetails);
router.delete('/delete-user', deleteUser);
router.delete('/delete-query', deleteQuery);
router.put('/revoke-user', revokeUser);
router.put('/recover-vehicle', recoverVehicle);
router.put('/unblock-user', unBlockUser);
router.post('/add-user', addUserProfile);
router.put('/edit-user/:id', editUserProfile);
router.put('/edit-organization', editOrg);
router.post('/write-message', writeMessage);
router.get('/get-dashboard-details', adminDashboard);

module.exports = router;

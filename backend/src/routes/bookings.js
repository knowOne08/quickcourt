// backend/src/routes/bookings.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const {authenticate} = require('../middleware/auth');

// All routes require authentication
// router.use(authenticate);

router.post('/', bookingController.createBooking);
router.get('/my-bookings', bookingController.getUserBookings);
router.get('/available-slots/:courtId/:date', bookingController.getAvailableSlots);
// router.get('/:id', bookingController.getBookingById);
router.patch('/:id/cancel', bookingController.cancelBooking);
// router.post('/:id/review', bookingController.addReview);

// Owner routes
// router.get('/venue/:venueId/bookings', bookingController.getVenueBookings);

module.exports = router;
// backend/src/routes/bookings.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

const { protect } = require('../middleware/auth');

// Public route for checking availability - this should be accessible without login
router.get('/available-slots/:courtId/:date', bookingController.getAvailableSlots);

// All other routes require authentication
router.use(protect);

router.post('/', bookingController.createBooking);
router.get('/my-bookings', bookingController.getUserBookings);
router.get('/:id', bookingController.getBookingById);
router.patch('/:id/cancel', bookingController.cancelBooking);
router.post('/:id/review', bookingController.addReview);

// Owner routes
router.get('/venue/:venueId/bookings', bookingController.getVenueBookings);

module.exports = router;
// backend/src/routes/venues.js
const express = require('express');
const router = express.Router();
const venueController = require('../controllers/venueController');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/', venueController.getAllVenues);
router.get('/top', venueController.getTopVenues);
router.get('/search', venueController.searchVenues);
router.get('/cities', venueController.getVenueCities);
router.get('/sports', venueController.getAvailableSports);
router.get('/:id', venueController.getVenueById);
router.get('/:id/reviews', venueController.getVenueReviews);
router.get('/:id/availability', venueController.getVenueAvailability);
router.get('/:id/courts', venueController.getVenueCourts);

// Protected routes - require authentication
router.use(protect);

// User routes (authenticated users)
router.post('/:id/reviews', venueController.createReview);
router.post('/:id/favorite', venueController.addToFavorites);
router.delete('/:id/favorite', venueController.removeFromFavorites);

// Facility owner routes
router.post('/', restrictTo('facility_owner', 'admin'), upload.array('images', 10), venueController.createVenue);
router.patch('/:id', restrictTo('facility_owner', 'admin'), upload.array('images', 10), venueController.updateVenue);
router.delete('/:id', restrictTo('facility_owner', 'admin'), venueController.deleteVenue);

// Court management routes
router.post('/:id/courts', restrictTo('facility_owner', 'admin'), venueController.addCourt);
router.patch('/:venueId/courts/:courtId', restrictTo('facility_owner', 'admin'), venueController.updateCourt);
router.delete('/:venueId/courts/:courtId', restrictTo('facility_owner', 'admin'), venueController.deleteCourt);

// Venue analytics (owner only)
router.get('/:id/analytics', restrictTo('facility_owner', 'admin'), venueController.getVenueAnalytics);
router.get('/:id/bookings', restrictTo('facility_owner', 'admin'), venueController.getVenueBookings);

module.exports = router;

// Bookmark
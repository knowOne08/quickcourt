const express = require('express');
const ownerController = require('../controllers/ownerController');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Protect all routes except registration
router.use((req, res, next) => {
  // Skip authentication for registration endpoint
  if (req.path === '/register' && req.method === 'POST') {
    return next();
  }
  // Apply authentication for all other routes
  return protect(req, res, next);
});

// Apply role restriction for non-registration routes
router.use((req, res, next) => {
  // Skip role restriction for registration endpoint
  if (req.path === '/register' && req.method === 'POST') {
    return next();
  }
  // Apply facility_owner role restriction for all other routes
  return restrictTo('facility_owner')(req, res, next);
});

// Owner registration and profile
router.post('/register', ownerController.registerAsOwner);
router.get('/profile', ownerController.getOwnerProfile);
router.patch('/profile', upload.single('profileImage'), ownerController.updateOwnerProfile);

// Venue management
router.post('/venues', upload.array('images', 10), ownerController.createVenue);
router.get('/venues', ownerController.getOwnerVenues);
router.get('/venues/:id', ownerController.getVenueDetails);
router.patch('/venues/:id', upload.array('images', 10), ownerController.updateVenue);
router.delete('/venues/:id', ownerController.deleteVenue);

// Court management
router.post('/venues/:venueId/courts', ownerController.addCourt);
router.patch('/courts/:id', ownerController.updateCourt);
router.delete('/courts/:id', ownerController.deleteCourt);

// Booking management
router.get('/bookings', ownerController.getAllBookings);
router.get('/venues/:venueId/bookings', ownerController.getVenueBookings);
router.patch('/bookings/:id/status', ownerController.updateBookingStatus);

// Analytics and reports
router.get('/analytics/dashboard', ownerController.getDashboardAnalytics);
router.get('/analytics/revenue', ownerController.getRevenueAnalytics);
router.get('/analytics/bookings', ownerController.getBookingAnalytics);

// Availability management
router.get('/venues/:venueId/availability', ownerController.getVenueAvailability);
router.post('/venues/:venueId/availability', ownerController.setVenueAvailability);
router.patch('/courts/:courtId/availability', ownerController.updateCourtAvailability);

// Reviews and ratings
router.get('/reviews', ownerController.getOwnerReviews);
router.get('/venues/:venueId/reviews', ownerController.getVenueReviews);
router.post('/reviews/:id/reply', ownerController.replyToReview);

// Financial management
router.get('/earnings', ownerController.getEarnings);
router.get('/payouts', ownerController.getPayouts);
router.post('/payouts/request', ownerController.requestPayout);

module.exports = router;
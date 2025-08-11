// backend/src/routes/venues.js
const express = require('express');
const router = express.Router();
// const venueController = require('../controllers/venueController');
// const auth = require('../middleware/auth');
// const upload = require('../middleware/fileUpload');

// Public routes
// router.get('/', venueController.getAllVenues);
// router.get('/top', venueController.getTopVenues);
// router.get('/search', venueController.searchVenues);
// router.get('/:id', venueController.getVenueById);
// router.get('/:id/reviews', venueController.getVenueReviews);

// Protected routes
// router.use(auth);
// router.post('/:id/reviews', venueController.createReview);

// Facility owner routes
// router.post('/', auth, upload.array('images', 10), venueController.createVenue);
// router.patch('/:id', auth, venueController.updateVenue);
// router.delete('/:id', auth, venueController.deleteVenue);

module.exports = router;

// Bookmark
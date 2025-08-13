// backend/src/routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); // Your authentication middleware
const reviewController = require('../controllers/reviewController');

// URL: POST /api/reviews/
// Desc: Submit a new review for a booking
router.post('/', protect, reviewController.submitReview);

// URL: GET /api/reviews/venue/:venueId
// Desc: Get all approved reviews for a specific venue
router.get('/venue/:venueId', reviewController.getReviewsForVenue);

module.exports = router;

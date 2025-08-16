// backend/src/controllers/reviewController.js
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Venue = require('../models/Venue');

// Submit a new review for a completed booking
exports.submitReview = async (req, res) => {
  const { bookingId, rating, title, comment } = req.body;
  const userId = req.user.id;

  try {
    const booking = await Booking.findById(bookingId);

    // --- Security & Validation Checks ---
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }
    if (booking.user.toString() !== userId) {
      return res.status(403).json({ message: 'You can only review your own bookings.' });
    }
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ message: 'You can only review completed bookings.' });
    }
    if (booking.review) {
      return res.status(400).json({ message: 'This booking has already been reviewed.' });
    }

    // Create the new review
    const review = await Review.create({
      user: userId,
      venue: booking.venue,
      court: booking.court,
      booking: bookingId,
      rating,
      title,
      comment
    });

    // Link the new review back to the booking record
    booking.review = review._id;
    await booking.save();

    // --- NEW: Recalculate and update venue ratings ---
    // Use the static method from your Review model to get fresh stats
    const stats = await Review.getVenueStats(booking.venue);

    if (stats && stats.length > 0) {
      const venueStats = stats[0];
      await Venue.findByIdAndUpdate(booking.venue, {
        $set: {
          'rating.average': venueStats.averageRating,
          'rating.count': venueStats.totalReviews,
          'rating.breakdown': venueStats.ratingBreakdown,
        }
      });
    }
    // --- END of new logic ---

    res.status(201).json({ status: 'success', data: { review } });
  } catch (error) {
    console.error("Review submission error:", error);
    res.status(500).json({ message: 'Server error while submitting review.' });
  }
};

// Get all approved reviews for a specific venue
exports.getReviewsForVenue = async (req, res) => {
  try {
    const { venueId } = req.params;
    const reviews = await Review.find({ venue: venueId, isApproved: true, isHidden: false })
      .populate('user', 'name') // Only get the user's name for privacy
      .sort({ createdAt: -1 });

    res.status(200).json({ status: 'success', data: { reviews } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch reviews.' });
  }
};

import api from './api';

export const reviewService = {
  // Submit a new review
  submitReview: (reviewData) => {
    return api.post('/reviews', reviewData);
  },

  // Get all reviews for a specific venue
  getReviewsForVenue: (venueId) => {
    return api.get(`/reviews/venue/${venueId}`);
  },
};

// frontend/src/services/venueService.js
import api from './api';

export const venueService = {
  // Get all venues with filters
  getAllVenues: (params = {}) => {
    return api.get('/venues', { params });
  },

  // Get top-rated venues
  getTopVenues: (limit = 6) => {
    return api.get('/venues/top', { params: { limit } });
  },

  // Search venues
  searchVenues: (params = {}) => {
    return api.get('/venues/search', { params });
  },

  // Get venue by ID
  getVenueById: (id) => {
    return api.get(`/venues/${id}`);
  },

  // Get venue reviews
  getVenueReviews: (id, params = {}) => {
    return api.get(`/venues/${id}/reviews`, { params });
  },

  // Get venue availability
  getVenueAvailability: (id, params = {}) => {
    return api.get(`/venues/${id}/availability`, { params });
  },

  // Get venue courts
  getVenueCourts: (id) => {
    return api.get(`/venues/${id}/courts`);
  },

  // Get venue cities
  getVenueCities: () => {
    return api.get('/venues/cities');
  },

  // Get available sports
  getAvailableSports: () => {
    return api.get('/venues/sports');
  },

  // Create venue (owner only)
  createVenue: (venueData) => {
    return api.post('/venues', venueData);
  },

  // Update venue (owner only)
  updateVenue: (id, venueData) => {
    return api.patch(`/venues/${id}`, venueData);
  },

  // Delete venue (owner only)
  deleteVenue: (id) => {
    return api.delete(`/venues/${id}`);
  },

  // Add court to venue (owner only)
  addCourt: (venueId, courtData) => {
    return api.post(`/venues/${venueId}/courts`, courtData);
  },

  // Update court (owner only)
  updateCourt: (venueId, courtId, courtData) => {
    return api.patch(`/venues/${venueId}/courts/${courtId}`, courtData);
  },

  // Delete court (owner only)
  deleteCourt: (venueId, courtId) => {
    return api.delete(`/venues/${venueId}/courts/${courtId}`);
  },

  // Create review (authenticated users)
  createReview: (venueId, reviewData) => {
    return api.post(`/venues/${venueId}/reviews`, reviewData);
  },

  // Add to favorites (authenticated users)
  addToFavorites: (venueId) => {
    return api.post(`/venues/${venueId}/favorite`);
  },

  // Remove from favorites (authenticated users)
  removeFromFavorites: (venueId) => {
    return api.delete(`/venues/${venueId}/favorite`);
  },

  // Get venue analytics (owner only)
  getVenueAnalytics: (id) => {
    return api.get(`/venues/${id}/analytics`);
  },

  // Get venue bookings (owner only)
  getVenueBookings: (id) => {
    return api.get(`/venues/${id}/bookings`);
  }
};
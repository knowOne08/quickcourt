// frontend/src/services/venueService.js
import api from './api';

export const venueService = {
  // Public venue endpoints
  getAllVenues: (filters = {}) => api.get('/venues', { params: filters }),
  getVenueById: (id) => api.get(`/venues/${id}`),
  getTopVenues: (location = '') => api.get('/venues/top', { params: { location } }),
  searchVenues: (query, filters = {}) => api.get('/venues/search', { 
    params: { q: query, ...filters } 
  }),
  
  // Venue reviews
  getVenueReviews: (id) => api.get(`/venues/${id}/reviews`),
  createReview: (id, reviewData) => api.post(`/venues/${id}/reviews`, reviewData),
  
  // Venue details and courts
  getVenueCourts: (id) => api.get(`/venues/${id}/courts`),
  getAvailableSlots: (courtId, date) => api.get(`/venues/courts/${courtId}/slots`, {
    params: { date }
  }),
  
  // Filtering and search
  getVenuesByLocation: (location) => api.get('/venues', { 
    params: { location } 
  }),
  getVenuesBySport: (sport) => api.get('/venues', { 
    params: { sport } 
  }),
  
  // Featured and recommendations
  getFeaturedVenues: () => api.get('/venues/featured'),
  getRecommendedVenues: (userId) => api.get(`/venues/recommended/${userId}`),
  
  // Nearby venues
  getNearbyVenues: (lat, lng, radius = 10) => api.get('/venues/nearby', {
    params: { lat, lng, radius }
  })
};
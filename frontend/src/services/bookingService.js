// frontend/src/services/bookingService.js
import api from './api';

export const bookingService = {
  // Create a new booking
  createBooking: (bookingData) => {
    return api.post('/bookings', bookingData);
  },

  // Get user's bookings
  getUserBookings: (params = {}) => {
    return api.get('/bookings/my-bookings', { params });
  },

  // Get available slots for a court
  getAvailableSlots: (courtId, date, duration = 60) => {
    return api.get(`/bookings/available-slots/${courtId}/${date}`, {
      params: { duration }
    });
  },

  // Cancel a booking
  cancelBooking: (bookingId, reason) => {
    return api.patch(`/bookings/${bookingId}/cancel`, { reason });
  },

  // Get booking by ID
  getBookingById: (bookingId) => {
    return api.get(`/bookings/${bookingId}`);
  },

  // Add review to booking
  addReview: (bookingId, reviewData) => {
    return api.post(`/bookings/${bookingId}/review`, reviewData);
  },

  // Get venue bookings (owner only)
  getVenueBookings: (venueId, params = {}) => {
    return api.get(`/bookings/venue/${venueId}/bookings`, { params });
  }
};
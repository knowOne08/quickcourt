// frontend/src/services/bookingService.js
import api from './api';

export const bookingService = {
  // Create and manage bookings
  createBooking: (bookingData) => api.post('/bookings', bookingData),
  getBookingById: (id) => api.get(`/bookings/${id}`),
  getUserBookings: (userId) => api.get('/bookings/my-bookings'),
  
  // Booking status management
  cancelBooking: (id, reason = '') => api.patch(`/bookings/${id}/cancel`, { reason }),
  confirmBooking: (id) => api.patch(`/bookings/${id}/confirm`),
  completeBooking: (id) => api.patch(`/bookings/${id}/complete`),
  
  // Availability and slots
  getAvailableSlots: (courtId, date) => api.get(`/bookings/available-slots/${courtId}/${date}`),
  checkSlotAvailability: (courtId, date, startTime, endTime) => api.post('/bookings/check-availability', {
    courtId,
    date,
    startTime,
    endTime
  }),
  
  // Reviews and ratings
  addReview: (bookingId, reviewData) => api.post(`/bookings/${bookingId}/review`, reviewData),
  getBookingReview: (bookingId) => api.get(`/bookings/${bookingId}/review`),
  
  // Owner/Admin booking management
  getVenueBookings: (venueId, filters = {}) => api.get(`/bookings/venue/${venueId}/bookings`, {
    params: filters
  }),
  updateBookingStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
  
  // Booking history and analytics
  getBookingHistory: (filters = {}) => api.get('/bookings/history', { params: filters }),
  getBookingStats: () => api.get('/bookings/stats'),
  
  // Payment related
  initiatePayment: (bookingId, paymentData) => api.post(`/bookings/${bookingId}/payment`, paymentData),
  verifyPayment: (bookingId, paymentId) => api.post(`/bookings/${bookingId}/verify-payment`, { paymentId }),
  
  // Notifications
  getBookingNotifications: () => api.get('/bookings/notifications'),
  markNotificationRead: (notificationId) => api.patch(`/bookings/notifications/${notificationId}/read`)
};
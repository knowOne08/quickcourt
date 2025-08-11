// frontend/src/services/userService.js
import api from './api';

export const userService = {
  // Profile management
  getProfile: () => {
    return api.get('/users/profile');
  },

  updateProfile: (userData) => {
    return api.patch('/users/profile', userData);
  },

  changePassword: (oldPassword, newPassword) => {
    return api.patch('/users/change-password', { oldPassword, newPassword });
  },

  deleteAccount: (password) => {
    return api.delete('/users/account', { data: { password } });
  },

  // Booking history
  getBookingHistory: (params = {}) => {
    return api.get('/users/bookings', { params });
  },

  getBookingDetails: (bookingId) => {
    return api.get(`/users/bookings/${bookingId}`);
  },

  // Favorite venues
  getFavoriteVenues: () => {
    return api.get('/users/favorites');
  },

  addFavoriteVenue: (venueId) => {
    return api.post(`/users/favorites/${venueId}`);
  },

  removeFavoriteVenue: (venueId) => {
    return api.delete(`/users/favorites/${venueId}`);
  },

  // Reviews and ratings
  getUserReviews: (params = {}) => {
    return api.get('/users/reviews', { params });
  },

  createReview: (reviewData) => {
    return api.post('/users/reviews', reviewData);
  },

  updateReview: (reviewId, reviewData) => {
    return api.patch(`/users/reviews/${reviewId}`, reviewData);
  },

  deleteReview: (reviewId) => {
    return api.delete(`/users/reviews/${reviewId}`);
  },

  // Notifications
  getNotifications: () => {
    return api.get('/users/notifications');
  },

  markNotificationRead: (notificationId) => {
    return api.patch(`/users/notifications/${notificationId}/read`);
  },

  // Payment methods
  getPaymentMethods: () => {
    return api.get('/users/payment-methods');
  },

  addPaymentMethod: (paymentData) => {
    return api.post('/users/payment-methods', paymentData);
  },

  removePaymentMethod: (methodId) => {
    return api.delete(`/users/payment-methods/${methodId}`);
  },

  // User statistics
  getUserStats: () => {
    return api.get('/users/stats');
  },

  // User preferences
  getPreferences: () => {
    return api.get('/users/preferences');
  },

  updatePreferences: (preferences) => {
    return api.patch('/users/preferences', preferences);
  }
};

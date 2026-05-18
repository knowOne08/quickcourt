// frontend/src/services/userService.js
import api from './api';

export const userService = {
  // Stats
  getUserStats: () => api.get('/users/stats'),
  
  // Profile
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData) => api.patch('/users/profile', profileData),
  changePassword: (oldPassword, newPassword) => api.patch('/users/change-password', { oldPassword, newPassword }),
  
  // Favorites
  getFavorites: () => api.get('/users/favorites'),
  addFavorite: (venueId) => api.post(`/users/favorites/${venueId}`),
  removeFavorite: (venueId) => api.delete(`/users/favorites/${venueId}`),
  
  // Bookings
  getBookingHistory: (params) => api.get('/users/bookings', { params }),
  getBookingDetails: (id) => api.get(`/users/bookings/${id}`),

  // Public/All Users
  getAllUsers: async (search = '', role = 'user') => {
    try {
      const response = await api.get(`/users/all?search=${search}&role=${role}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, error: 'Failed to fetch users' };
    }
  },

  getPublicProfile: async (userId) => {
    try {
      const response = await api.get(`/users/profile/public/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, error: 'Failed to fetch user profile' };
    }
  }
};

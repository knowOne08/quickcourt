// frontend/src/services/authService.js
import api from './api';

export const authService = {
  // Authentication
  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response;
  },

  logout: () => {
    return api.post('/auth/logout');
  },

  // Email verification
  verifyEmail: (code) => api.post('/auth/verify-email', { code }),
  resendVerificationEmail: (email) => api.post('/auth/resend-verification', { email }),

  // Password management
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  changePassword: (currentPassword, newPassword) => api.post('/auth/change-password', {
    currentPassword,
    newPassword
  }),

  // User profile (backend exposes these under /users)
  getCurrentUser: async () => {
    const response = await api.get('/users/profile');
    return response;
  },

  updateProfile: async (userData) => {
    const response = await api.patch('/users/profile', userData);
    return response;
  },

  uploadAvatar: (formData) => api.post('/auth/upload-avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),

  // Account management
  deactivateAccount: (reason) => api.post('/auth/deactivate', { reason }),
  deleteAccount: (password) => api.delete('/auth/delete-account', {
    data: { password }
  }),

  // Social authentication
  googleAuth: (googleToken) => api.post('/auth/google', { token: googleToken }),
  facebookAuth: (facebookToken) => api.post('/auth/facebook', { token: facebookToken }),

  // Two-factor authentication
  enableTwoFactor: () => api.post('/auth/2fa/enable'),
  disableTwoFactor: (code) => api.post('/auth/2fa/disable', { code }),
  verifyTwoFactor: (code) => api.post('/auth/2fa/verify', { code }),

  // Session management
  refreshToken: () => api.post('/auth/refresh-token'),
  getAllSessions: () => api.get('/auth/sessions'),
  terminateSession: (sessionId) => api.delete(`/auth/sessions/${sessionId}`),
  terminateAllSessions: () => api.delete('/auth/sessions/all')
};
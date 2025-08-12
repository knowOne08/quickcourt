// frontend/src/services/adminService.js
import api from './api';

export const adminService = {
  // Dashboard
  getGlobalStats: () => api.get('/admin/stats'),
  getChartData: () => api.get('/admin/charts'),
  
  // Users Management
  getAllUsers: (filters = {}) => api.get('/admin/users', { params: filters }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUserStatus: (id, status) => api.patch(`/admin/users/${id}/status`, { status }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  
  // Facility Owners
  getFacilityOwners: () => api.get('/admin/facility-owners'),
  approveFacilityOwner: (id) => api.patch(`/admin/facility-owners/${id}/approve`),
  
  // Venues Management (Updated)
  getAllVenues: (filters = {}) => api.get('/admin/venues', { params: filters }),
  getVenueById: (id) => api.get(`/admin/venues/${id}`),
  getPendingVenues: () => api.get('/admin/venues', { params: { status: 'pending' } }),
  approveVenue: (id, reason = '') => api.patch(`/admin/venues/${id}/approve`, { reason }),
  rejectVenue: (id, reason) => api.patch(`/admin/venues/${id}/reject`, { reason }),
  updateVenueStatus: (id, status, reason) => api.patch(`/admin/venues/${id}/status`, { status, reason }),
  
  // Legacy facility endpoints (for backward compatibility)
  getPendingFacilities: () => api.get('/admin/venues', { params: { status: 'pending' } }),
  getAllFacilities: (filters = {}) => api.get('/admin/venues', { params: filters }),
  approveFacility: (id, data) => api.patch(`/admin/venues/${id}/approve`, data),
  rejectFacility: (id, reason) => api.patch(`/admin/venues/${id}/reject`, { reason }),
  
  // Bookings
  getAllBookings: (filters = {}) => api.get('/admin/bookings', { params: filters }),
  getBookingDetails: (id) => api.get(`/admin/bookings/${id}`),
  
  // Analytics
  getPlatformAnalytics: (period = '30d') => api.get(`/admin/analytics?period=${period}`),
  getRevenueAnalytics: (period = '30d') => api.get(`/admin/analytics/revenue?period=${period}`),
  getUserAnalytics: (period = '30d') => api.get(`/admin/analytics/users?period=${period}`),
  
  // Reports
  generateReport: (type, filters) => api.post('/admin/reports/generate', { type, filters }),
  getReports: () => api.get('/admin/reports'),
  
  // Settings
  getSystemSettings: () => api.get('/admin/settings'),
  updateSystemSettings: (settings) => api.patch('/admin/settings', settings),
  
  // Support
  getSupportTickets: () => api.get('/admin/support/tickets'),
  updateTicketStatus: (id, status) => api.patch(`/admin/support/tickets/${id}`, { status })
};

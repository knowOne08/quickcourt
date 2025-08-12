// frontend/src/services/ownerService.js
import api from './api';

export const ownerService = {
  // Test endpoint
  testConnection: () => api.get('/owner/profile'),
  
  // Dashboard
  getDashboardStats: () => api.get('/owner/dashboard/stats'),
  getChartData: (timeRange = 'weekly') => api.get(`/owner/dashboard/charts?range=${timeRange}`),
  
  // Venues (Updated from facilities)
  getVenues: () => api.get('/owner/venues'),
  createVenue: (venueData) => api.post('/owner/venues', venueData),
  updateVenue: (id, venueData) => api.patch(`/owner/venues/${id}`, venueData),
  deleteVenue: (id) => api.delete(`/owner/venues/${id}`),
  getVenueDetails: (id) => api.get(`/owner/venues/${id}`),
  
  // Legacy facility endpoints (for backward compatibility)
  getFacilities: () => api.get('/owner/venues'),
  createFacility: (facilityData) => api.post('/owner/venues', facilityData),
  updateFacility: (id, facilityData) => api.patch(`/owner/venues/${id}`, facilityData),
  deleteFacility: (id) => api.delete(`/owner/venues/${id}`),
  
  // Bookings
  getBookings: (filters = {}) => api.get('/owner/bookings', { params: filters }),
  updateBookingStatus: (id, status) => api.patch(`/owner/bookings/${id}/status`, { status }),
  
  // Analytics
  getRevenueAnalytics: (period = '30d') => api.get(`/owner/analytics/revenue?period=${period}`),
  getBookingAnalytics: (period = '30d') => api.get(`/owner/analytics/bookings?period=${period}`),
  
  // Courts
  getCourts: (venueId) => api.get(`/owner/venues/${venueId}/courts`),
  createCourt: (venueId, courtData) => api.post(`/owner/venues/${venueId}/courts`, courtData),
  updateCourt: (venueId, courtId, courtData) => api.patch(`/owner/venues/${venueId}/courts/${courtId}`, courtData),
  deleteCourt: (venueId, courtId) => api.delete(`/owner/venues/${venueId}/courts/${courtId}`),
  
  // Profile
  getProfile: () => api.get('/owner/profile'),
  updateProfile: (profileData) => api.patch('/owner/profile', profileData)
};

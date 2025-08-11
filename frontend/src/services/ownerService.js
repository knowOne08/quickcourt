// frontend/src/services/ownerService.js
import api from './api';

export const ownerService = {
  // Dashboard
  getDashboardStats: () => api.get('/owner/dashboard/stats'),
  getChartData: (timeRange = 'weekly') => api.get(`/owner/dashboard/charts?range=${timeRange}`),
  
  // Facilities
  getFacilities: () => api.get('/owner/facilities'),
  createFacility: (facilityData) => api.post('/owner/facilities', facilityData),
  updateFacility: (id, facilityData) => api.patch(`/owner/facilities/${id}`, facilityData),
  deleteFacility: (id) => api.delete(`/owner/facilities/${id}`),
  
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

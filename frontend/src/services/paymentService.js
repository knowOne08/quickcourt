// frontend/src/services/paymentService.js
import api from './api';

export const paymentService = {
  // Payment processing
  createPaymentIntent: (bookingData) => api.post('/payments/create-intent', bookingData),
  confirmPayment: (paymentData) => api.post('/payments/confirm', paymentData),
  
  // Payment methods
  getPaymentMethods: () => api.get('/payments/methods'),
  addPaymentMethod: (methodData) => api.post('/payments/methods', methodData),
  removePaymentMethod: (methodId) => api.delete(`/payments/methods/${methodId}`),
  
  // Payment history
  getPaymentHistory: (filters = {}) => api.get('/payments/history', { params: filters }),
  getPaymentDetails: (paymentId) => api.get(`/payments/${paymentId}`),
  
  // Refunds
  initiateRefund: (paymentId, amount, reason) => api.post(`/payments/${paymentId}/refund`, {
    amount,
    reason
  }),
  getRefundStatus: (refundId) => api.get(`/payments/refunds/${refundId}`),
  
  // Wallet operations
  getWalletBalance: () => api.get('/payments/wallet/balance'),
  addMoneyToWallet: (amount, paymentMethod) => api.post('/payments/wallet/add', {
    amount,
    paymentMethod
  }),
  
  // Pricing and fees
  calculateBookingPrice: (bookingData) => api.post('/payments/calculate-price', bookingData),
  getPlatformFees: () => api.get('/payments/platform-fees'),
  
  // Admin payment management
  getAllPayments: (filters = {}) => api.get('/admin/payments', { params: filters }),
  processRefund: (paymentId, refundData) => api.post(`/admin/payments/${paymentId}/process-refund`, refundData),
  
  // Payment analytics
  getPaymentAnalytics: (period = '30d') => api.get(`/payments/analytics?period=${period}`),
  getRevenueReport: (startDate, endDate) => api.get('/payments/revenue-report', {
    params: { startDate, endDate }
  })
};
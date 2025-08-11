const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Protect all routes and restrict to admin
// router.use(protect);
router.use(restrictTo('admin'));

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);
router.get('/users/stats', adminController.getUserStats);

// Owner management
router.get('/owners', adminController.getAllOwners);
router.get('/owners/:id', adminController.getOwnerById);
router.patch('/owners/:id/verify', adminController.verifyOwner);
router.patch('/owners/:id/status', adminController.updateOwnerStatus);

// Venue management
router.get('/venues', adminController.getAllVenues);
router.get('/venues/:id', adminController.getVenueById);
router.patch('/venues/:id/approve', adminController.approveVenue);
router.patch('/venues/:id/reject', adminController.rejectVenue);
router.patch('/venues/:id/status', adminController.updateVenueStatus);
router.delete('/venues/:id', adminController.deleteVenue);

// Booking management
router.get('/bookings', adminController.getAllBookings);
router.get('/bookings/:id', adminController.getBookingById);
router.patch('/bookings/:id/status', adminController.updateBookingStatus);
router.get('/bookings/stats', adminController.getBookingStats);

// Payment management
router.get('/payments', adminController.getAllPayments);
router.get('/payments/:id', adminController.getPaymentById);
router.post('/payments/:id/process-refund', adminController.processRefund);
router.get('/payments/stats', adminController.getPaymentStats);

// Review and rating management
router.get('/reviews', adminController.getAllReviews);
router.get('/reviews/:id', adminController.getReviewById);
router.patch('/reviews/:id/moderate', adminController.moderateReview);
router.delete('/reviews/:id', adminController.deleteReview);

// Analytics and reports
router.get('/analytics/dashboard', adminController.getDashboardAnalytics);
router.get('/analytics/revenue', adminController.getRevenueAnalytics);
router.get('/analytics/users', adminController.getUserAnalytics);
router.get('/analytics/venues', adminController.getVenueAnalytics);
router.get('/analytics/bookings', adminController.getBookingAnalytics);

// Platform settings
router.get('/settings', adminController.getPlatformSettings);
router.patch('/settings', adminController.updatePlatformSettings);

// Support and disputes
router.get('/support-tickets', adminController.getAllSupportTickets);
router.get('/support-tickets/:id', adminController.getSupportTicketById);
router.patch('/support-tickets/:id', adminController.updateSupportTicket);

// Content management
router.get('/content/banners', adminController.getAllBanners);
router.post('/content/banners', adminController.createBanner);
router.patch('/content/banners/:id', adminController.updateBanner);
router.delete('/content/banners/:id', adminController.deleteBanner);

// System monitoring
router.get('/system/health', adminController.getSystemHealth);
router.get('/system/logs', adminController.getSystemLogs);

module.exports = router;
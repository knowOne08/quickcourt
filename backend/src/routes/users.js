const express = require('express');
const router = express.Router();

// Import middleware and controllers
const { protect } = require('../middleware/auth');
const { validateProfileUpdate } = require('../middleware/validation');
const userController = require('../controllers/userController');

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'User routes working',
    timestamp: new Date().toISOString()
  });
});

// Public routes
router.get('/profile/public/:userId', userController.getPublicProfile || ((req, res) => {
  res.json({
    success: true,
    message: 'Public profile - Coming soon',
    userId: req.params.userId
  });
}));

// Protected routes (require authentication)
// router.use(auth); // All routes below require authentication

// Profile management
router.get('/profile', protect, userController.getProfile);
router.patch('/profile', protect, userController.updateProfile);
router.delete('/account', protect, userController.deleteAccount);

// User preferences
router.get('/preferences', userController.getPreferences || ((req, res) => {
  res.json({
    success: true,
    message: 'Get preferences - Coming soon',
    preferences: {
      notifications: true,
      emailUpdates: true,
      smsUpdates: false
    }
  });
}));

router.patch('/preferences', userController.updatePreferences || ((req, res) => {
  res.json({
    success: true,
    message: 'Update preferences - Coming soon',
    preferences: req.body
  });
}));

// Booking history
router.get('/bookings', userController.getBookingHistory);
router.get('/bookings/:bookingId', userController.getBookingDetails || ((req, res) => {
  res.json({
    success: true,
    message: 'Booking details - Coming soon',
    bookingId: req.params.bookingId
  });
}));

// Favorite venues
router.get('/favorites', userController.getFavoriteVenues);
router.post('/favorites/:venueId', userController.addFavoriteVenue);
router.delete('/favorites/:venueId', userController.removeFavoriteVenue);

// Reviews and ratings
router.get('/reviews', userController.getUserReviews || ((req, res) => {
  res.json({
    success: true,
    message: 'User reviews - Coming soon',
    reviews: []
  });
}));

router.post('/reviews', userController.createReview || ((req, res) => {
  res.json({
    success: true,
    message: 'Create review - Coming soon',
    review: req.body
  });
}));

router.patch('/reviews/:reviewId', userController.updateReview || ((req, res) => {
  res.json({
    success: true,
    message: 'Update review - Coming soon',
    reviewId: req.params.reviewId
  });
}));

router.delete('/reviews/:reviewId', userController.deleteReview || ((req, res) => {
  res.json({
    success: true,
    message: 'Delete review - Coming soon',
    reviewId: req.params.reviewId
  });
}));

// Notifications
router.get('/notifications', userController.getNotifications || ((req, res) => {
  res.json({
    success: true,
    message: 'Notifications - Coming soon',
    notifications: []
  });
}));

router.patch('/notifications/:notificationId/read', userController.markNotificationRead || ((req, res) => {
  res.json({
    success: true,
    message: 'Mark notification read - Coming soon',
    notificationId: req.params.notificationId
  });
}));

// Payment methods
router.get('/payment-methods', userController.getPaymentMethods || ((req, res) => {
  res.json({
    success: true,
    message: 'Payment methods - Coming soon',
    paymentMethods: []
  });
}));

router.post('/payment-methods', userController.addPaymentMethod || ((req, res) => {
  res.json({
    success: true,
    message: 'Add payment method - Coming soon',
    paymentMethod: req.body
  });
}));

router.delete('/payment-methods/:methodId', userController.removePaymentMethod || ((req, res) => {
  res.json({
    success: true,
    message: 'Remove payment method - Coming soon',
    methodId: req.params.methodId
  });
}));

// User statistics
router.get('/stats', userController.getUserStats || ((req, res) => {
  res.json({
    success: true,
    message: 'User statistics - Coming soon',
    stats: {
      totalBookings: 0,
      totalSpent: 0,
      favoriteVenues: 0,
      reviewsCount: 0
    }
  });
}));

// Route info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'User API endpoints',
    user: {
      id: req.user?.id,
      email: req.user?.email,
      role: req.user?.role
    },
    endpoints: {
      profile: {
        'GET /api/users/profile': 'Get user profile',
        'PATCH /api/users/profile': 'Update user profile',
        'DELETE /api/users/account': 'Delete user account'
      },
      bookings: {
        'GET /api/users/bookings': 'Get booking history',
        'GET /api/users/bookings/:id': 'Get booking details'
      },
      favorites: {
        'GET /api/users/favorites': 'Get favorite venues',
        'POST /api/users/favorites/:venueId': 'Add favorite venue',
        'DELETE /api/users/favorites/:venueId': 'Remove favorite venue'
      },
      reviews: {
        'GET /api/users/reviews': 'Get user reviews',
        'POST /api/users/reviews': 'Create review',
        'PATCH /api/users/reviews/:id': 'Update review',
        'DELETE /api/users/reviews/:id': 'Delete review'
      },
      notifications: {
        'GET /api/users/notifications': 'Get notifications',
        'PATCH /api/users/notifications/:id/read': 'Mark notification as read'
      },
      payments: {
        'GET /api/users/payment-methods': 'Get payment methods',
        'POST /api/users/payment-methods': 'Add payment method',
        'DELETE /api/users/payment-methods/:id': 'Remove payment method'
      },
      other: {
        'GET /api/users/preferences': 'Get user preferences',
        'PATCH /api/users/preferences': 'Update preferences',
        'GET /api/users/stats': 'Get user statistics',
        'GET /api/users/test': 'Test endpoint'
      }
    }
  });
});

module.exports = router;
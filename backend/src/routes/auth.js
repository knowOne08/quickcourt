const express = require('express');
const router = express.Router();

// Import controllers and middleware
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { 
  authLimiter, 
  passwordResetLimiter, 
  emailVerificationLimiter 
} = require('../middleware/rateLimit');
const { 
  validateSignup, 
  validateLogin, 
  validateEmailVerification
} = require('../middleware/validation');

// Public routes with rate limiting
router.post('/signup', authLimiter, authController.signup);
router.post('/login', authLimiter, authController.login);
router.post('/verify-email', emailVerificationLimiter, authController.verifyEmail);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);
router.put('/reset-password/:resettoken', passwordResetLimiter, authController.resetPassword);

// Protected routes
router.use(protect); // All routes after this middleware are protected

router.get('/me', authController.getMe);
router.get('/sessions', authController.getSessions);
router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);
router.delete('/sessions/:sessionId', authController.terminateSession);
router.post('/terminate-others', authController.terminateOtherSessions);
router.put('/update-password', authController.updatePassword);

// Basic test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes working',
    timestamp: new Date().toISOString(),
    user: req.user ? {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role
    } : null
  });
});

module.exports = router;
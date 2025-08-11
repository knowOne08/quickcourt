const express = require('express');
const router = express.Router();

// Import controllers and middleware
const authController = require('../controllers/authController');
// const auth = require('../middleware/auth');
const { 
  validateSignup, 
  validateLogin, 
  validateEmailVerification
} = require('../middleware/validation');

// Public routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/verify-email', authController.verifyEmail);

// Basic test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth routes working',
    timestamp: new Date().toISOString()
  });
});

// Additional routes (uncomment when ready)
// router.post('/logout', authController.logout);
// router.post('/forgot-password', authController.forgotPassword);
// router.post('/reset-password', authController.resetPassword);
// router.get('/me', auth, authController.getMe);

module.exports = router;
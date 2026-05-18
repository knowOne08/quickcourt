const express = require('express');
const paymentController = require('../controllers/paymentController');
const { protect, restrictTo } = require('../middleware/auth');
const {
  createPaymentLimit,
  verifyPaymentLimit,
  validatePaymentCreation,
  validatePaymentVerification,
  paymentSecurityHeaders,
  logPaymentRequest,
  detectFraudulentActivity,
  verifyWebhookSignature
} = require('../middleware/paymentSecurity');

const router = express.Router();

// Apply security headers to all payment routes
router.use(paymentSecurityHeaders);

// Protect all routes (require authentication)
router.use(protect);

// Payment processing with comprehensive security
router.post('/create-order', 
  createPaymentLimit,
  validatePaymentCreation,
  detectFraudulentActivity,
  logPaymentRequest('create'),
  paymentController.createPaymentOrder
);

router.post('/verify', 
  verifyPaymentLimit,
  validatePaymentVerification,
  logPaymentRequest('verify'),
  paymentController.verifyPayment
);

// Payment history and details
router.get('/history', 
  logPaymentRequest('history'),
  paymentController.getPaymentHistory
);

router.get('/:id', 
  logPaymentRequest('details'),
  paymentController.getPaymentDetails
);

// Refund operations
router.post('/:id/refund', 
  logPaymentRequest('refund'),
  paymentController.initiateRefund
);

router.get('/refunds/:refundId', 
  logPaymentRequest('refund-status'),
  paymentController.getRefundStatus
);

// Webhook endpoint (no authentication required, but signature verification)
router.post('/webhook', 
  verifyWebhookSignature,
  paymentController.handleWebhook
);

module.exports = router;
const express = require('express');
const paymentController = require('../controllers/paymentController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
// router.use(protect);

// Payment processing
router.post('/create-order', paymentController.createPaymentOrder);
router.post('/verify', paymentController.verifyPayment);

// Payment history
router.get('/history', paymentController.getPaymentHistory);
router.get('/:id', paymentController.getPaymentDetails);

// Refunds
router.post('/:id/refund', paymentController.initiateRefund);
router.get('/refunds/:refundId', paymentController.getRefundStatus);

// Wallet operations
router.get('/wallet/balance', paymentController.getWalletBalance);
router.post('/wallet/add', paymentController.addMoneyToWallet);

// Pricing and fees
router.post('/calculate-price', paymentController.calculateBookingPrice);
router.get('/platform-fees', paymentController.getPlatformFees);

// Analytics
router.get('/analytics', paymentController.getPaymentAnalytics);
router.get('/revenue-report', paymentController.getRevenueReport);

module.exports = router;
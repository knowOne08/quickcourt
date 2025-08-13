// src/routes/payments.js

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Admin-only role protection middleware
const adminProtect = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ status: 'error', message: 'Forbidden: Admin access required.' });
};

// Public webhook route (must be before JSON parsing middleware if it's global)
// router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

// All routes below are protected (user must be logged in)
router.use(protect);

// --- Core Payment & Booking ---
router.post('/create-intent', paymentController.paymentCreateLimit, paymentController.createPaymentOrder);
router.post('/confirm', paymentController.paymentVerifyLimit, paymentController.verifyPayment);
router.post('/calculate-price', paymentController.calculateBookingPrice);

// --- User History & Details ---
router.get('/history', paymentController.getPaymentHistory);
router.get('/details/:paymentId', paymentController.getPaymentDetails);

// --- User Wallet ---
router.get('/wallet/balance', paymentController.getWalletBalance);
router.post('/wallet/add', paymentController.addMoneyToWallet);

// --- Refunds ---
router.post('/refunds/:paymentId', paymentController.initiateRefund);
router.get('/refunds/:refundId', paymentController.getRefundStatus);

// --- General Info ---
router.get('/platform-fees', paymentController.getPlatformFees);


// --- ADMIN ROUTES (all require admin role) ---
router.use('/admin', adminProtect); // Apply admin protection to all routes starting with /admin

router.get('/admin/all', paymentController.getAllPayments);
router.post('/admin/refunds/:paymentId', paymentController.processRefund);
router.get('/admin/analytics', paymentController.getPaymentAnalytics);
router.get('/admin/revenue-report', paymentController.getRevenueReport);


module.exports = router;
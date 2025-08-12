// backend/src/middleware/paymentSecurity.js
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Rate limiting configurations
const createPaymentLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 payment creation attempts per IP
  message: {
    status: 'error',
    message: 'Too many payment creation attempts. Please try again later.',
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Payment creation rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      status: 'error',
      message: 'Too many payment creation attempts. Please try again later.',
      retryAfter: 15 * 60
    });
  }
});

const verifyPaymentLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Maximum 10 verification attempts per IP
  message: {
    status: 'error',
    message: 'Too many payment verification attempts. Please try again later.',
    retryAfter: 5 * 60 // 5 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Payment verification rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      status: 'error',
      message: 'Too many payment verification attempts. Please try again later.',
      retryAfter: 5 * 60
    });
  }
});

// Input validation for payment creation
const validatePaymentCreation = [
  body('bookingId')
    .isMongoId()
    .withMessage('Invalid booking ID format'),
    
  body('amount')
    .isFloat({ min: 1, max: 100000 })
    .withMessage('Amount must be between 1 and 100,000')
    .toFloat(),
    
  body('currency')
    .optional()
    .isIn(['INR', 'USD'])
    .withMessage('Currency must be INR or USD')
    .toUpperCase(),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn(`Payment creation validation failed for user ${req.user?.id}:`, errors.array());
      return res.status(400).json({
        status: 'error',
        message: 'Invalid input data',
        errors: errors.array()
      });
    }
    next();
  }
];

// Input validation for payment verification
const validatePaymentVerification = [
  body('razorpay_order_id')
    .isLength({ min: 1 })
    .withMessage('Razorpay order ID is required')
    .matches(/^order_[A-Za-z0-9]+$/)
    .withMessage('Invalid Razorpay order ID format'),
    
  body('razorpay_payment_id')
    .isLength({ min: 1 })
    .withMessage('Razorpay payment ID is required')
    .matches(/^pay_[A-Za-z0-9]+$/)
    .withMessage('Invalid Razorpay payment ID format'),
    
  body('razorpay_signature')
    .isLength({ min: 1 })
    .withMessage('Razorpay signature is required')
    .isHexadecimal()
    .withMessage('Invalid signature format'),
    
  body('bookingId')
    .optional()
    .isMongoId()
    .withMessage('Invalid booking ID format'),
    
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn(`Payment verification validation failed for user ${req.user?.id}:`, errors.array());
      return res.status(400).json({
        status: 'error',
        message: 'Invalid payment verification data',
        errors: errors.array()
      });
    }
    next();
  }
];

// Security headers middleware for payment routes
const paymentSecurityHeaders = (req, res, next) => {
  // Prevent caching of payment responses
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  // Content Security Policy for payment pages
  res.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' https://checkout.razorpay.com; " +
    "style-src 'self' 'unsafe-inline'; " +
    "connect-src 'self' https://api.razorpay.com; " +
    "frame-src https://api.razorpay.com;"
  );
  
  // Prevent MIME type sniffing
  res.set('X-Content-Type-Options', 'nosniff');
  
  // Prevent XSS attacks
  res.set('X-XSS-Protection', '1; mode=block');
  
  // Prevent clickjacking
  res.set('X-Frame-Options', 'DENY');
  
  next();
};

// Request logging middleware for payment operations
const logPaymentRequest = (operation) => {
  return (req, res, next) => {
    const logData = {
      operation,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      requestId: crypto.randomBytes(8).toString('hex')
    };
    
    // Add operation-specific data
    if (operation === 'create') {
      logData.bookingId = req.body.bookingId;
      logData.amount = req.body.amount;
    } else if (operation === 'verify') {
      logData.orderId = req.body.razorpay_order_id;
      logData.paymentId = req.body.razorpay_payment_id;
    }
    
    logger.info(`Payment ${operation} request:`, logData);
    
    // Store request ID for correlation
    req.paymentRequestId = logData.requestId;
    
    next();
  };
};

// Anti-fraud detection middleware
const detectFraudulentActivity = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const ip = req.ip;
    
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }
    
    // Check for suspicious patterns (implement based on your fraud detection logic)
    const suspiciousPatterns = await checkSuspiciousActivity(userId, ip);
    
    if (suspiciousPatterns.length > 0) {
      logger.warn(`Suspicious payment activity detected for user ${userId}:`, suspiciousPatterns);
      
      // For high-risk activities, block the request
      if (suspiciousPatterns.some(pattern => pattern.severity === 'high')) {
        return res.status(403).json({
          status: 'error',
          message: 'Payment request blocked due to security concerns. Please contact support.'
        });
      }
      
      // For medium-risk activities, add additional verification step
      if (suspiciousPatterns.some(pattern => pattern.severity === 'medium')) {
        req.requireAdditionalVerification = true;
      }
    }
    
    next();
  } catch (error) {
    logger.error('Fraud detection error:', error);
    // Don't block the request on detection errors, but log them
    next();
  }
};

// Helper function to check for suspicious activity
async function checkSuspiciousActivity(userId, ip) {
  const suspiciousPatterns = [];
  
  // Check for multiple rapid payment attempts
  // Check for unusual payment amounts
  // Check for payments from new locations
  // Add more fraud detection logic as needed
  
  return suspiciousPatterns;
}

// Webhook verification middleware for Razorpay webhooks
const verifyWebhookSignature = (req, res, next) => {
  try {
    const signature = req.get('X-Razorpay-Signature');
    const body = JSON.stringify(req.body);
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!signature || !webhookSecret) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid webhook signature'
      });
    }
    
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      logger.error('Invalid webhook signature received');
      return res.status(400).json({
        status: 'error',
        message: 'Invalid webhook signature'
      });
    }
    
    next();
  } catch (error) {
    logger.error('Webhook verification error:', error);
    res.status(400).json({
      status: 'error',
      message: 'Webhook verification failed'
    });
  }
};

module.exports = {
  createPaymentLimit,
  verifyPaymentLimit,
  validatePaymentCreation,
  validatePaymentVerification,
  paymentSecurityHeaders,
  logPaymentRequest,
  detectFraudulentActivity,
  verifyWebhookSignature
};

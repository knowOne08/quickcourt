const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Generic rate limit handler
const createRateLimitHandler = (message) => (req, res) => {
  logger.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
  res.status(429).json({
    success: false,
    message: message || 'Too many requests, please try again later.',
    retryAfter: Math.round(req.rateLimit.resetTime / 1000) || 60
  });
};

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: createRateLimitHandler('Too many requests from this IP, please try again after 15 minutes.')
});

// Strict rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: createRateLimitHandler('Too many authentication attempts, please try again after 15 minutes.')
});

// Rate limit for password reset attempts
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again after 1 hour.'
  },
  handler: createRateLimitHandler('Too many password reset attempts, please try again after 1 hour.')
});

// Rate limit for email verification requests
const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 verification emails per hour
  message: {
    success: false,
    message: 'Too many verification email requests, please try again after 1 hour.'
  },
  handler: createRateLimitHandler('Too many verification email requests, please try again after 1 hour.')
});

// Rate limit for booking creation
const bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 booking attempts per minute
  message: {
    success: false,
    message: 'Too many booking attempts, please slow down.'
  },
  handler: createRateLimitHandler('Too many booking attempts, please slow down.')
});

// Rate limit for file uploads
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 uploads per hour
  message: {
    success: false,
    message: 'Too many file uploads, please try again after 1 hour.'
  },
  handler: createRateLimitHandler('Too many file uploads, please try again after 1 hour.')
});

// Rate limit for search requests
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 search requests per minute
  message: {
    success: false,
    message: 'Too many search requests, please slow down.'
  },
  handler: createRateLimitHandler('Too many search requests, please slow down.')
});

// Rate limit for reviews and ratings
const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 reviews per hour
  message: {
    success: false,
    message: 'Too many review submissions, please try again after 1 hour.'
  },
  handler: createRateLimitHandler('Too many review submissions, please try again after 1 hour.')
});

// Rate limit for contact/support requests
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 contact requests per hour
  message: {
    success: false,
    message: 'Too many contact requests, please try again after 1 hour.'
  },
  handler: createRateLimitHandler('Too many contact requests, please try again after 1 hour.')
});

// Aggressive rate limit for suspicious activity
const aggressiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 requests per hour
  message: {
    success: false,
    message: 'Access temporarily restricted due to suspicious activity.'
  },
  handler: createRateLimitHandler('Access temporarily restricted due to suspicious activity.')
});

// Dynamic rate limiter based on user type
const createUserBasedLimiter = (limits) => {
  return rateLimit({
    windowMs: limits.windowMs || 15 * 60 * 1000,
    max: (req) => {
      // Authenticated users get higher limits
      if (req.user) {
        switch (req.user.role) {
          case 'admin':
            return limits.admin || limits.default * 5;
          case 'facility_owner':
            return limits.owner || limits.default * 3;
          case 'user':
            return limits.user || limits.default * 2;
          default:
            return limits.default;
        }
      }
      // Anonymous users get base limit
      return limits.anonymous || limits.default;
    },
    keyGenerator: (req) => {
      // Use user ID for authenticated users, IP for anonymous
      return req.user ? `user:${req.user._id}` : `ip:${req.ip}`;
    },
    handler: createRateLimitHandler()
  });
};

// Rate limiter for API based on user authentication status
const smartApiLimiter = createUserBasedLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  default: 50,
  anonymous: 20,
  user: 100,
  owner: 200,
  admin: 500
});

module.exports = {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  bookingLimiter,
  uploadLimiter,
  searchLimiter,
  reviewLimiter,
  contactLimiter,
  aggressiveLimiter,
  smartApiLimiter,
  createUserBasedLimiter
};

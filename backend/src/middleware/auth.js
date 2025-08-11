const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is valid but user not found.'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account has been deactivated.'
        });
      }

      // Add user to request object
      req.user = user;
      next();

    } catch (tokenError) {
      logger.error('Token verification failed:', tokenError.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

// Authorization middleware - check user roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to access this resource.'
      });
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (tokenError) {
        // Token is invalid, but we continue without user
        logger.warn('Optional auth token invalid:', tokenError.message);
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next();
  }
};

// Resource ownership middleware - check if user owns the resource
const checkOwnership = (resourceModel, resourceField = 'user') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const resource = await resourceModel.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found.'
        });
      }

      // Admin can access all resources
      if (req.user.role === 'admin') {
        req.resource = resource;
        return next();
      }

      // Check ownership
      const ownerId = resource[resourceField].toString();
      if (ownerId !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own resources.'
        });
      }

      req.resource = resource;
      next();

    } catch (error) {
      logger.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during ownership verification.'
      });
    }
  };
};

// Venue owner middleware - check if user is owner of specific venue
const checkVenueOwnership = async (req, res, next) => {
  try {
    const venueId = req.params.venueId || req.params.id;
    const Venue = require('../models/Venue');
    
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found.'
      });
    }

    // Admin can access all venues
    if (req.user.role === 'admin') {
      req.venue = venue;
      return next();
    }

    // Check if user is the venue owner
    if (venue.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only manage your own venues.'
      });
    }

    req.venue = venue;
    next();

  } catch (error) {
    logger.error('Venue ownership check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during venue ownership verification.'
    });
  }
};

// Email verification check
const requireEmailVerification = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address to access this resource.',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }
  next();
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  checkOwnership,
  checkVenueOwnership,
  requireEmailVerification
};

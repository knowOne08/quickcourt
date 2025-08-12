const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const jwtService = require('../config/jwt');
const sessionManager = require('../utils/sessionManager');

// Protect middleware - checks if user is authenticated
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  const token = jwtService.extractTokenFromRequest(req);

  if (!token) {
    throw new AppError('You are not logged in! Please log in to get access.', 401);
  }

  // 2) Check if token is blacklisted
  if (sessionManager.isTokenBlacklisted(token)) {
    throw new AppError('Token has been invalidated. Please log in again.', 401);
  }

  try {
    // 3) Verify token
    const decoded = jwtService.verifyToken(token);

    // 4) Check if user still exists
    const currentUser = await User.findById(decoded.userId).select('+password');

    if (!currentUser) {
      throw new AppError('The user belonging to this token no longer exists.', 401);
    }

    // 5) Check if user is active
    if (!currentUser.isActive) {
      throw new AppError('Your account has been deactivated. Please contact support.', 401);
    }

    // 6) Check if user changed password after the token was issued
    if (currentUser.passwordChangedAt &&
      currentUser.changedPasswordAfter(decoded.iat)) {
      throw new AppError('User recently changed password! Please log in again.', 401);
    }

    // 7) Clean expired refresh tokens periodically
    currentUser.cleanExpiredTokens();
    if (currentUser.isModified()) {
      await currentUser.save({ validateBeforeSave: false });
    }

    // 8) Set user in request
    req.user = currentUser;
    req.token = token;
    next();
  } catch (error) {
    if (error.message === 'Token expired') {
      throw new AppError('Your token has expired. Please refresh your token or log in again.', 401);
    }
    if (error.message === 'Invalid token') {
      throw new AppError('Invalid token. Please log in again.', 401);
    }
    throw error;
  }
});

// Optional authentication - doesn't throw error if no token
exports.optionalAuth = catchAsync(async (req, res, next) => {
  const token = jwtService.extractTokenFromRequest(req);
  
  if (token) {
    try {
      const decoded = jwtService.verifyToken(token);
      const currentUser = await User.findById(decoded.userId);
      
      if (currentUser && currentUser.isActive) {
        req.user = currentUser;
        req.token = token;
      }
    } catch (error) {
      // Ignore errors for optional auth
    }
  }
  
  next();
});

// RestrictTo middleware - checks user roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array like ['admin', 'owner']
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'You are not logged in! Please log in to get access.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    }

    next();
  };
};

// Optional: Check if user owns the resource
exports.checkOwnership = (Model, resourceParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceParam];
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          status: 'error',
          message: 'Resource not found'
        });
      }

      // Check if user owns the resource or is admin
      if (resource.user && resource.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'You do not have permission to access this resource'
        });
      }

      // For venue owners
      if (resource.owner && resource.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'You do not have permission to access this resource'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
  };
};

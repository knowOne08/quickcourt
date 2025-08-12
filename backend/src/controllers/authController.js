const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');
const jwtService = require('../config/jwt');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const sessionManager = require('../utils/sessionManager');
// const sessionManager = require('../utils/sessionManager');

// Generate JWT Token (legacy function for compatibility)
const generateToken = (id) => {
  return jwt.sign({ userId: id }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: process.env.JWT_EXPIRE || '15m'
  });
};

// Get device info from request
const getDeviceInfo = (req) => {
  return {
    device: req.headers['user-agent']?.slice(0, 100) || 'unknown',
    ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown'
  };
};

// Send token response with both access and refresh tokens
const sendTokenResponse = async (user, statusCode, res, req) => {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
    name: user.name
  };

  // Generate access token
  const accessToken = jwtService.generateAccessToken(payload);
  
  // Generate and store refresh token
  const deviceInfo = getDeviceInfo(req);
  
  // Check for suspicious activity
  const suspiciousActivity = await sessionManager.detectSuspiciousActivity(user._id, deviceInfo);
  if (suspiciousActivity.suspicious) {
    logger.warn(`Suspicious activity detected for user ${user.email}: ${suspiciousActivity.reason}`);
    // You could implement additional security measures here
  }
  
  const refreshToken = user.generateRefreshToken(deviceInfo.device, deviceInfo.ipAddress);
  
  // Save user with new refresh token
  await user.save({ validateBeforeSave: false });

  // Cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  };

  // Set cookies
  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    expires: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  });
  
  res.cookie('refreshToken', refreshToken, cookieOptions);

  res.status(statusCode).json({
    success: true,
    tokens: {
      accessToken,
      refreshToken,
      expiresIn: '15m'
    },
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      avatar: user.avatar,
      lastLogin: user.lastLogin
    },
    security: {
      suspiciousActivity: suspiciousActivity.suspicious ? {
        detected: true,
        reason: suspiciousActivity.reason
      } : { detected: false }
    }
  });
};

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
const signup = catchAsync(async (req, res) => {
  const { fullName, email, password, role, phoneNumber } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError('User already exists with this email', 400);
  }

  // Generate 6-digit verification code
  const emailVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const emailVerificationExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Create user
  const user = await User.create({
    name: fullName.trim(),
    email: email.toLowerCase().trim(),
    password: password,
    role: role || 'user',
    phoneNumber,
    emailVerificationCode: emailVerificationCode,
    emailVerificationExpire: emailVerificationExpire,
    isEmailVerified: false
  });

  console.log("User Created: " + user);
  
  // Send verification email with code
  try {
    await emailService.sendVerificationEmail(user.email, emailVerificationCode);
    logger.info(`Verification code sent to ${user.email}`);
  } catch (emailError) {
    logger.error(`Failed to send verification email: ${emailError.message}`);
  }

  // Return success response
  res.status(201).json({
    success: true,
    message: 'User registered successfully. Please check your email for the verification code.',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  // Check for user (include password for comparison)
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check if password matches
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check if account is active
  if (!user.isActive) {
    throw new AppError('Account has been deactivated. Please contact support.', 401);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  logger.info(`User logged in: ${user.email}`);
  await sendTokenResponse(user, 200, res, req);
});

// @desc    Verify email with code
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = catchAsync(async (req, res) => {
  const { code } = req.body;

  if (!code) {
    throw new AppError('Please provide verification code', 400);
  }

  // Find user with valid code
  const user = await User.findOne({
    emailVerificationCode: code,
    emailVerificationExpire: { $gt: Date.now() }
  });

  if (!user) {
    throw new AppError('Invalid or expired verification code', 400);
  }

  // Update user
  user.isEmailVerified = true;
  user.emailVerificationCode = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });

  logger.info(`Email verified for user: ${user.email}`);
  await sendTokenResponse(user, 200, res, req);
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = catchAsync(async (req, res) => {
  let refreshToken = req.body.refreshToken || req.cookies.refreshToken;

  if (!refreshToken) {
    throw new AppError('Refresh token not provided', 401);
  }

  try {
    // Verify refresh token
    const decoded = jwtService.verifyToken(refreshToken);
    
    if (decoded.type !== 'refresh') {
      throw new AppError('Invalid refresh token', 401);
    }

    // Find user
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401);
    }

    // Validate refresh token in database
    if (!user.validateRefreshToken(refreshToken)) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    // Generate new access token
    const payload = {
      userId: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    const newAccessToken = jwtService.generateAccessToken(payload);

    // Set new access token in cookie
    res.cookie('accessToken', newAccessToken, {
      expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
    });

    res.json({
      success: true,
      accessToken: newAccessToken,
      expiresIn: '15m'
    });

  } catch (error) {
    throw new AppError('Invalid or expired refresh token', 401);
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = catchAsync(async (req, res) => {
  const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
  const accessToken = req.token;
  
  if (refreshToken && req.user) {
    // Remove specific refresh token
    req.user.removeRefreshToken(refreshToken);
    await req.user.save({ validateBeforeSave: false });
  }

  // Blacklist the current access token
  if (accessToken) {
    sessionManager.blacklistToken(accessToken);
  }

  // Clear cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  logger.info(`User logged out: ${req.user.email}`);

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Logout from all devices
// @route   POST /api/auth/logout-all
// @access  Private
const logoutAll = catchAsync(async (req, res) => {
  const accessToken = req.token;
  
  // Remove all refresh tokens
  req.user.removeAllRefreshTokens();
  await req.user.save({ validateBeforeSave: false });

  // Blacklist the current access token
  if (accessToken) {
    sessionManager.blacklistToken(accessToken);
  }

  // Clear cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  logger.info(`User logged out from all devices: ${req.user.email}`);

  res.json({
    success: true,
    message: 'Logged out from all devices successfully'
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id);
  const sessions = await sessionManager.getUserSessions(user._id);

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      avatar: user.avatar,
      phoneNumber: user.phoneNumber,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    },
    sessions: {
      active: sessions ? sessions.length : 0,
      list: sessions || []
    }
  });
});

// @desc    Get user sessions
// @route   GET /api/auth/sessions
// @access  Private
const getSessions = catchAsync(async (req, res) => {
  const sessions = await sessionManager.getUserSessions(req.user._id);
  
  res.json({
    success: true,
    sessions: sessions || []
  });
});

// @desc    Terminate specific session
// @route   DELETE /api/auth/sessions/:sessionId
// @access  Private
const terminateSession = catchAsync(async (req, res) => {
  const { sessionId } = req.params;
  const success = await sessionManager.terminateSession(req.user._id, sessionId);
  
  if (success) {
    res.json({
      success: true,
      message: 'Session terminated successfully'
    });
  } else {
    throw new AppError('Session not found or could not be terminated', 404);
  }
});

// @desc    Terminate other sessions
// @route   POST /api/auth/terminate-others
// @access  Private
const terminateOtherSessions = catchAsync(async (req, res) => {
  const currentRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  const success = await sessionManager.terminateOtherSessions(req.user._id, currentRefreshToken);
  
  if (success) {
    logger.info(`Other sessions terminated for user: ${req.user.email}`);
    res.json({
      success: true,
      message: 'Other sessions terminated successfully'
    });
  } else {
    throw new AppError('Could not terminate other sessions', 500);
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError('Please provide email address', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    throw new AppError('User not found with that email', 404);
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and set to resetPasswordToken field
  user.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expire
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save({ validateBeforeSave: false });

  try {
    await emailService.sendPasswordResetEmail(user.email, resetToken);
    
    res.json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    console.log(error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    throw new AppError('Email could not be sent', 500);
  }
});

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Public
const resetPassword = catchAsync(async (req, res) => {
  // Get hashed token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  // Set new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.passwordChangedAt = new Date();
  
  // Remove all refresh tokens (logout from all devices)
  user.removeAllRefreshTokens();

  await user.save();

  logger.info(`Password reset for user: ${user.email}`);
  await sendTokenResponse(user, 200, res, req);
});

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
const updatePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Please provide current and new password', 400);
  }

  // Get user from database with password
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Update password
  user.password = newPassword;
  user.passwordChangedAt = new Date();
  
  // Remove all refresh tokens except current one
  const currentRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
  user.refreshTokens = user.refreshTokens.filter(rt => rt.token === currentRefreshToken);

  await user.save();

  logger.info(`Password updated for user: ${user.email}`);
  await sendTokenResponse(user, 200, res, req);
});

module.exports = {
  signup,
  login,
  verifyEmail,
  refreshToken,
  logout,
  logoutAll,
  getMe,
  getSessions,
  terminateSession,
  terminateOtherSessions,
  forgotPassword,
  resetPassword,
  updatePassword
};
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const emailService = require('../services/emailService');
const logger = require('../utils/logger');

// Generate JWT Token
const generateToken = (id) => {
  // Use userId in payload to match middleware expectations
  return jwt.sign({ userId: id }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const options = {
    expires: new Date(
      Date.now() + (process.env.JWT_COOKIE_EXPIRE || 30) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        avatar: user.avatar
      }
    });
};

// @desc    Register user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const { fullName, email, password, role, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
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
      emailVerificationCode: emailVerificationCode, // Changed from emailVerificationToken
      emailVerificationExpire: emailVerificationExpire,
      isEmailVerified: false
    });

    console.log("User Created: " + user)
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

  } catch (error) {
    logger.error(`Signup error: ${error.message}`);

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        error: `User with this ${field} already exists`
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error during registration. Please try again.'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if password matches
    console.log(password)
    const isMatch = await user.comparePassword(password);
    // const isMatch = await bcrypt.compare(password, user.password);
    console.log(isMatch)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account has been deactivated. Please contact support.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    logger.info(`User logged in: ${user.email}`);
    sendTokenResponse(user, 200, res);

  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
};

// @desc    Verify email with code
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { code } = req.body; // Changed from token to code

    // Find user with valid code
    const user = await User.findOne({
      emailVerificationCode: code, // Changed from emailVerificationToken
      emailVerificationExpire: { $gt: Date.now() }
    });

    console.log(user)

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification code'
      });
    }

    // Update user
    user.isEmailVerified = true;
    user.emailVerificationCode = undefined; // Changed from emailVerificationToken
    user.emailVerificationExpire = undefined;
    await user.save();

    logger.info(`Email verified for user: ${user.email}`);

    sendTokenResponse(user, 200, res);

  } catch (error) {
    logger.error(`Email verification error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error during email verification'
    });
  }
};

module.exports = {
  signup,
  login,
  verifyEmail
};
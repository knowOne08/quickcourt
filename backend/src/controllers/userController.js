const User = require('../models/User');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Venue = require('../models/Venue');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    // Make sure we have a user in the request
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Return only necessary user data
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber || '',
        avatar: user.avatar || '',
        isEmailVerified: user.isEmailVerified
      }
    });
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    logger.error(error.stack);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
};

// @desc    Get public user profile
// @route   GET /api/users/profile/public/:userId
// @access  Public
const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('name avatar createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's public stats
    const reviewCount = await Review.countDocuments({ user: user._id });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        avatar: user.avatar,
        memberSince: user.createdAt,
        reviewCount
      }
    });
  } catch (error) {
    logger.error(`Get public profile error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PATCH /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phoneNumber, dateOfBirth, gender, avatar } = req.body;

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (phoneNumber) updateFields.phoneNumber = phoneNumber;
    if (dateOfBirth) updateFields.dateOfBirth = dateOfBirth;
    if (gender) updateFields.gender = gender;
    if (avatar) updateFields.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateFields,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    logger.info(`Profile updated for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Change user password
// @route   PATCH /api/users/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Old password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Old password is incorrect'
      });
    }

    // Set new password (pre-save middleware will hash it automatically)
    user.password = newPassword;
    
    // Set passwordChangedAt to current time
    user.passwordChangedAt = Date.now();
    
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please log in again with your new password.'
    });
  } catch (error) {
    logger.error(`Change password error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required to delete account'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Invalid password'
      });
    }

    // Instead of deleting, deactivate the account
    user.isActive = false;
    user.email = `deleted_${Date.now()}_${user.email}`;
    await user.save();

    logger.info(`Account deactivated for user: ${req.user._id}`);

    res.status(200).json({
      success: true,
      message: 'Account has been deactivated successfully'
    });
  } catch (error) {
    logger.error(`Delete account error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get user booking history
// @route   GET /api/users/bookings
// @access  Private
const getBookingHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const query = { user: req.user._id };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('venue', 'name address city images category')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error(`Get booking history error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get booking details
// @route   GET /api/users/bookings/:bookingId
// @access  Private
const getBookingDetails = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      user: req.user._id
    }).populate('venue', 'name address city images category pricePerHour');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    logger.error(`Get booking details error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get user's favorite venues
// @route   GET /api/users/favorites
// @access  Private
const getFavoriteVenues = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favoriteVenues', 'name address city images category pricePerHour rating');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      favorites: user.favoriteVenues || []
    });
  } catch (error) {
    logger.error(`Get favorite venues error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Add venue to favorites
// @route   POST /api/users/favorites/:venueId
// @access  Private
const addFavoriteVenue = async (req, res) => {
  try {
    const { venueId } = req.params;

    // Check if venue exists
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({
        success: false,
        error: 'Venue not found'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user.favoriteVenues) {
      user.favoriteVenues = [];
    }

    // Check if already in favorites
    if (user.favoriteVenues.includes(venueId)) {
      return res.status(400).json({
        success: false,
        error: 'Venue already in favorites'
      });
    }

    user.favoriteVenues.push(venueId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Venue added to favorites',
      venueId
    });
  } catch (error) {
    logger.error(`Add favorite venue error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Remove venue from favorites
// @route   DELETE /api/users/favorites/:venueId
// @access  Private
const removeFavoriteVenue = async (req, res) => {
  try {
    const { venueId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user.favoriteVenues || !user.favoriteVenues.includes(venueId)) {
      return res.status(400).json({
        success: false,
        error: 'Venue not in favorites'
      });
    }

    user.favoriteVenues = user.favoriteVenues.filter(id => id.toString() !== venueId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Venue removed from favorites',
      venueId
    });
  } catch (error) {
    logger.error(`Remove favorite venue error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get user reviews
// @route   GET /api/users/reviews
// @access  Private
const getUserReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await Review.find({ user: req.user._id })
      .populate('venue', 'name address city images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ user: req.user._id });

    res.status(200).json({
      success: true,
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error(`Get user reviews error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Create review
// @route   POST /api/users/reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const { venueId, rating, comment } = req.body;

    // Check if venue exists
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({
        success: false,
        error: 'Venue not found'
      });
    }

    // Check if user has already reviewed this venue
    const existingReview = await Review.findOne({ user: req.user._id, venue: venueId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'You have already reviewed this venue'
      });
    }

    const review = await Review.create({
      user: req.user._id,
      venue: venueId,
      rating,
      comment
    });

    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name avatar')
      .populate('venue', 'name');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review: populatedReview
    });
  } catch (error) {
    logger.error(`Create review error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Update review
// @route   PATCH /api/users/reviews/:reviewId
// @access  Private
const updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const review = await Review.findOne({
      _id: req.params.reviewId,
      user: req.user._id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    if (rating) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    await review.save();

    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name avatar')
      .populate('venue', 'name');

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review: populatedReview
    });
  } catch (error) {
    logger.error(`Update review error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Delete review
// @route   DELETE /api/users/reviews/:reviewId
// @access  Private
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({
      _id: req.params.reviewId,
      user: req.user._id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        error: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete review error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get user preferences
// @route   GET /api/users/preferences
// @access  Private
const getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('preferences');

    const defaultPreferences = {
      notifications: {
        email: true,
        sms: false,
        push: true,
        bookingReminders: true,
        promotions: false
      },
      privacy: {
        showProfile: true,
        showBookingHistory: false
      },
      language: 'en',
      timezone: 'Asia/Kolkata'
    };

    res.status(200).json({
      success: true,
      preferences: user.preferences || defaultPreferences
    });
  } catch (error) {
    logger.error(`Get preferences error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Update user preferences
// @route   PATCH /api/users/preferences
// @access  Private
const updatePreferences = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { preferences: req.body },
      { new: true, runValidators: true }
    ).select('preferences');

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    logger.error(`Update preferences error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get user notifications
// @route   GET /api/users/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    // For now, return mock notifications
    // In a real app, you'd have a Notification model
    const mockNotifications = [
      {
        _id: '1',
        type: 'booking_confirmed',
        title: 'Booking Confirmed',
        message: 'Your booking at SRK Badminton Academy has been confirmed',
        isRead: false,
        createdAt: new Date()
      },
      {
        _id: '2',
        type: 'booking_reminder',
        title: 'Booking Reminder',
        message: 'You have a booking tomorrow at 2:00 PM',
        isRead: true,
        createdAt: new Date(Date.now() - 86400000)
      }
    ];

    res.status(200).json({
      success: true,
      notifications: mockNotifications
    });
  } catch (error) {
    logger.error(`Get notifications error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/users/notifications/:notificationId/read
// @access  Private
const markNotificationRead = async (req, res) => {
  try {
    // In a real app, you'd update the notification in the database
    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    logger.error(`Mark notification read error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get user payment methods
// @route   GET /api/users/payment-methods
// @access  Private
const getPaymentMethods = async (req, res) => {
  try {
    // For now, return mock payment methods
    // In a real app, you'd have a PaymentMethod model
    const mockPaymentMethods = [
      {
        _id: '1',
        type: 'card',
        last4: '4242',
        brand: 'Visa',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true
      }
    ];

    res.status(200).json({
      success: true,
      paymentMethods: mockPaymentMethods
    });
  } catch (error) {
    logger.error(`Get payment methods error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Add payment method
// @route   POST /api/users/payment-methods
// @access  Private
const addPaymentMethod = async (req, res) => {
  try {
    // In a real app, you'd integrate with a payment processor
    res.status(201).json({
      success: true,
      message: 'Payment method added successfully'
    });
  } catch (error) {
    logger.error(`Add payment method error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Remove payment method
// @route   DELETE /api/users/payment-methods/:methodId
// @access  Private
const removePaymentMethod = async (req, res) => {
  try {
    // In a real app, you'd remove the payment method from the database
    res.status(200).json({
      success: true,
      message: 'Payment method removed successfully'
    });
  } catch (error) {
    logger.error(`Remove payment method error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private
const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const [
      totalBookings,
      completedBookings,
      totalReviews,
      favoriteVenuesCount
    ] = await Promise.all([
      Booking.countDocuments({ user: userId }),
      Booking.countDocuments({ user: userId, status: 'completed' }),
      Review.countDocuments({ user: userId }),
      User.findById(userId).then(user => user.favoriteVenues?.length || 0)
    ]);

    // Calculate total spent (you'll need to implement this based on your booking model)
    const bookingsWithAmount = await Booking.find({ user: userId, status: 'completed' }).select('totalAmount');
    const totalSpent = bookingsWithAmount.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

    const stats = {
      totalBookings,
      completedBookings,
      cancelledBookings: await Booking.countDocuments({ user: userId, status: 'cancelled' }),
      totalSpent,
      totalReviews,
      favoriteVenuesCount,
      memberSince: req.user.createdAt,
      lastBooking: await Booking.findOne({ user: userId }).sort({ createdAt: -1 }).select('createdAt')
    };

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error(`Get user stats error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

module.exports = {
  getProfile,
  getPublicProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getBookingHistory,
  getBookingDetails,
  getFavoriteVenues,
  addFavoriteVenue,
  removeFavoriteVenue,
  getUserReviews,
  createReview,
  updateReview,
  deleteReview,
  getPreferences,
  updatePreferences,
  getNotifications,
  markNotificationRead,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  getUserStats
};
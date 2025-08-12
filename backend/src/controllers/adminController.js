const User = require('../models/User');
const Venue = require('../models/Venue');
const Court = require('../models/Court');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Review = require('../models/Review');

// User management
exports.getAllUsers = async (req, res) => {
  try {
    const { role, status, page = 1, limit = 10, search } = req.query;

    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        users,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { 
        status,
        statusReason: reason,
        statusUpdatedAt: new Date(),
        statusUpdatedBy: req.user.id
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const owners = await User.countDocuments({ role: 'owner' });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $limit: 12
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        activeUsers,
        owners,
        newUsersThisMonth,
        userGrowth
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Owner management
exports.getAllOwners = async (req, res) => {
  try {
    const { status, verified, page = 1, limit = 10 } = req.query;

    const query = { role: 'owner' };
    if (status) query.status = status;
    if (verified !== undefined) query['ownerProfile.isVerified'] = verified === 'true';

    const owners = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        owners,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getOwnerById = async (req, res) => {
  try {
    const { id } = req.params;
    const owner = await User.findOne({ _id: id, role: 'owner' }).select('-password');

    if (!owner) {
      return res.status(404).json({
        status: 'error',
        message: 'Owner not found'
      });
    }

    // Get owner's venues
    const venues = await Venue.find({ owner: id });

    res.status(200).json({
      status: 'success',
      data: {
        owner,
        venues
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.verifyOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const { verified, reason } = req.body;

    const owner = await User.findOneAndUpdate(
      { _id: id, role: 'owner' },
      {
        'ownerProfile.isVerified': verified,
        'ownerProfile.verificationReason': reason,
        'ownerProfile.verifiedAt': verified ? new Date() : null,
        'ownerProfile.verifiedBy': verified ? req.user.id : null
      },
      { new: true }
    ).select('-password');

    if (!owner) {
      return res.status(404).json({
        status: 'error',
        message: 'Owner not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { owner }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.updateOwnerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const owner = await User.findOneAndUpdate(
      { _id: id, role: 'owner' },
      {
        status,
        statusReason: reason,
        statusUpdatedAt: new Date(),
        statusUpdatedBy: req.user.id
      },
      { new: true }
    ).select('-password');

    if (!owner) {
      return res.status(404).json({
        status: 'error',
        message: 'Owner not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { owner }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Venue management
exports.getAllVenues = async (req, res) => {
  try {
    const { status, approved, city, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (approved !== undefined) query.isApproved = approved === 'true';
    if (city) query['location.city'] = { $regex: city, $options: 'i' };

    const venues = await Venue.find(query)
      .populate('owner', 'name email ownerProfile')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Venue.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        venues,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getVenueById = async (req, res) => {
  try {
    const { id } = req.params;
    const venue = await Venue.findById(id)
      .populate('owner', 'name email ownerProfile')
      .populate('courts');

    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { venue }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.approveVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const venue = await Venue.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: req.user.id,
        rejectionReason: undefined // Clear any previous rejection reason
      },
      { new: true }
    ).populate('owner', 'name email');

    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Venue approved successfully',
      data: { venue }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.rejectVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Rejection reason is required'
      });
    }

    const venue = await Venue.findByIdAndUpdate(
      id,
      {
        status: 'rejected',
        rejectionReason: reason,
        approvedAt: undefined,
        approvedBy: undefined
      },
      { new: true }
    ).populate('owner', 'name email');

    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Venue rejected successfully',
      data: { venue }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.updateVenueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const venue = await Venue.findByIdAndUpdate(
      id,
      {
        status,
        statusReason: reason,
        statusUpdatedAt: new Date(),
        statusUpdatedBy: req.user.id
      },
      { new: true }
    );

    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { venue }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.deleteVenue = async (req, res) => {
  try {
    const { id } = req.params;
    
    const venue = await Venue.findByIdAndDelete(id);
    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Booking management
exports.getAllBookings = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email')
      .populate('venue', 'name location')
      .populate('court', 'name sport')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        bookings,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate('user', 'name email phone')
      .populate('venue', 'name location')
      .populate('court', 'name sport');

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { booking }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      id,
      {
        status,
        adminReason: reason,
        adminUpdatedAt: new Date(),
        adminUpdatedBy: req.user.id
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { booking }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getBookingStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments();
    const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });

    const bookingTrends = await Booking.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $limit: 12
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        completedBookings,
        bookingTrends
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Payment management
exports.getAllPayments = async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const payments = await Payment.find(query)
      .populate('user', 'name email')
      .populate('booking', 'venue court date')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        payments,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id)
      .populate('user', 'name email')
      .populate('booking');

    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { payment }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }

    // Process refund logic here (integrate with payment gateway)
    payment.refund = {
      amount,
      reason,
      status: 'processed',
      processedAt: new Date(),
      processedBy: req.user.id
    };

    await payment.save();

    res.status(200).json({
      status: 'success',
      data: { payment }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getPaymentStats = async (req, res) => {
  try {
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Dashboard analytics
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalVenues = await Venue.countDocuments();
    const totalBookings = await Booking.countDocuments();
    
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const recentBookings = await Booking.find()
      .populate('user', 'name')
      .populate('venue', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        totalVenues,
        totalBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        recentBookings
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Additional analytics methods
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const revenueData = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalRevenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: { revenueData }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getUserAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          newUsers: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: { 
        userGrowth,
        usersByRole
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getVenueAnalytics = async (req, res) => {
  try {
    const venuesByStatus = await Venue.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const venuesBySport = await Venue.aggregate([
      {
        $unwind: '$sports'
      },
      {
        $group: {
          _id: '$sports',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const topVenues = await Venue.aggregate([
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'venue',
          as: 'bookings'
        }
      },
      {
        $addFields: {
          bookingCount: { $size: '$bookings' }
        }
      },
      {
        $sort: { bookingCount: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          name: 1,
          location: 1,
          bookingCount: 1
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        venuesByStatus,
        venuesBySport,
        topVenues
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getBookingAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    const bookingTrends = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          bookingCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    const bookingsByStatus = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const peakHours = await Booking.aggregate([
      {
        $project: {
          hour: { $hour: { $dateFromString: { dateString: '$startTime' } } }
        }
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        bookingTrends,
        bookingsByStatus,
        peakHours
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Platform settings
exports.getPlatformSettings = async (req, res) => {
  // Implementation for getting platform settings
};

exports.updatePlatformSettings = async (req, res) => {
  // Implementation for updating platform settings
};

// Support tickets
exports.getAllSupportTickets = async (req, res) => {
  // Implementation for getting support tickets
};

exports.getSupportTicketById = async (req, res) => {
  // Implementation for getting support ticket by ID
};

exports.updateSupportTicket = async (req, res) => {
  // Implementation for updating support ticket
};

// Content management
exports.getAllBanners = async (req, res) => {
  // Implementation for getting banners
};

exports.createBanner = async (req, res) => {
  // Implementation for creating banner
};

exports.updateBanner = async (req, res) => {
  // Implementation for updating banner
};

exports.deleteBanner = async (req, res) => {
  // Implementation for deleting banner
};

// System monitoring
exports.getSystemHealth = async (req, res) => {
  try {
    const systemHealth = {
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'connected' // You can add actual DB health check here
    };

    res.status(200).json({
      status: 'success',
      data: systemHealth
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getSystemLogs = async (req, res) => {
  // Implementation for getting system logs
};

// Review management
exports.getAllReviews = async (req, res) => {
  // Implementation for getting all reviews
};

exports.getReviewById = async (req, res) => {
  // Implementation for getting review by ID
};

exports.moderateReview = async (req, res) => {
  // Implementation for moderating reviews
};

exports.deleteReview = async (req, res) => {
  // Implementation for deleting reviews
};
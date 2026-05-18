// backend/src/controllers/bookingController.js
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Venue = require('../models/Venue');
const Court = require('../models/Court');
const bookingService = require('../services/bookingService');
const { createNotification } = require('../utils/notificationHelper');
const { COMMISSION_RATE } = require('../utils/constants');

exports.createBooking = async (req, res) => {
  try {
    const { venue, court, date, startTime, endTime, duration, paymentMethod } = req.body;
    const userId = req.user._id || req.user.id;

    // Validate booking data
    const venueData = await Venue.findById(venue);
    if (!venueData) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }

    const courtData = await Court.findById(court);
    if (!courtData) {
      return res.status(404).json({
        status: 'error',
        message: 'Court not found'
      });
    }

    // Check if slot is available
    const isAvailable = await bookingService.isSlotAvailable(
      court, date, startTime, endTime
    );

    if (!isAvailable) {
      return res.status(400).json({
        status: 'error',
        message: 'Selected time slot is not available'
      });
    }

    // Calculate total amount
    const hours = duration / 60;
    const totalAmount = courtData.pricePerHour * hours;

    // Calculate revenue split
    const adminRevenue = totalAmount * COMMISSION_RATE;
    const ownerRevenue = totalAmount - adminRevenue;

    // Handle Team Collaboration / Matchmaking logic
    const { playerMode, matchMode, teamSize } = req.body;

    const bookingStatus = paymentMethod === 'cash' ? 'confirmed' : 'pending';

    // Create booking
    const booking = await Booking.create({
      user: userId,
      venue,
      court,
      date: new Date(new Date(date).toISOString().split('T')[0] + 'T00:00:00.000Z'),
      startTime,
      endTime,
      duration,
      totalAmount,
      adminRevenue,
      ownerRevenue,
      paymentMethod: paymentMethod || 'online',
      status: bookingStatus,
      playerMode,
      matchMode,
      teamSize
    });

    // Only create team if booking is confirmed (e.g. cash payment)
    // For online payments, the team will be created in verifyPayment after successful transaction
    if (bookingStatus === 'confirmed' && matchMode && (matchMode === 'public' || matchMode === 'looking')) {
      const Team = require('../models/Team');
      const team = await Team.create({
        name: `${req.user.name}'s ${courtData.sport} Team`,
        sport: courtData.sport,
        captain: userId,
        members: [userId],
        maxPlayers: teamSize || 10,
        venue,
        booking: booking._id,
        date: new Date(date),
        startTime,
        endTime,
        status: 'open'
      });

      booking.team = team._id;
      await booking.save();
    }

    // Update venue stats
    if (bookingStatus === 'confirmed') {
      await Venue.findByIdAndUpdate(venue, {
        $inc: {
          'stats.totalBookings': 1,
          'stats.totalRevenue': totalAmount
        }
      });
    }

    await booking.populate(['venue', 'court', 'user', 'team']);

    // Send confirmation email
    const emailService = require('../services/emailService');
    emailService.sendBookingConfirmationEmail(req.user.email, {
      venueName: venueData.name,
      startTime,
      endTime,
      totalAmount
    }).catch(e => {
      console.error(`Could not send booking confirmation email to ${req.user.email}: ${e.message}`);
    });

    // Notify Owner
    if (bookingStatus === 'confirmed') {
      try {
        await createNotification({
          recipient: venueData.owner,
          sender: userId,
          type: 'BOOKING_CONFIRMED',
          title: 'New Booking Confirmed',
          message: `${req.user.name} has booked ${courtData.name} at ${venueData.name} for ${startTime} on ${date}.`,
          data: { bookingId: booking._id, venueId: venueData._id }
        });
      } catch (notifyError) {
        console.error('Failed to notify owner:', notifyError);
      }
    }

    res.status(201).json({
      status: 'success',
      data: {
        booking
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    // ✅ FIX: Check if user exists
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated'
      });
    }

    const userId = req.user._id || req.user.id;  // ✅ FIXED: Same as createBooking
    
    console.log('🔍 [DEBUG] Fetching bookings for User:', req.user.email);
    console.log('🔍 [DEBUG] User ID:', userId);
    console.log('🔍 [DEBUG] User ID type:', typeof userId);

    const query = { user: new mongoose.Types.ObjectId(userId) };
    const { status, page = 1, limit = 10 } = req.query;
    if (status) query.status = status;

    console.log('🔍 [DEBUG] Query:', JSON.stringify(query));

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skipNum = (pageNum - 1) * limitNum;

     const bookings = await Booking.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $skip: skipNum },
      { $limit: limitNum },
      {
        $lookup: {
          from: 'venues',
          localField: 'venue',
          foreignField: '_id',
          as: 'venue'
        }
      },
      {
        $lookup: {
          from: 'courts',
          localField: 'court',
          foreignField: '_id',
          as: 'court'
        }
      },
      {
        $lookup: {
          from: 'teams',
          localField: 'team',
          foreignField: '_id',
          as: 'team'
        }
      },
      {
        $unwind: {
          path: '$venue',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: '$court',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $unwind: {
          path: '$team',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          // Booking fields
          user: 1,
          date: 1,
          startTime: 1,
          endTime: 1,
          duration: 1,
          totalAmount: 1,
          paymentMethod: 1,
          status: 1,
          playerMode: 1,
          matchMode: 1,
          teamSize: 1,
          createdAt: 1,
          updatedAt: 1,
          // Venue fields (only what we need)
          'venue._id': 1,
          'venue.name': 1,
          'venue.location': 1,
          'venue.images': 1,
          // Court fields
          'court._id': 1,
          'court.name': 1,
          'court.sport': 1,
          // Team fields
          'team._id': 1,
          'team.name': 1,
          'team.members': 1,
          'team.status': 1
        }
      }
    ]);


    console.log(`📅 [DEBUG] Found ${bookings.length} bookings`);
    if (bookings.length > 0) {
      console.log('📝 [DEBUG] Sample booking user ID:', bookings[0].user);
      console.log('📝 [DEBUG] Logged in user ID:', userId);
    }

    const total = await Booking.countDocuments(query);
    console.log(`📊 Total bookings count for user ${userId}: ${total}`);

    res.status(200).json({
      status: 'success',
      data: {
        bookings,
        totalPages: Math.ceil(total / limitNum) || 0,
        currentPage: pageNum
      }
    });

  } catch (error) {
    console.error('❌ [ERROR] getUserBookings:', error);
    res.status(400).json({
      status: 'error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
exports.getAvailableSlots = async (req, res) => {
  try {
    const { courtId, date } = req.params;
    const { duration } = req.query; // Get duration from query params

    // Parse duration, default to 60 minutes if not provided
    const slotDuration = duration ? parseInt(duration) : 60;

    const availableSlots = await bookingService.getAvailableSlots(courtId, date, slotDuration);

    res.status(200).json({
      status: 'success',
      data: availableSlots
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id || req.user._id;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to cancel this booking'
      });
    }

    // Check if booking can be cancelled (not in the past)
    const bookingDateTime = new Date(`${booking.date.toISOString().split('T')[0]}T${booking.startTime}`);
    if (bookingDateTime <= new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot cancel past bookings'
      });
    }

    booking.status = 'cancelled';
    booking.cancellationReason = reason;
    booking.cancelledAt = new Date();
    booking.cancelledBy = userId;
    await booking.save();

    res.status(200).json({
      status: 'success',
      data: {
        booking
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
    const userId = req.user.id || req.user._id;

    const booking = await Booking.findById(id)
      .populate('venue', 'name location images address phone')
      .populate('court', 'name sport pricePerHour')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking or is venue owner
    const venue = await Venue.findById(booking.venue._id);
    if (booking.user._id.toString() !== userId && venue.owner.toString() !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this booking'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        booking
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id || req.user._id;

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking
    if (booking.user.toString() !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to review this booking'
      });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({
        status: 'error',
        message: 'Can only review completed bookings'
      });
    }

    // Check if already reviewed
    if (booking.review) {
      return res.status(400).json({
        status: 'error',
        message: 'Booking already reviewed'
      });
    }

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: 'error',
        message: 'Rating must be between 1 and 5'
      });
    }

    const Review = require('../models/Review');
    const review = await Review.create({
      user: userId,
      venue: booking.venue,
      booking: booking._id,
      rating: { overall: rating },
      title: 'Review from Booking',
      comment: comment || ''
    });

    booking.review = review._id;
    await booking.save();

    res.status(200).json({
      status: 'success',
      data: {
        booking
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getVenueBookings = async (req, res) => {
  try {
    const { venueId } = req.params;
    const { status, date, page = 1, limit = 10 } = req.query;
    const userId = req.user.id || req.user._id;

    // Check if user owns this venue
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }

    if (venue.owner.toString() !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view venue bookings'
      });
    }

    const query = { venue: venueId };
    if (status) query.status = status;
    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = {
        $gte: searchDate,
        $lt: nextDay
      };
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('court', 'name sport')
      .sort({ date: -1, startTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        bookings,
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
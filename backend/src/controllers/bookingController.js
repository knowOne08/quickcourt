// backend/src/controllers/bookingController.js
const Booking = require('../models/Booking');
const Venue = require('../models/Venue');
const Court = require('../models/Court');
const bookingService = require('../services/bookingService');

exports.createBooking = async (req, res) => {
  try {
    const { venue, court, date, startTime, endTime, duration } = req.body;
    const userId = req.user.id;

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

    // Create booking
    const booking = await Booking.create({
      user: userId,
      venue,
      court,
      date: new Date(date),
      startTime,
      endTime,
      duration,
      totalAmount,
      status: 'pending'
    });

    await booking.populate(['venue', 'court', 'user']);

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
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { user: userId };
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('venue', 'name location images')
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

exports.getAvailableSlots = async (req, res) => {
  try {
    const { courtId, date } = req.params;
    
    const availableSlots = await bookingService.getAvailableSlots(courtId, date);
    
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
    const userId = req.user.id;

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
    const userId = req.user.id;

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
    const userId = req.user.id;

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

    booking.review = {
      rating,
      comment: comment || '',
      createdAt: new Date()
    };

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
    const userId = req.user.id;

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
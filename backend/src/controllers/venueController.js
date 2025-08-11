const Venue = require('../models/Venue');
const Court = require('../models/Court');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const User = require('../models/User');

// @desc    Get all venues with filters
// @route   GET /api/venues
// @access  Public
exports.getAllVenues = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      city,
      sport,
      minPrice,
      maxPrice,
      rating,
      amenities,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = { status: 'active', isApproved: true };

    // Location filter
    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }

    // Sport filter
    if (sport) {
      query.sports = { $in: [sport] };
    }

    // Price filter
    if (minPrice || maxPrice) {
      query.priceRange = {};
      if (minPrice) query.priceRange.$gte = Number(minPrice);
      if (maxPrice) query.priceRange.$lte = Number(maxPrice);
    }

    // Rating filter
    if (rating) {
      query.averageRating = { $gte: Number(rating) };
    }

    // Amenities filter
    if (amenities) {
      const amenitiesArray = amenities.split(',');
      query.amenities = { $all: amenitiesArray };
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const venues = await Venue.find(query)
      .populate('owner', 'name ownerProfile.businessName')
      .populate('courts', 'name sport pricePerHour')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Venue.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        venues,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page),
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

// @desc    Get top-rated venues
// @route   GET /api/venues/top
// @access  Public
exports.getTopVenues = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const venues = await Venue.find({
      status: 'active',
      isApproved: true,
      averageRating: { $gte: 4.0 }
    })
      .populate('owner', 'name')
      .sort({ averageRating: -1, totalReviews: -1 })
      .limit(Number(limit))
      .lean();

    res.status(200).json({
      status: 'success',
      data: { venues }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Search venues
// @route   GET /api/venues/search
// @access  Public
exports.searchVenues = async (req, res) => {
  try {
    const { q, city, sport, page = 1, limit = 12 } = req.query;

    if (!q && !city && !sport) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query, city, or sport is required'
      });
    }

    const query = { status: 'active', isApproved: true };

    // Text search
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { 'location.area': { $regex: q, $options: 'i' } },
        { 'location.city': { $regex: q, $options: 'i' } }
      ];
    }

    // Additional filters
    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }

    if (sport) {
      query.sports = { $in: [sport] };
    }

    const venues = await Venue.find(query)
      .populate('owner', 'name')
      .populate('courts', 'name sport pricePerHour')
      .sort({ averageRating: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Venue.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        venues,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page),
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

// @desc    Get venue by ID
// @route   GET /api/venues/:id
// @access  Public
exports.getVenueById = async (req, res) => {
  try {
    const { id } = req.params;

    const venue = await Venue.findById(id)
      .populate('owner', 'name email phoneNumber ownerProfile')
      .populate('courts')
      .lean();

    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }

    // Get recent reviews
    const reviews = await Review.find({ venue: id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    venue.recentReviews = reviews;

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

// @desc    Get venue cities
// @route   GET /api/venues/cities
// @access  Public
exports.getVenueCities = async (req, res) => {
  try {
    const cities = await Venue.distinct('location.city', {
      status: 'active',
      isApproved: true
    });

    res.status(200).json({
      status: 'success',
      data: { cities: cities.filter(city => city) }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get available sports
// @route   GET /api/venues/sports
// @access  Public
exports.getAvailableSports = async (req, res) => {
  try {
    const sports = await Venue.distinct('sports', {
      status: 'active',
      isApproved: true
    });

    res.status(200).json({
      status: 'success',
      data: { sports: sports.filter(sport => sport) }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get venue reviews
// @route   GET /api/venues/:id/reviews
// @access  Public
exports.getVenueReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, rating } = req.query;

    const venue = await Venue.findById(id);
    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }

    const query = { venue: id };
    if (rating) {
      query.rating = Number(rating);
    }

    const reviews = await Review.find(query)
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(query);

    // Get rating distribution
    const ratingStats = await Review.aggregate([
      { $match: { venue: venue._id } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        reviews,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page),
        total,
        ratingStats
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get venue availability
// @route   GET /api/venues/:id/availability
// @access  Public
exports.getVenueAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, courtId } = req.query;

    const venue = await Venue.findById(id);
    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }

    // Get courts
    let courtsQuery = { venue: id };
    if (courtId) {
      courtsQuery._id = courtId;
    }

    const courts = await Court.find(courtsQuery);

    // Get bookings for the date
    const searchDate = date ? new Date(date) : new Date();
    const nextDay = new Date(searchDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const bookings = await Booking.find({
      venue: id,
      date: {
        $gte: searchDate,
        $lt: nextDay
      },
      status: { $in: ['confirmed', 'pending'] }
    });

    // Calculate availability for each court
    const availability = courts.map(court => {
      const courtBookings = bookings.filter(booking => 
        booking.court.toString() === court._id.toString()
      );

      const timeSlots = [];
      for (let hour = 6; hour < 23; hour++) {
        const isBooked = courtBookings.some(booking => {
          const bookingStart = parseInt(booking.startTime.split(':')[0]);
          const bookingEnd = parseInt(booking.endTime.split(':')[0]);
          return hour >= bookingStart && hour < bookingEnd;
        });

        timeSlots.push({
          time: `${hour.toString().padStart(2, '0')}:00`,
          available: !isBooked,
          price: court.pricePerHour
        });
      }

      return {
        court: court,
        timeSlots
      };
    });

    res.status(200).json({
      status: 'success',
      data: { availability }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get venue courts
// @route   GET /api/venues/:id/courts
// @access  Public
exports.getVenueCourts = async (req, res) => {
  try {
    const { id } = req.params;

    const venue = await Venue.findById(id);
    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }

    const courts = await Court.find({ venue: id });

    res.status(200).json({
      status: 'success',
      data: { courts }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Create venue review
// @route   POST /api/venues/:id/reviews
// @access  Private
exports.createReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    // Check if venue exists
    const venue = await Venue.findById(id);
    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }

    // Check if user has already reviewed this venue
    const existingReview = await Review.findOne({
      venue: id,
      user: userId
    });

    if (existingReview) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already reviewed this venue'
      });
    }

    // Create review
    const review = await Review.create({
      venue: id,
      user: userId,
      rating,
      comment
    });

    await review.populate('user', 'name avatar');

    // Update venue rating
    const reviews = await Review.find({ venue: id });
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    await Venue.findByIdAndUpdate(id, {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length
    });

    res.status(201).json({
      status: 'success',
      data: { review }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Add venue to favorites
// @route   POST /api/venues/:id/favorite
// @access  Private
exports.addToFavorites = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const venue = await Venue.findById(id);
    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }

    const user = await User.findById(userId);
    if (!user.favorites) {
      user.favorites = [];
    }

    if (user.favorites.includes(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Venue already in favorites'
      });
    }

    user.favorites.push(id);
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Venue added to favorites'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Remove venue from favorites
// @route   DELETE /api/venues/:id/favorite
// @access  Private
exports.removeFromFavorites = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user.favorites || !user.favorites.includes(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Venue not in favorites'
      });
    }

    user.favorites = user.favorites.filter(venueId => venueId.toString() !== id);
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Venue removed from favorites'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Create venue (facility owner)
// @route   POST /api/venues
// @access  Private (facility_owner, admin)
exports.createVenue = async (req, res) => {
  try {
    const venueData = { ...req.body, owner: req.user.id };

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      venueData.images = req.files.map(file => file.path);
    }

    const venue = await Venue.create(venueData);

    res.status(201).json({
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

// @desc    Update venue
// @route   PATCH /api/venues/:id
// @access  Private (facility_owner, admin)
exports.updateVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check ownership
    const venue = await Venue.findById(id);
    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }

    if (venue.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this venue'
      });
    }

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      updates.images = req.files.map(file => file.path);
    }

    const updatedVenue = await Venue.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      data: { venue: updatedVenue }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Delete venue
// @route   DELETE /api/venues/:id
// @access  Private (facility_owner, admin)
exports.deleteVenue = async (req, res) => {
  try {
    const { id } = req.params;

    const venue = await Venue.findById(id);
    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }

    if (venue.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this venue'
      });
    }

    await Venue.findByIdAndDelete(id);

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

// @desc    Add court to venue
// @route   POST /api/venues/:id/courts
// @access  Private (facility_owner, admin)
exports.addCourt = async (req, res) => {
  try {
    const { id } = req.params;

    const venue = await Venue.findById(id);
    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }

    if (venue.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to add courts to this venue'
      });
    }

    const court = await Court.create({
      ...req.body,
      venue: id
    });

    // Add court to venue
    venue.courts.push(court._id);
    await venue.save();

    res.status(201).json({
      status: 'success',
      data: { court }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Update court
// @route   PATCH /api/venues/:venueId/courts/:courtId
// @access  Private (facility_owner, admin)
exports.updateCourt = async (req, res) => {
  try {
    const { venueId, courtId } = req.params;

    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }

    if (venue.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update courts in this venue'
      });
    }

    const court = await Court.findByIdAndUpdate(courtId, req.body, {
      new: true,
      runValidators: true
    });

    if (!court) {
      return res.status(404).json({
        status: 'error',
        message: 'Court not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { court }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Delete court
// @route   DELETE /api/venues/:venueId/courts/:courtId
// @access  Private (facility_owner, admin)
exports.deleteCourt = async (req, res) => {
  try {
    const { venueId, courtId } = req.params;

    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }

    if (venue.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete courts in this venue'
      });
    }

    await Court.findByIdAndDelete(courtId);

    // Remove court from venue
    venue.courts = venue.courts.filter(court => court.toString() !== courtId);
    await venue.save();

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

// @desc    Get venue analytics
// @route   GET /api/venues/:id/analytics
// @access  Private (facility_owner, admin)
exports.getVenueAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const venue = await Venue.findById(id);
    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }

    if (venue.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view analytics for this venue'
      });
    }

    // Get booking statistics
    const totalBookings = await Booking.countDocuments({ venue: id });
    const confirmedBookings = await Booking.countDocuments({ venue: id, status: 'confirmed' });
    const totalRevenue = await Booking.aggregate([
      { $match: { venue: venue._id, status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    // Monthly bookings trend
    const monthlyBookings = await Booking.aggregate([
      { $match: { venue: venue._id } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalBookings,
        confirmedBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyBookings,
        averageRating: venue.averageRating,
        totalReviews: venue.totalReviews
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get venue bookings
// @route   GET /api/venues/:id/bookings
// @access  Private (facility_owner, admin)
exports.getVenueBookings = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status, date } = req.query;

    const venue = await Venue.findById(id);
    if (!venue) {
      return res.status(404).json({
        status: 'error',
        message: 'Venue not found'
      });
    }

    if (venue.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view bookings for this venue'
      });
    }

    const query = { venue: id };
    if (status) query.status = status;
    if (date) {
      const searchDate = new Date(date);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query.date = { $gte: searchDate, $lt: nextDay };
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email phoneNumber')
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
        currentPage: Number(page),
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
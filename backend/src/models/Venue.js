const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Venue name is required'],
    trim: true,
    maxlength: [100, 'Venue name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required']
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    country: {
      type: String,
      default: 'India',
      trim: true
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  sports: [{
    type: String,
    enum: ['badminton', 'tennis', 'football', 'cricket', 'basketball', 'squash', 'table_tennis', 'volleyball'],
    required: [true, 'At least one sport is required']
  }],
  courts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Court'
  }],
  venueType: {
    type: String,
    enum: ['indoor', 'outdoor', 'both'],
    required: [true, 'Venue type is required']
  },
  amenities: [{
    type: String,
    enum: [
      'parking', 'changing_room', 'shower', 'locker', 'cafeteria', 
      'first_aid', 'equipment_rental', 'coaching', 'wifi', 'air_conditioning',
      'lighting', 'seating', 'washroom', 'water_fountain'
    ]
  }],
  images: [{
    url: { type: String, required: true },
    publicId: String,
    caption: String
  }],
  availability: {
    openTime: {
      type: String,
      required: [true, 'Opening time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
    },
    closeTime: {
      type: String,
      required: [true, 'Closing time is required'],
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format']
    },
    weeklyOff: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    holidays: [{
      date: Date,
      reason: String
    }]
  },
  pricing: {
    hourly: {
      type: Number,
      required: [true, 'Hourly pricing is required'],
      min: [0, 'Price cannot be negative']
    },
    currency: {
      type: String,
      default: 'usd'
    },
    peakHours: [{
      startTime: String,
      endTime: String,
      multiplier: { type: Number, default: 1.5 }
    }],
    discounts: [{
      type: { type: String, enum: ['bulk', 'member', 'early_bird'] },
      value: Number,
      description: String
    }]
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    breakdown: {
      5: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      1: { type: Number, default: 0 }
    }
  },
  contact: {
    phone: String,
    email: String,
    website: String,
    socialMedia: {
      facebook: String,
      instagram: String,
      twitter: String
    }
  },
  policies: {
    cancellation: {
      type: String,
      enum: ['flexible', 'moderate', 'strict'],
      default: 'moderate'
    },
    advance_booking_days: {
      type: Number,
      default: 30
    },
    refund_policy: String
  },
  stats: {
    totalBookings: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageOccupancy: { type: Number, default: 0 },
    repeatCustomers: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
venueSchema.index({ 'location.coordinates': '2dsphere' });
venueSchema.index({ 'location.city': 1 });
venueSchema.index({ 'location.state': 1 });
venueSchema.index({ 'location.address': 1 });
venueSchema.index({ sports: 1 });
venueSchema.index({ status: 1 });
venueSchema.index({ 'rating.average': -1 });
venueSchema.index({ 'pricing.hourly': 1 });
venueSchema.index({ owner: 1 });
venueSchema.index({ createdAt: -1 });

// Text search index for fast search functionality
venueSchema.index({ 
  name: 'text', 
  description: 'text',
  'location.address': 'text',
  'location.city': 'text',
  'location.state': 'text'
}, {
  weights: {
    name: 10,
    'location.city': 8,
    'location.address': 6,
    'location.state': 4,
    description: 2
  },
  name: 'venue_text_search'
});

// Compound indexes for common search patterns
venueSchema.index({ sports: 1, 'location.city': 1, status: 1 });
venueSchema.index({ 'pricing.hourly': 1, 'rating.average': -1, status: 1 });
venueSchema.index({ status: 1, isActive: 1, 'rating.average': -1 });

// Virtual for formatted address
venueSchema.virtual('fullAddress').get(function() {
  const loc = this.location;
  return `${loc.address}, ${loc.city}, ${loc.state} ${loc.pincode}`;
});

// Virtual for price range
venueSchema.virtual('priceRange').get(function() {
  // FIX: Add a check to ensure 'pricing' and 'peakHours' exist
  if (!this.pricing || !Array.isArray(this.pricing.peakHours)) {
    return {
      min: this.pricing?.hourly || 0,
      max: this.pricing?.hourly || 0
    };
  }

  const basePrice = this.pricing.hourly;
  const peakMultiplier = this.pricing.peakHours.length > 0 
    ? Math.max(...this.pricing.peakHours.map(p => p.multiplier))
    : 1;
  
  return {
    min: basePrice,
    max: Math.round(basePrice * peakMultiplier)
  };
});

// Instance method to calculate rating
venueSchema.methods.calculateRating = function() {
  const breakdown = this.rating.breakdown;
  const totalRatings = Object.values(breakdown).reduce((sum, count) => sum + count, 0);
  
  if (totalRatings === 0) {
    this.rating.average = 0;
    this.rating.count = 0;
    return;
  }
  
  const weightedSum = Object.entries(breakdown).reduce((sum, [rating, count]) => {
    return sum + (parseInt(rating) * count);
  }, 0);
  
  this.rating.average = Number((weightedSum / totalRatings).toFixed(1));
  this.rating.count = totalRatings;
};

// Instance method to add rating
venueSchema.methods.addRating = function(rating) {
  if (rating >= 1 && rating <= 5) {
    this.rating.breakdown[rating] = (this.rating.breakdown[rating] || 0) + 1;
    this.calculateRating();
    return this.save();
  }
  throw new Error('Rating must be between 1 and 5');
};

// Instance method to check if venue is open
venueSchema.methods.isOpen = function(date = new Date()) {
  const day = date.toLocaleLowerCase().slice(0, 3);
  const dayName = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()];
  
  // Check if it's a weekly off day
  if (this.availability.weeklyOff.includes(dayName + 'day')) {
    return false;
  }
  
  // Check if it's a holiday
  const isHoliday = this.availability.holidays.some(holiday => {
    const holidayDate = new Date(holiday.date);
    return holidayDate.toDateString() === date.toDateString();
  });
  
  if (isHoliday) {
    return false;
  }
  
  return true;
};

// Instance method to get available time slots
venueSchema.methods.getAvailableSlots = function(date) {
  if (!this.isOpen(date)) {
    return [];
  }
  
  const slots = [];
  const openTime = this.availability.openTime;
  const closeTime = this.availability.closeTime;
  
  // Generate hourly slots between open and close time
  const [openHour, openMin] = openTime.split(':').map(Number);
  const [closeHour, closeMin] = closeTime.split(':').map(Number);
  
  for (let hour = openHour; hour < closeHour; hour++) {
    slots.push({
      start: `${hour.toString().padStart(2, '0')}:00`,
      end: `${(hour + 1).toString().padStart(2, '0')}:00`,
      available: true // This would be checked against bookings in real implementation
    });
  }
  
  return slots;
};

// Static method to find nearby venues
venueSchema.statics.findNearby = function(longitude, latitude, maxDistance = 10000) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    status: 'approved',
    isActive: true
  });
};

// Static method to search venues with enhanced search capabilities
venueSchema.statics.searchVenues = async function(filters = {}) {
  const baseQuery = { status: 'approved', isActive: true };
  
  console.log('🔍 searchVenues called with filters:', filters);
  
  if (filters.search && filters.search.trim()) {
    const searchText = filters.search.trim();
    console.log('🔎 Searching for:', searchText);
    
    // First try text search for exact words
    let textResults = [];
    try {
      textResults = await this.find({
        ...baseQuery,
        $text: { $search: searchText }
      })
      .select('name location pricing rating sports amenities images owner courts')
      .lean();
      
      console.log('📝 Text search results:', textResults.length);
      // Add text score for sorting
      textResults = textResults.map(doc => ({ ...doc, searchScore: 2, searchType: 'text' }));
    } catch (error) {
      console.log('❌ Text search failed, using regex only:', error.message);
    }
    
    // Also do regex search for partial matches
    const regexResults = await this.find({
      ...baseQuery,
      $or: [
        { name: { $regex: searchText, $options: 'i' } },
        { 'location.address': { $regex: searchText, $options: 'i' } },
        { 'location.city': { $regex: searchText, $options: 'i' } },
        { 'location.state': { $regex: searchText, $options: 'i' } }
      ]
    })
    .select('name location pricing rating sports amenities images owner courts')
    .lean()
    .then(results => {
      console.log('🔍 Regex search results:', results.length);
      return results.map(doc => ({ ...doc, searchScore: 1, searchType: 'regex' }));
    });
    
    // Combine and deduplicate results
    const allResults = [...textResults, ...regexResults];
    console.log('🔗 Combined results before deduplication:', allResults.length);
    
    const uniqueResults = allResults.reduce((acc, current) => {
      const existing = acc.find(item => item._id.toString() === current._id.toString());
      if (!existing) {
        acc.push(current);
      } else if (current.searchScore > existing.searchScore) {
        // Replace with higher scoring match
        const index = acc.findIndex(item => item._id.toString() === current._id.toString());
        acc[index] = current;
      }
      return acc;
    }, []);
    
    console.log('✨ Unique results after deduplication:', uniqueResults.length);
    
    // Apply additional filters
    let filteredResults = uniqueResults;
    
    if (filters.city) {
      const cityRegex = new RegExp(filters.city, 'i');
      filteredResults = filteredResults.filter(venue => cityRegex.test(venue.location.city));
      console.log(`🏙️  Filtered by city '${filters.city}':`, filteredResults.length);
    }
    
    if (filters.sport) {
      filteredResults = filteredResults.filter(venue => venue.sports.includes(filters.sport));
      console.log(`⚽ Filtered by sport '${filters.sport}':`, filteredResults.length);
    }
    
    if (filters.minPrice || filters.maxPrice) {
      filteredResults = filteredResults.filter(venue => {
        const price = venue.pricing?.hourly || 0;
        return (!filters.minPrice || price >= filters.minPrice) &&
               (!filters.maxPrice || price <= filters.maxPrice);
      });
      console.log('💰 Filtered by price:', filteredResults.length);
    }
    
    if (filters.rating) {
      filteredResults = filteredResults.filter(venue => 
        (venue.rating?.average || 0) >= filters.rating
      );
      console.log(`⭐ Filtered by rating >= ${filters.rating}:`, filteredResults.length);
    }
    
    if (filters.amenities && filters.amenities.length > 0) {
      filteredResults = filteredResults.filter(venue =>
        filters.amenities.every(amenity => venue.amenities?.includes(amenity))
      );
      console.log('🏢 Filtered by amenities:', filteredResults.length);
    }
    
    // Sort by search score, then by rating
    filteredResults.sort((a, b) => {
      if (b.searchScore !== a.searchScore) {
        return b.searchScore - a.searchScore;
      }
      return (b.rating?.average || 0) - (a.rating?.average || 0);
    });
    
    console.log('🎯 Final results:', filteredResults.length);
    return filteredResults;
  } else {
    // No search query, use regular filtering
    const query = { ...baseQuery };
    
    if (filters.city) {
      query['location.city'] = new RegExp(filters.city, 'i');
    }
    
    if (filters.sport) {
      query.sports = { $in: [filters.sport] };
    }
    
    if (filters.minPrice || filters.maxPrice) {
      query['pricing.hourly'] = {};
      if (filters.minPrice) query['pricing.hourly'].$gte = filters.minPrice;
      if (filters.maxPrice) query['pricing.hourly'].$lte = filters.maxPrice;
    }

    if (filters.rating) {
      query['rating.average'] = { $gte: filters.rating };
    }
    
    if (filters.amenities && filters.amenities.length > 0) {
      query.amenities = { $all: filters.amenities };
    }

    const sortField = filters.sortBy || 'rating.average';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    const sortObj = {};
    sortObj[sortField] = sortOrder;

    return this.find(query)
      .select('name location pricing rating sports amenities images owner courts')
      .sort(sortObj)
      .lean();
  }
};

// Enhanced method for location-based search with partial matching
venueSchema.statics.searchByLocation = function(locationQuery, options = {}) {
  const query = { status: 'approved', isActive: true };
  
  if (locationQuery) {
    query.$or = [
      { 'location.address': new RegExp(locationQuery, 'i') },
      { 'location.city': new RegExp(locationQuery, 'i') },
      { 'location.state': new RegExp(locationQuery, 'i') },
      { name: new RegExp(locationQuery, 'i') }
    ];
  }

  let queryBuilder = this.find(query);

  if (options.limit) {
    queryBuilder = queryBuilder.limit(options.limit);
  }

  if (options.page && options.limit) {
    const skip = (options.page - 1) * options.limit;
    queryBuilder = queryBuilder.skip(skip);
  }

  return queryBuilder.sort({ 'rating.average': -1 });
};

module.exports = mongoose.model('Venue', venueSchema);
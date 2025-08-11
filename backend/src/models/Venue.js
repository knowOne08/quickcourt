// backend/src/models/Venue.js
const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  location: {
    type: String,
    required: true
  },
  sports: [{
    type: String,
    enum: ['badminton', 'tennis', 'football', 'cricket', 'basketball', 'volleyball']
  }],
  venueType: {
    type: String,
    enum: ['indoor', 'outdoor'],
    required: true
  },
  amenities: [String],
  images: [String],
  operatingHours: {
    open: String,
    close: String
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  pricing: {
    basePrice: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for location-based searches
venueSchema.index({ 'address.city': 1, sports: 1, venueType: 1 });
venueSchema.index({ 'rating.average': -1 });

module.exports = mongoose.model('Venue', venueSchema);
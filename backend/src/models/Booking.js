// backend/src/models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true
  },
  court: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Court',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true // in minutes
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['online', 'cash'],
    default: 'online'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  cancellationReason: String,
  cancelledAt: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  playerMode: {
    type: String,
    enum: ['single', 'duo', 'team'],
    default: 'team'
  },
  teamSize: {
    type: Number,
    default: 1
  },
  matchMode: {
    type: String,
    enum: ['private', 'public', 'looking'],
    default: 'private'
  },
  ownerRevenue: {
    type: Number,
    default: 0
  },
  adminRevenue: {
    type: Number,
    default: 0
  },
  review: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }
}, {
  timestamps: true
});

// Prevent double booking
bookingSchema.index({ 
  court: 1, 
  date: 1, 
  startTime: 1, 
  endTime: 1 
}, { 
  unique: true,
  partialFilterExpression: { status: { $ne: 'cancelled' } }
});

module.exports = mongoose.model('Booking', bookingSchema);
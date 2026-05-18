const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: [
      'JOIN_REQUEST', 
      'REQUEST_APPROVED', 
      'REQUEST_REJECTED', 
      'TEAM_FULL', 
      'BOOKING_CONFIRMED', 
      'BOOKING_CANCELLED',
      'MATCH_REMINDER',
      'VENUE_PENDING',
      'VENUE_APPROVED',
      'VENUE_REJECTED',
      'SYSTEM'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    teamId: mongoose.Schema.Types.ObjectId,
    bookingId: mongoose.Schema.Types.ObjectId,
    venueId: mongoose.Schema.Types.ObjectId
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);

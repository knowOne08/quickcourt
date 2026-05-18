const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a team name'],
    trim: true,
    maxlength: [50, 'Team name cannot be more than 50 characters']
  },
  sport: {
    type: String,
    required: [true, 'Please specify the sport'],
    enum: [
      'Box Cricket', 
      'Badminton', 
      'Volleyball', 
      'Basketball', 
      'Pickleball', 
      'Football', 
      'Turf Games', 
      'Tennis', 
      'Table Tennis',
      'Other',
      'badminton',
      'tennis',
      'basketball',
      'football',
      'cricket',
      'squash',
      'table_tennis',
      'volleyball'
    ]
  },
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxPlayers: {
    type: Number,
    required: [true, 'Please specify total players required']
  },
  skillLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
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
  status: {
    type: String,
    enum: ['open', 'full', 'completed', 'cancelled'],
    default: 'open'
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  teamType: {
    type: String,
    enum: ['Friendly', 'Competitive', 'Tournament'],
    default: 'Friendly'
  }
}, {
  timestamps: true
});

// Virtual for remaining players
teamSchema.virtual('remainingPlayers').get(function() {
  return this.maxPlayers - this.members.length;
});

// Ensure virtuals are included in JSON
teamSchema.set('toJSON', { virtuals: true });
teamSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Team', teamSchema);

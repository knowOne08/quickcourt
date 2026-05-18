const mongoose = require('mongoose');

const teamJoinRequestSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: [100, 'Message cannot be more than 100 characters']
  },
  skillLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced']
  },
  preferredPosition: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TeamJoinRequest', teamJoinRequestSchema);

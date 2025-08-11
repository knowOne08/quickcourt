const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'wallet', 'upi', 'card'],
    default: 'razorpay'
  },
  orderId: String,
  paymentId: String,
  signature: String,
  paidAt: Date,
  refund: {
    refundId: String,
    amount: Number,
    reason: String,
    status: {
      type: String,
      enum: ['processing', 'processed', 'failed']
    },
    initiatedAt: Date,
    processedAt: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);

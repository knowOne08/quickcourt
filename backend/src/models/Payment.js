const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
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
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'stripe', 'paypal', 'wallet', 'cash'],
    required: true
  },
  // Payment Gateway Details
  razorpayDetails: {
    orderId: String,
    paymentId: String,
    signature: String
  },
  stripeDetails: {
    paymentIntentId: String,
    clientSecret: String
  },
  // Transaction Details
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  gatewayTransactionId: String,
  gatewayResponse: mongoose.Schema.Types.Mixed,
  
  // Refund Details
  refund: {
    isRefunded: {
      type: Boolean,
      default: false
    },
    refundAmount: Number,
    refundId: String,
    refundReason: String,
    refundedAt: Date,
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Fees and Breakdown
  breakdown: {
    baseAmount: Number,
    platformFee: {
      type: Number,
      default: 0
    },
    gst: {
      type: Number,
      default: 0
    },
    convenienceFee: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    }
  },
  
  // Coupon/Discount Details
  coupon: {
    code: String,
    discountAmount: Number,
    discountType: {
      type: String,
      enum: ['percentage', 'fixed']
    }
  },
  
  // Failure Details
  failureReason: String,
  failureCode: String,
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  
  // Timestamps for different states
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  failedAt: Date,
  cancelledAt: Date,
  
  // IP and Device Info
  ipAddress: String,
  userAgent: String,
  
  // Settlement Details
  settlement: {
    isSettled: {
      type: Boolean,
      default: false
    },
    settledAt: Date,
    settlementAmount: Number,
    venueShare: Number,
    platformShare: Number
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
paymentSchema.index({ booking: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ venue: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ 'razorpayDetails.orderId': 1 });
paymentSchema.index({ 'razorpayDetails.paymentId': 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for net amount after deductions
paymentSchema.virtual('netAmount').get(function() {
  if (!this.breakdown) return this.amount;
  
  return this.amount - 
         (this.breakdown.platformFee || 0) - 
         (this.breakdown.gst || 0) - 
         (this.breakdown.convenienceFee || 0);
});

// Method to calculate platform fee
paymentSchema.methods.calculatePlatformFee = function() {
  const feePercentage = process.env.PLATFORM_FEE_PERCENTAGE || 2.5;
  return (this.amount * feePercentage) / 100;
};

// Method to calculate GST
paymentSchema.methods.calculateGST = function() {
  const gstPercentage = process.env.GST_PERCENTAGE || 18;
  const platformFee = this.calculatePlatformFee();
  return (platformFee * gstPercentage) / 100;
};

// Method to update payment status
paymentSchema.methods.updateStatus = function(status, additionalData = {}) {
  this.status = status;
  
  switch (status) {
    case 'completed':
      this.completedAt = new Date();
      break;
    case 'failed':
      this.failedAt = new Date();
      if (additionalData.reason) this.failureReason = additionalData.reason;
      if (additionalData.code) this.failureCode = additionalData.code;
      break;
    case 'cancelled':
      this.cancelledAt = new Date();
      break;
  }
  
  return this.save();
};

// Method to process refund
paymentSchema.methods.processRefund = function(amount, reason, refundedBy) {
  this.refund.isRefunded = true;
  this.refund.refundAmount = amount || this.amount;
  this.refund.refundReason = reason;
  this.refund.refundedAt = new Date();
  this.refund.refundedBy = refundedBy;
  this.status = 'refunded';
  
  return this.save();
};

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = function(venueId, startDate, endDate) {
  const matchConditions = { status: 'completed' };
  
  if (venueId) matchConditions.venue = venueId;
  if (startDate && endDate) {
    matchConditions.completedAt = {
      $gte: startDate,
      $lte: endDate
    };
  }
  
  return this.aggregate([
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
        averageTransaction: { $avg: '$amount' },
        totalPlatformFee: { $sum: '$breakdown.platformFee' },
        totalGST: { $sum: '$breakdown.gst' }
      }
    }
  ]);
};

// Pre-save middleware to calculate fees
paymentSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('amount')) {
    if (!this.breakdown) this.breakdown = {};
    
    this.breakdown.baseAmount = this.amount;
    this.breakdown.platformFee = this.calculatePlatformFee();
    this.breakdown.gst = this.calculateGST();
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);

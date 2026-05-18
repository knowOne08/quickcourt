const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0.01, 'Amount must be greater than 0'],
    max: [100000, 'Amount cannot exceed 100,000']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD'],
    uppercase: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'expired'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'wallet', 'upi', 'card', 'netbanking'],
    default: 'razorpay'
  },
  
  // Razorpay specific fields
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  paymentId: {
    type: String,
    sparse: true,
    index: true
  },
  signature: {
    type: String,
    sparse: true
  },
  
  // Timestamps
  paidAt: {
    type: Date,
    sparse: true
  },
  expiresAt: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from creation
    },
    index: { expireAfterSeconds: 0 }
  },
  
  // Security and audit fields
  metadata: {
    userAgent: String,
    ipAddress: String,
    createdAt: Date,
    verifiedAt: Date,
    verificationIp: String,
    verificationUserAgent: String
  },
  
  // Failure tracking
  failureReason: String,
  failureCode: String,
  
  // Refund information
  refund: {
    refundId: String,
    amount: {
      type: Number,
      min: 0
    },
    reason: String,
    status: {
      type: String,
      enum: ['processing', 'processed', 'failed']
    },
    initiatedAt: Date,
    processedAt: Date,
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Additional notes
  notes: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ booking: 1, status: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ orderId: 1, status: 1 });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: this.currency || 'INR'
  }).format(this.amount);
});

// Virtual for payment duration
paymentSchema.virtual('paymentDuration').get(function() {
  if (this.paidAt && this.createdAt) {
    return Math.round((this.paidAt - this.createdAt) / 1000); // Duration in seconds
  }
  return null;
});

// Instance method to check if payment is expired
paymentSchema.methods.isExpired = function() {
  return this.status === 'pending' && this.expiresAt < new Date();
};

// Instance method to check if refund is allowed
paymentSchema.methods.canRefund = function() {
  return this.status === 'completed' && !this.refund?.refundId;
};

// Pre-save middleware to set expiry for pending payments
paymentSchema.pre('save', function(next) {
  if (this.isNew && this.status === 'pending') {
    this.expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }
  
  if (this.status === 'completed' && !this.paidAt) {
    this.paidAt = new Date();
  }
  
  next();
});

// Static method to cleanup expired payments
paymentSchema.statics.cleanupExpiredPayments = async function() {
  const expiredPayments = await this.updateMany(
    {
      status: 'pending',
      expiresAt: { $lt: new Date() }
    },
    {
      status: 'expired',
      notes: 'Automatically expired due to timeout'
    }
  );
  
  return expiredPayments;
};

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = async function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        avgAmount: { $avg: '$amount' }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

module.exports = mongoose.model('Payment', paymentSchema);

module.exports = mongoose.model('Payment', paymentSchema);

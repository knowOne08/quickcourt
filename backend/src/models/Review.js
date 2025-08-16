const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
    ref: 'Court'
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  rating: {
    overall: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    cleanliness: {
      type: Number,
      min: 1,
      max: 5
    },
    facilities: {
      type: Number,
      min: 1,
      max: 5
    },
    staff: {
      type: Number,
      min: 1,
      max: 5
    },
    valueForMoney: {
      type: Number,
      min: 1,
      max: 5
    },
    location: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  images: [String], // URLs to uploaded images

  // Moderation
  isApproved: {
    type: Boolean,
    default: true
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  moderationReason: String,
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: Date,

  // Interaction metrics
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  dislikes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dislikedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reports: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'fake', 'offensive', 'other']
    },
    description: String,
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Response from venue owner
  ownerResponse: {
    message: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  },

  // Helpful votes
  helpfulVotes: {
    type: Number,
    default: 0
  },

  // Review metadata
  visitDate: Date,
  reviewSource: {
    type: String,
    enum: ['mobile', 'web', 'email'],
    default: 'web'
  },

  // Verification
  isVerifiedBooking: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
reviewSchema.index({ venue: 1, isApproved: 1, isHidden: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ booking: 1 }, { unique: true }); // One review per booking
reviewSchema.index({ 'rating.overall': -1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ helpfulVotes: -1 });

// Virtual for total likes
reviewSchema.virtual('totalLikes').get(function () {
  return this.likes.length;
});

// Virtual for total dislikes
reviewSchema.virtual('totalDislikes').get(function () {
  return this.dislikes.length;
});

// Virtual for net helpful score
reviewSchema.virtual('netHelpfulScore').get(function () {
  return this.totalLikes - this.totalDislikes;
});

// Method to add like
reviewSchema.methods.addLike = function (userId) {
  // Remove any existing dislike
  this.dislikes = this.dislikes.filter(dislike =>
    !dislike.user.equals(userId)
  );

  // Check if already liked
  const existingLike = this.likes.find(like =>
    like.user.equals(userId)
  );

  if (!existingLike) {
    this.likes.push({ user: userId });
    this.helpfulVotes += 1;
  }

  return this.save();
};

// Method to add dislike
reviewSchema.methods.addDislike = function (userId) {
  // Remove any existing like
  this.likes = this.likes.filter(like =>
    !like.user.equals(userId)
  );

  // Check if already disliked
  const existingDislike = this.dislikes.find(dislike =>
    dislike.user.equals(userId)
  );

  if (!existingDislike) {
    this.dislikes.push({ user: userId });
    this.helpfulVotes -= 1;
  }

  return this.save();
};

// Method to add report
reviewSchema.methods.addReport = function (userId, reason, description) {
  // Check if user already reported
  const existingReport = this.reports.find(report =>
    report.user.equals(userId)
  );

  if (!existingReport) {
    this.reports.push({
      user: userId,
      reason,
      description
    });
  }

  return this.save();
};

// Method to add owner response
reviewSchema.methods.addOwnerResponse = function (message, respondedBy) {
  this.ownerResponse = {
    message,
    respondedBy,
    respondedAt: new Date()
  };

  return this.save();
};

// Static method to get venue review statistics
reviewSchema.statics.getVenueStats = function (venueId) {
  return this.aggregate([
    {
      $match: {
        venue: new mongoose.Types.ObjectId(venueId),
        isApproved: true,
        isHidden: false
      }
    },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating.overall' },
        averageCleanliness: { $avg: '$rating.cleanliness' },
        averageFacilities: { $avg: '$rating.facilities' },
        averageStaff: { $avg: '$rating.staff' },
        averageValueForMoney: { $avg: '$rating.valueForMoney' },
        averageLocation: { $avg: '$rating.location' },
        ratingDistribution: {
          $push: '$rating.overall'
        }
      }
    },
    {
      $addFields: {
        ratingBreakdown: {
          5: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 5] }
              }
            }
          },
          4: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 4] }
              }
            }
          },
          3: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 3] }
              }
            }
          },
          2: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 2] }
              }
            }
          },
          1: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 1] }
              }
            }
          }
        }
      }
    },
    {
      $unset: 'ratingDistribution'
    }
  ]);
};

// Pre-save middleware to verify booking
reviewSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const Booking = mongoose.model('Booking');
      const booking = await Booking.findById(this.booking);

      if (booking && booking.status === 'completed') {
        this.isVerifiedBooking = true;
        this.visitDate = booking.date;
      }
    } catch (error) {
      console.log('Error verifying booking:', error);
    }
  }
  next();
});

module.exports = mongoose.model('Review', reviewSchema);

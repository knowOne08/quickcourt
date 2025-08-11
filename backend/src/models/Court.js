const mongoose = require('mongoose');

const courtSchema = new mongoose.Schema({
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  sport: {
    type: String,
    required: true,
    enum: ['badminton', 'tennis', 'basketball', 'football', 'cricket', 'squash', 'table_tennis', 'volleyball']
  },
  type: {
    type: String,
    enum: ['indoor', 'outdoor'],
    default: 'indoor'
  },
  surface: {
    type: String,
    enum: ['concrete', 'grass', 'synthetic', 'clay', 'wooden', 'rubber']
  },
  dimensions: {
    length: Number,
    width: Number,
    unit: {
      type: String,
      enum: ['meters', 'feet'],
      default: 'meters'
    }
  },
  amenities: [String],
  pricePerHour: {
    type: Number,
    required: true,
    min: 0
  },
  peakHourPricing: {
    enabled: {
      type: Boolean,
      default: false
    },
    pricePerHour: Number,
    hours: [{
      start: String, // "09:00"
      end: String    // "18:00"
    }]
  },
  availability: {
    monday: {
      isOpen: { type: Boolean, default: true },
      hours: [{
        start: String, // "06:00"
        end: String    // "22:00"
      }]
    },
    tuesday: {
      isOpen: { type: Boolean, default: true },
      hours: [{
        start: String,
        end: String
      }]
    },
    wednesday: {
      isOpen: { type: Boolean, default: true },
      hours: [{
        start: String,
        end: String
      }]
    },
    thursday: {
      isOpen: { type: Boolean, default: true },
      hours: [{
        start: String,
        end: String
      }]
    },
    friday: {
      isOpen: { type: Boolean, default: true },
      hours: [{
        start: String,
        end: String
      }]
    },
    saturday: {
      isOpen: { type: Boolean, default: true },
      hours: [{
        start: String,
        end: String
      }]
    },
    sunday: {
      isOpen: { type: Boolean, default: true },
      hours: [{
        start: String,
        end: String
      }]
    }
  },
  images: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  maintenance: {
    isUnderMaintenance: {
      type: Boolean,
      default: false
    },
    maintenanceStart: Date,
    maintenanceEnd: Date,
    reason: String
  },
  totalBookings: {
    type: Number,
    default: 0
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
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
courtSchema.index({ venue: 1, sport: 1 });
courtSchema.index({ venue: 1, isActive: 1 });
courtSchema.index({ 'rating.average': -1 });

// Virtual for daily revenue
courtSchema.virtual('dailyRevenue').get(function() {
  return this.pricePerHour * 8; // Assuming 8 hours average daily usage
});

// Method to check if court is available at a specific time
courtSchema.methods.isAvailableAt = function(date, startTime, endTime) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
  const daySchedule = this.availability[dayName];
  
  if (!daySchedule.isOpen) return false;
  
  // Check if requested time falls within operating hours
  return daySchedule.hours.some(schedule => {
    return startTime >= schedule.start && endTime <= schedule.end;
  });
};

// Method to calculate price for a time slot
courtSchema.methods.calculatePrice = function(date, startTime, endTime, duration) {
  let basePrice = this.pricePerHour;
  
  // Check if it's peak hours
  if (this.peakHourPricing.enabled) {
    const isPeakHour = this.peakHourPricing.hours.some(peak => {
      return startTime >= peak.start && endTime <= peak.end;
    });
    
    if (isPeakHour) {
      basePrice = this.peakHourPricing.pricePerHour;
    }
  }
  
  return (basePrice * duration) / 60; // duration in minutes
};

module.exports = mongoose.model('Court', courtSchema);

const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  court: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Court',
    required: true
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true, // Format: "09:00"
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Invalid time format. Use HH:MM format.'
    }
  },
  endTime: {
    type: String,
    required: true, // Format: "10:00"
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Invalid time format. Use HH:MM format.'
    }
  },
  duration: {
    type: Number,
    required: true // in minutes
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['available', 'booked', 'blocked', 'maintenance'],
    default: 'available'
  },
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly']
    },
    endDate: Date,
    exceptions: [Date] // Dates to skip in recurring pattern
  },
  // Dynamic pricing
  pricing: {
    isPeakHour: {
      type: Boolean,
      default: false
    },
    isDiscounted: {
      type: Boolean,
      default: false
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    discountReason: String,
    surge: {
      isActive: {
        type: Boolean,
        default: false
      },
      multiplier: {
        type: Number,
        min: 1,
        default: 1
      },
      reason: String
    }
  },
  // Availability metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  blockReason: String,
  blockType: {
    type: String,
    enum: ['owner', 'maintenance', 'event', 'admin']
  },
  // Booking restrictions
  restrictions: {
    minAdvanceBooking: {
      type: Number,
      default: 0 // hours
    },
    maxAdvanceBooking: {
      type: Number,
      default: 720 // hours (30 days)
    },
    allowedUserTypes: [{
      type: String,
      enum: ['member', 'guest', 'premium']
    }],
    minimumAge: Number,
    maximumCapacity: Number
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
timeSlotSchema.index({ court: 1, date: 1, startTime: 1 });
timeSlotSchema.index({ venue: 1, date: 1, status: 1 });
timeSlotSchema.index({ date: 1, status: 1 });
timeSlotSchema.index({ booking: 1 });

// Unique constraint to prevent overlapping slots
timeSlotSchema.index(
  { court: 1, date: 1, startTime: 1, endTime: 1 },
  { unique: true }
);

// Virtual for human-readable time range
timeSlotSchema.virtual('timeRange').get(function() {
  return `${this.startTime} - ${this.endTime}`;
});

// Virtual for discounted price
timeSlotSchema.virtual('finalPrice').get(function() {
  let price = this.price;
  
  if (this.pricing.isDiscounted && this.pricing.discountPercentage) {
    price = price * (1 - this.pricing.discountPercentage / 100);
  }
  
  if (this.pricing.surge.isActive) {
    price = price * this.pricing.surge.multiplier;
  }
  
  return Math.round(price * 100) / 100; // Round to 2 decimal places
});

// Method to check if slot is available for booking
timeSlotSchema.methods.isAvailableForBooking = function(userType = 'guest') {
  if (this.status !== 'available') return false;
  
  // Check user type restrictions
  if (this.restrictions.allowedUserTypes.length > 0) {
    if (!this.restrictions.allowedUserTypes.includes(userType)) {
      return false;
    }
  }
  
  // Check advance booking restrictions
  const now = new Date();
  const slotDateTime = new Date(`${this.date.toDateString()} ${this.startTime}`);
  const hoursUntilSlot = (slotDateTime - now) / (1000 * 60 * 60);
  
  if (hoursUntilSlot < this.restrictions.minAdvanceBooking) return false;
  if (hoursUntilSlot > this.restrictions.maxAdvanceBooking) return false;
  
  return true;
};

// Method to book the slot
timeSlotSchema.methods.book = function(bookingId) {
  this.status = 'booked';
  this.booking = bookingId;
  return this.save();
};

// Method to unbook the slot
timeSlotSchema.methods.unbook = function() {
  this.status = 'available';
  this.booking = undefined;
  return this.save();
};

// Method to block the slot
timeSlotSchema.methods.block = function(reason, blockType = 'owner', blockedBy) {
  this.status = 'blocked';
  this.blockReason = reason;
  this.blockType = blockType;
  this.lastModifiedBy = blockedBy;
  return this.save();
};

// Method to apply dynamic pricing
timeSlotSchema.methods.applyDynamicPricing = function() {
  const Court = mongoose.model('Court');
  
  // This would implement dynamic pricing logic based on:
  // - Demand
  // - Time of day
  // - Day of week
  // - Weather
  // - Events nearby
  // For now, it's a placeholder
  
  return this.save();
};

// Static method to generate time slots for a court and date range
timeSlotSchema.statics.generateSlotsForCourt = async function(courtId, startDate, endDate, slotDuration = 60) {
  const Court = mongoose.model('Court');
  const court = await Court.findById(courtId);
  
  if (!court) throw new Error('Court not found');
  
  const slots = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const daySchedule = court.availability[dayName];
    
    if (daySchedule.isOpen) {
      for (const schedule of daySchedule.hours) {
        const startHour = parseInt(schedule.start.split(':')[0]);
        const startMinute = parseInt(schedule.start.split(':')[1]);
        const endHour = parseInt(schedule.end.split(':')[0]);
        const endMinute = parseInt(schedule.end.split(':')[1]);
        
        let currentTime = startHour * 60 + startMinute; // in minutes
        const endTime = endHour * 60 + endMinute;
        
        while (currentTime + slotDuration <= endTime) {
          const startTimeStr = `${Math.floor(currentTime / 60).toString().padStart(2, '0')}:${(currentTime % 60).toString().padStart(2, '0')}`;
          const endTimeStr = `${Math.floor((currentTime + slotDuration) / 60).toString().padStart(2, '0')}:${((currentTime + slotDuration) % 60).toString().padStart(2, '0')}`;
          
          const price = court.calculatePrice(currentDate, startTimeStr, endTimeStr, slotDuration);
          
          slots.push({
            court: courtId,
            venue: court.venue,
            date: new Date(currentDate),
            startTime: startTimeStr,
            endTime: endTimeStr,
            duration: slotDuration,
            price: price,
            originalPrice: price,
            status: 'available'
          });
          
          currentTime += slotDuration;
        }
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return this.insertMany(slots, { ordered: false, throwOnValidationError: false });
};

// Static method to get available slots for a court on a specific date
timeSlotSchema.statics.getAvailableSlots = function(courtId, date, userType = 'guest') {
  return this.find({
    court: courtId,
    date: {
      $gte: new Date(date.toDateString()),
      $lt: new Date(new Date(date.toDateString()).getTime() + 24 * 60 * 60 * 1000)
    },
    status: 'available'
  }).sort({ startTime: 1 });
};

// Pre-save middleware to validate time slots
timeSlotSchema.pre('save', function(next) {
  // Ensure end time is after start time
  const startMinutes = parseInt(this.startTime.split(':')[0]) * 60 + parseInt(this.startTime.split(':')[1]);
  const endMinutes = parseInt(this.endTime.split(':')[0]) * 60 + parseInt(this.endTime.split(':')[1]);
  
  if (endMinutes <= startMinutes) {
    return next(new Error('End time must be after start time'));
  }
  
  // Calculate duration if not provided
  if (!this.duration) {
    this.duration = endMinutes - startMinutes;
  }
  
  next();
});

module.exports = mongoose.model('TimeSlot', timeSlotSchema);

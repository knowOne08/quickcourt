// backend/src/services/bookingService.js
const Booking = require('../models/Booking');
const Court = require('../models/Court');

class BookingService {
  /**
   * Check if a time slot is available for booking
   */
  async isSlotAvailable(courtId, date, startTime, endTime) {
    try {
      // Convert string date to Date object if needed
      let dateObj = date;
      if (typeof date === 'string') {
        dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
          throw new Error('Invalid date format');
        }
      }

      // Check for existing bookings that overlap with the requested time
      const existingBooking = await Booking.findOne({
        court: courtId,
        date: dateObj,
        status: { $ne: 'cancelled' },
        $or: [
          // New booking starts during existing booking
          {
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
          },
          // New booking completely contains existing booking
          {
            startTime: { $gte: startTime },
            endTime: { $lte: endTime }
          }
        ]
      });

      return !existingBooking;
    } catch (error) {
      throw new Error(`Error checking slot availability: ${error.message}`);
    }
  }

  /**
   * Generate available time slots for a court on a specific date
   */
  async getAvailableSlots(courtId, date, slotDuration = 60) {
    try {
      console.log('BookingService.getAvailableSlots called with:', {
        courtId,
        date,
        slotDuration
      });
      
      const court = await Court.findById(courtId);
      if (!court) {
        throw new Error('Court not found');
      }

      console.log('Court found:', {
        id: court._id,
        name: court.name,
        venue: court.venue
      });

      if (!court) {
        throw new Error('Court not found');
      }

      // Convert string date to Date object if needed
      let dateObj = date;
      if (typeof date === 'string') {
        dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
          throw new Error('Invalid date format');
        }
      }

      // Check if venue is open on the selected date
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[dateObj.getDay()];
      const daySchedule = court.availability[dayName];
      
      console.log('Day check:', {
        dayOfWeek: dateObj.getDay(),
        dayName,
        daySchedule: daySchedule
      });
      
      if (!daySchedule || !daySchedule.isOpen) {
        console.log('Court is closed on this day');
        return []; // Court is closed on this day
      }

      // Use court's specific availability hours for this day, fallback to venue hours
      let operatingHours;
      if (daySchedule.hours && daySchedule.hours.length > 0) {
        // Use court's specific hours for this day
        operatingHours = {
          start: daySchedule.hours[0].start,
          end: daySchedule.hours[0].end
        };
      } else {
        // Fallback to venue's general operating hours
        const venue = await require('../models/Venue').findById(court.venue);
        if (!venue) {
          throw new Error('Venue not found');
        }
        operatingHours = {
          start: venue.availability.openTime,
          end: venue.availability.closeTime
        };
      }

      console.log('Operating hours determined:', operatingHours);

      // Generate time slots with configurable duration
      const slots = [];
      const startTime = new Date(`2000-01-01T${operatingHours.start}`);
      const endTime = new Date(`2000-01-01T${operatingHours.end}`);
      const slotDurationMs = slotDuration * 60 * 1000; // Convert to milliseconds

      // Ensure we generate slots correctly
      if (startTime >= endTime) {
        return [];
      }

      // Generate slots with the specified duration
      let currentTime = new Date(startTime);
      while (currentTime < endTime) {
        const slotStartTime = currentTime.toTimeString().slice(0, 5);
        const slotEndTime = new Date(currentTime.getTime() + slotDurationMs).toTimeString().slice(0, 5);
        
        // Don't create slots that extend beyond closing time
        if (new Date(`2000-01-01T${slotEndTime}`) > endTime) {
          break;
        }

        // Check if this slot is available
        const isAvailable = await this.isSlotAvailable(courtId, dateObj, slotStartTime, slotEndTime);
        
        slots.push({
          startTime: slotStartTime,
          endTime: slotEndTime,
          available: isAvailable,
          price: court.pricePerHour,
          duration: slotDuration
        });

        // Move to next slot
        currentTime = new Date(currentTime.getTime() + slotDurationMs);
      }

      return slots;
    } catch (error) {
      throw new Error(`Error generating available slots: ${error.message}`);
    }
  }

  /**
   * Create a new booking
   */
  async createBooking(bookingData) {
    try {
      // Validate slot availability one more time before creating
      const isAvailable = await this.isSlotAvailable(
        bookingData.court,
        bookingData.date,
        bookingData.startTime,
        bookingData.endTime
      );

      if (!isAvailable) {
        throw new Error('Selected time slot is no longer available');
      }

      // Create the booking
      const booking = await Booking.create(bookingData);
      return booking;
    } catch (error) {
      throw new Error(`Error creating booking: ${error.message}`);
    }
  }

  /**
   * Get user's upcoming bookings
   */
  async getUserUpcomingBookings(userId) {
    try {
      const now = new Date();
      const bookings = await Booking.find({
        user: userId,
        date: { $gte: now },
        status: { $nin: ['cancelled', 'completed'] }
      })
      .populate('venue', 'name location images')
      .populate('court', 'name sport pricePerHour')
      .sort({ date: 1, startTime: 1 });

      return bookings;
    } catch (error) {
      throw new Error(`Error fetching upcoming bookings: ${error.message}`);
    }
  }

  /**
   * Get user's past bookings
   */
  async getUserPastBookings(userId, page = 1, limit = 10) {
    try {
      const now = new Date();
      const skip = (page - 1) * limit;

      const bookings = await Booking.find({
        user: userId,
        date: { $lt: now }
      })
      .populate('venue', 'name location images')
      .populate('court', 'name sport pricePerHour')
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(limit);

      const total = await Booking.countDocuments({
        user: userId,
        date: { $lt: now }
      });

      return {
        bookings,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      };
    } catch (error) {
      throw new Error(`Error fetching past bookings: ${error.message}`);
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(bookingId, userId, reason) {
    try {
      const booking = await Booking.findById(bookingId);
      
      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.user.toString() !== userId) {
        throw new Error('Not authorized to cancel this booking');
      }

      if (booking.status === 'cancelled') {
        throw new Error('Booking is already cancelled');
      }

      // Check if booking is in the past
      const bookingDateTime = new Date(`${booking.date.toISOString().split('T')[0]}T${booking.startTime}`);
      if (bookingDateTime <= new Date()) {
        throw new Error('Cannot cancel past bookings');
      }

      booking.status = 'cancelled';
      booking.cancellationReason = reason;
      booking.cancelledAt = new Date();
      booking.cancelledBy = userId;

      await booking.save();
      return booking;
    } catch (error) {
      throw new Error(`Error cancelling booking: ${error.message}`);
    }
  }

  /**
   * Get venue bookings for owners
   */
  async getVenueBookings(venueId, ownerId, filters = {}) {
    try {
      const query = { venue: venueId };
      
      if (filters.status) query.status = filters.status;
      if (filters.date) {
        const searchDate = new Date(filters.date);
        const nextDay = new Date(searchDate);
        nextDay.setDate(nextDay.getDate() + 1);
        query.date = {
          $gte: searchDate,
          $lt: nextDay
        };
      }
      if (filters.court) query.court = filters.court;

      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const skip = (page - 1) * limit;

      const bookings = await Booking.find(query)
        .populate('user', 'name email phone')
        .populate('court', 'name sport')
        .sort({ date: -1, startTime: 1 })
        .skip(skip)
        .limit(limit);

      const total = await Booking.countDocuments(query);

      return {
        bookings,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      };
    } catch (error) {
      throw new Error(`Error fetching venue bookings: ${error.message}`);
    }
  }
}

module.exports = new BookingService();

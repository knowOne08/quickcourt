// backend/src/utils/seedBookings.js
const mongoose = require('mongoose');
const User = require('../models/User');
const Venue = require('../models/Venue');
const Court = require('../models/Court');
const Booking = require('../models/Booking');
const logger = require('./logger');

const seedBookings = async () => {
  try {
    // Clear existing bookings
    await Booking.deleteMany({});
    logger.info('Cleared existing bookings');

    // Get some users and courts for creating bookings
    const users = await User.find({ role: 'user' }).limit(3);
    const courts = await Court.find().limit(10);

    if (users.length === 0 || courts.length === 0) {
      logger.error('No users or courts found. Please run seedData first.');
      return;
    }

    const sampleBookings = [];

    // Create bookings for the next 7 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() + dayOffset);
      
      // Skip if it's Sunday (most venues are closed)
      if (currentDate.getDay() === 0) continue;

      // Create 2-4 bookings per day
      const bookingsPerDay = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < bookingsPerDay; i++) {
        const court = courts[Math.floor(Math.random() * courts.length)];
        const user = users[Math.floor(Math.random() * users.length)];
        
        // Generate random time slots between 6 AM and 10 PM
        const startHour = Math.floor(Math.random() * 16) + 6; // 6 AM to 10 PM
        const duration = [60, 90, 120, 180][Math.floor(Math.random() * 4)]; // 1, 1.5, 2, or 3 hours
        
        const startTime = `${startHour.toString().padStart(2, '0')}:00`;
        const endHour = startHour + (duration / 60);
        const endTime = `${endHour.toString().padStart(2, '0')}:00`;
        
        // Skip if end time is after 10 PM
        if (endHour > 22) continue;
        
        const totalAmount = (court.pricePerHour * duration) / 60;
        
        const booking = {
          user: user._id,
          venue: court.venue,
          court: court._id,
          date: currentDate,
          startTime,
          endTime,
          duration,
          totalAmount: Math.round(totalAmount),
          status: ['pending', 'confirmed', 'completed'][Math.floor(Math.random() * 3)],
          paymentStatus: ['pending', 'paid'][Math.floor(Math.random() * 2)],
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random time in last week
        };
        
        sampleBookings.push(booking);
      }
    }

    // Create the bookings
    const createdBookings = await Booking.create(sampleBookings);
    
    logger.info(`Created ${createdBookings.length} sample bookings`);
    
    // Log some sample bookings for verification
    logger.info('Sample bookings created:');
    createdBookings.slice(0, 5).forEach(booking => {
      logger.info(`- ${booking.date.toDateString()} ${booking.startTime}-${booking.endTime} at Court ${booking.court}`);
    });

    return createdBookings;
  } catch (error) {
    logger.error('Error seeding bookings:', error);
    throw error;
  }
};

module.exports = seedBookings;

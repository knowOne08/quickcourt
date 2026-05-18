const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Venue = require('./src/models/Venue');
const Booking = require('./src/models/Booking');

async function initializeVenueStats() {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quickcourt_v2';
    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB');

    const venues = await Venue.find({});
    console.log(`Found ${venues.length} venues to update`);

    for (const venue of venues) {
      // Calculate real stats from bookings
      const bookings = await Booking.find({ 
        venue: venue._id, 
        status: { $in: ['confirmed', 'completed'] } 
      });

      const totalBookings = bookings.length;
      const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      
      venue.stats = {
        totalBookings,
        totalRevenue,
        averageOccupancy: totalBookings > 0 ? 65 : 0, // Mock occupancy
        repeatCustomers: totalBookings > 0 ? Math.floor(totalBookings * 0.2) : 0
      };

      await venue.save();
      console.log(`Updated stats for venue: ${venue.name}`);
    }

    console.log('Successfully initialized all venue stats');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

initializeVenueStats();

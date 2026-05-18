const mongoose = require('mongoose');
const path = require('path');
const Booking = require('./src/models/Booking');
const { COMMISSION_RATE } = require('./src/utils/constants');

async function checkBookings() {
  try {
    // Load .env to get MONGODB_URI
    require('dotenv').config({ path: path.join(__dirname, '../.env') });
    
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quickcourt_v2';
    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB');

    const bookings = await Booking.find({ status: { $in: ['confirmed', 'completed'] } });
    console.log(`Found ${bookings.length} confirmed/completed bookings`);

    let updatedCount = 0;
    for (const booking of bookings) {
      if ((!booking.adminRevenue || booking.adminRevenue === 0) && booking.totalAmount > 0) {
        booking.adminRevenue = booking.totalAmount * COMMISSION_RATE;
        booking.ownerRevenue = booking.totalAmount - booking.adminRevenue;
        await booking.save();
        updatedCount++;
      }
    }

    console.log(`Updated ${updatedCount} bookings with revenue data`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkBookings();

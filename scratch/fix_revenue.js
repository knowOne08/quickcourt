const mongoose = require('mongoose');
const Booking = require('./backend/src/models/Booking');
const { COMMISSION_RATE } = require('./backend/src/utils/constants');

async function checkBookings() {
  try {
    await mongoose.connect('mongodb://localhost:27017/quickcourt_v2');
    console.log('Connected to MongoDB');

    const bookings = await Booking.find({ status: { $in: ['confirmed', 'completed'] } });
    console.log(`Found ${bookings.length} confirmed/completed bookings`);

    let updatedCount = 0;
    for (const booking of bookings) {
      if (booking.adminRevenue === 0 && booking.totalAmount > 0) {
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

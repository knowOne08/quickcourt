const mongoose = require('mongoose');
const Booking = require('./src/models/Booking');
const User = require('./src/models/User');
require('dotenv').config();

async function checkBookings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quickcourt_v2');
    console.log(`Connected to: ${mongoose.connection.host}`);
    console.log(`Database Name: ${mongoose.connection.db.databaseName}`);
    console.log('---');
    
    const bookings = await Booking.find().sort({ createdAt: -1 }).limit(5);
    console.log(`Total Bookings: ${await Booking.countDocuments()}`);
    
    const targetEmail = 'pvyom010@gmail.com';
    const usersWithEmail = await User.find({ email: targetEmail });
    console.log(`Users with email ${targetEmail}: ${usersWithEmail.length}`);
    usersWithEmail.forEach(u => {
      console.log(`User ID: ${u._id}, Role: ${u.role}`);
    });
    
    const users = await User.find().limit(10);
    users.forEach((u, i) => {
      console.log(`User ${i}: _id=${u._id}, email=${u.email}, name=${u.name}, role=${u.role}`);
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkBookings();

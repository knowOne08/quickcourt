// backend/seedDatabase.js
const mongoose = require('mongoose');
const seedData = require('./src/utils/seedData');
const addMoreVenues = require('./src/utils/addMoreVenues');
const seedBookings = require('./src/utils/seedBookings');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quickcourt');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

const main = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear and seed basic data
    console.log('\n📊 Seeding basic data...');
    await seedData();
    
    // Add more venues
    console.log('\n🏟️ Adding more venues...');
    await addMoreVenues();
    
    // Add sample bookings
    console.log('\n📅 Adding sample bookings...');
    await seedBookings();
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n🎯 You can now test the booking system with:');
    console.log('   - Multiple venues with different sports');
    console.log('   - Available and unavailable time slots');
    console.log('   - Sample user accounts for testing');
    console.log('\n👤 Test Accounts:');
    console.log('   - User: john@example.com / password123');
    console.log('   - Owner: owner1@example.com / password123');
    console.log('   - Admin: admin@example.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

main();

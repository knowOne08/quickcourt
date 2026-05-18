// backend/simpleTestData.js
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Venue = require('./src/models/Venue');
const Court = require('./src/models/Court');
const Booking = require('./src/models/Booking');
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

const addSimpleTestData = async () => {
  try {
    console.log('🚀 Adding simple test data...');
    
    // Check if we already have data
    const existingVenues = await Venue.countDocuments();
    if (existingVenues > 0) {
      console.log('✅ Database already has data. Skipping...');
      return;
    }
    
    // Create a test user if none exists
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'user',
        phoneNumber: '9876543200',
        isEmailVerified: true
      });
      console.log('👤 Created test user');
    }
    
    // Create a test venue owner
    let testOwner = await User.findOne({ email: 'owner@example.com' });
    if (!testOwner) {
      testOwner = await User.create({
        name: 'Test Owner',
        email: 'owner@example.com',
        password: 'password123',
        role: 'facility_owner',
        phoneNumber: '9876543201',
        isEmailVerified: true
      });
      console.log('👑 Created test owner');
    }
    
    // Create a simple test venue with valid enum values
    const testVenue = await Venue.create({
      name: 'Quick Test Badminton Court',
      description: 'A simple test venue for booking system testing',
      owner: testOwner._id,
      location: {
        address: '123 Test Street',
        city: 'Ahmedabad',
        state: 'Gujarat',
        country: 'India',
        pincode: '380001',
        coordinates: [72.5714, 23.0225]
      },
      sports: ['badminton'], // Valid enum value
      venueType: 'indoor', // Valid enum value
      amenities: ['parking', 'changing_room', 'shower', 'locker'], // Valid enum values
      images: [
        {
          url: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=800&h=600&fit=crop',
          caption: 'Test Court'
        }
      ],
      availability: {
        openTime: '06:00',
        closeTime: '22:00',
        weeklyOff: ['sunday'] // Valid enum value
      },
      pricing: {
        hourly: 300,
        currency: 'INR'
      },
      rating: {
        average: 4.5,
        count: 5,
        breakdown: { 5: 3, 4: 2, 3: 0, 2: 0, 1: 0 }
      },
      contact: {
        phone: '9876543202',
        email: 'test@badminton.com'
      },
      status: 'approved', // Valid enum value
      isActive: true
    });
    console.log('🏟️ Created test venue');
    
    // Create a test court with valid enum values
    const testCourt = await Court.create({
      venue: testVenue._id,
      name: 'Badminton Court 1',
      sport: 'badminton', // Valid enum value
      type: 'indoor', // Valid enum value
      surface: 'concrete', // Valid enum value
      dimensions: {
        length: 13.4,
        width: 6.1,
        unit: 'meters' // Valid enum value
      },
      amenities: ['lighting', 'seating'],
      pricePerHour: 300,
      availability: {
        monday: { isOpen: true, hours: [{ start: '06:00', end: '22:00' }] },
        tuesday: { isOpen: true, hours: [{ start: '06:00', end: '22:00' }] },
        wednesday: { isOpen: true, hours: [{ start: '06:00', end: '22:00' }] },
        thursday: { isOpen: true, hours: [{ start: '06:00', end: '22:00' }] },
        friday: { isOpen: true, hours: [{ start: '06:00', end: '22:00' }] },
        saturday: { isOpen: true, hours: [{ start: '06:00', end: '22:00' }] },
        sunday: { isOpen: false, hours: [] }
      },
      isActive: true,
      totalBookings: 0,
      rating: {
        average: 4.5,
        count: 5
      }
    });
    console.log('🏓 Created test court');
    
    // Add court to venue
    testVenue.courts = [testCourt._id];
    await testVenue.save();
    
    // Create a few sample bookings to show unavailable slots
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const sampleBookings = [
      {
        user: testUser._id,
        venue: testVenue._id,
        court: testCourt._id,
        date: tomorrow,
        startTime: '14:00',
        endTime: '16:00',
        duration: 120,
        totalAmount: 600,
        status: 'confirmed', // Valid enum value
        paymentStatus: 'paid' // Valid enum value
      },
      {
        user: testUser._id,
        venue: testVenue._id,
        court: testCourt._id,
        date: tomorrow,
        startTime: '18:00',
        endTime: '20:00',
        duration: 120,
        totalAmount: 600,
        status: 'confirmed', // Valid enum value
        paymentStatus: 'paid' // Valid enum value
      }
    ];
    
    await Booking.create(sampleBookings);
    console.log('📅 Created sample bookings');
    
    console.log('\n✅ Simple test data added successfully!');
    console.log('\n🎯 Test with:');
    console.log('   - User: test@example.com / password123');
    console.log('   - Venue: Quick Test Badminton Court');
    console.log('   - Tomorrow will show some unavailable slots');
    
  } catch (error) {
    console.error('❌ Error adding test data:', error);
    console.error('Error details:', error.message);
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`${key}:`, error.errors[key].message);
      });
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the function
connectDB().then(() => addSimpleTestData());

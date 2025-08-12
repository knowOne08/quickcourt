// backend/fixVenueData.js
const mongoose = require('mongoose');
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

const fixVenueData = async () => {
  try {
    console.log('🔧 Fixing venue data...');
    
    // Find the "Swimming Complex" venue
    const swimmingVenue = await Venue.findOne({ name: 'Swimming Complex' });
    if (swimmingVenue) {
      console.log('🏊 Found Swimming Complex venue, updating...');
      
      // Update the venue to be more appropriate for its name
      await Venue.updateOne(
        { _id: swimmingVenue._id },
        { 
          name: 'Aqua Sports Center',
          description: 'Multi-sport aquatic facility with badminton courts',
          sports: ['badminton', 'table_tennis']
        }
      );
      console.log('✅ Updated venue name and sports');
    }
    
    // Find all venues and ensure they have proper courts
    const venues = await Venue.find({});
    console.log(`📊 Found ${venues.length} venues`);
    
    for (const venue of venues) {
      console.log(`\n🏟️ Processing venue: ${venue.name}`);
      
      // Check if venue has courts
      const courtCount = await Court.countDocuments({ venue: venue._id });
      console.log(`   Courts found: ${courtCount}`);
      
      if (courtCount === 0) {
        console.log(`   ⚠️ No courts found for ${venue.name}, creating one...`);
        
        // Create a default court for this venue
        const defaultCourt = await Court.create({
          venue: venue._id,
          name: `${venue.sports[0].charAt(0).toUpperCase() + venue.sports[0].slice(1)} Court 1`,
          sport: venue.sports[0],
          type: venue.venueType,
          surface: 'concrete',
          dimensions: {
            length: 20,
            width: 15,
            unit: 'meters'
          },
          amenities: ['lighting', 'seating'],
          pricePerHour: venue.pricing.hourly,
          availability: {
            monday: { isOpen: true, hours: [{ start: venue.availability.openTime, end: venue.availability.closeTime }] },
            tuesday: { isOpen: true, hours: [{ start: venue.availability.openTime, end: venue.availability.closeTime }] },
            wednesday: { isOpen: true, hours: [{ start: venue.availability.openTime, end: venue.availability.closeTime }] },
            thursday: { isOpen: true, hours: [{ start: venue.availability.openTime, end: venue.availability.closeTime }] },
            friday: { isOpen: true, hours: [{ start: venue.availability.openTime, end: venue.availability.closeTime }] },
            saturday: { isOpen: true, hours: [{ start: venue.availability.openTime, end: venue.availability.closeTime }] },
            sunday: venue.availability.weeklyOff?.includes('sunday') ? { isOpen: false, hours: [] } : { isOpen: true, hours: [{ start: venue.availability.openTime, end: venue.availability.closeTime }] }
          },
          isActive: true,
          totalBookings: 0,
          rating: {
            average: 4.5,
            count: 5
          }
        });
        
        console.log(`   ✅ Created court: ${defaultCourt.name}`);
        
        // Add court to venue
        venue.courts = [defaultCourt._id];
        await venue.save();
        console.log(`   ✅ Added court to venue`);
      }
      
      // Verify venue has courts array
      if (!venue.courts || venue.courts.length === 0) {
        const courts = await Court.find({ venue: venue._id });
        venue.courts = courts.map(c => c._id);
        await venue.save();
        console.log(`   ✅ Updated venue courts array`);
      }
    }
    
    // Create some sample bookings to show unavailable slots
    console.log('\n📅 Creating sample bookings...');
    
    // Clear existing bookings
    await Booking.deleteMany({});
    console.log('   🗑️ Cleared existing bookings');
    
    // Get a test user and some courts
    const testUser = await require('./src/models/User').findOne({ role: 'user' });
    const courts = await Court.find().limit(5);
    
    if (testUser && courts.length > 0) {
      const sampleBookings = [];
      
      // Create bookings for the next 3 days
      for (let dayOffset = 1; dayOffset <= 3; dayOffset++) {
        const bookingDate = new Date();
        bookingDate.setDate(bookingDate.getDate() + dayOffset);
        
        // Skip Sundays
        if (bookingDate.getDay() === 0) continue;
        
        // Create 2-3 bookings per day
        const bookingsPerDay = Math.floor(Math.random() * 2) + 2;
        
        for (let i = 0; i < bookingsPerDay; i++) {
          const court = courts[Math.floor(Math.random() * courts.length)];
          
          // Generate random time slots between 2 PM and 8 PM
          const startHour = Math.floor(Math.random() * 6) + 14; // 2 PM to 8 PM
          const duration = [30, 60, 90, 120][Math.floor(Math.random() * 3)]; // 1, 1.5, or 2 hours
          
          const startTime = `${startHour.toString().padStart(2, '0')}:00`;
          const endHour = startHour + (duration / 60);
          const endTime = `${endHour.toString().padStart(2, '0')}:00`;
          
          // Skip if end time is after 10 PM
          if (endHour > 22) continue;
          
          const totalAmount = (court.pricePerHour * duration) / 60;
          
          const booking = {
            user: testUser._id,
            venue: court.venue,
            court: court._id,
            date: bookingDate,
            startTime,
            endTime,
            duration,
            totalAmount: Math.round(totalAmount),
            status: 'confirmed',
            paymentStatus: 'paid'
          };
          
          sampleBookings.push(booking);
        }
      }
      
      if (sampleBookings.length > 0) {
        await Booking.create(sampleBookings);
        console.log(`   ✅ Created ${sampleBookings.length} sample bookings`);
        
        // Log some sample bookings
        console.log('   📋 Sample bookings:');
        sampleBookings.slice(0, 3).forEach(booking => {
          console.log(`      - ${booking.date.toDateString()} ${booking.startTime}-${booking.endTime}`);
        });
      }
    }
    
    console.log('\n✅ Venue data fixed successfully!');
    console.log('\n🎯 Now you should see:');
    console.log('   - All venues have courts');
    console.log('   - Sample bookings showing unavailable slots');
    console.log('   - Proper time slot availability');
    
  } catch (error) {
    console.error('❌ Error fixing venue data:', error);
    console.error('Error details:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the function
connectDB().then(() => fixVenueData());

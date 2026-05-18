const mongoose = require('mongoose');
const Venue = require('./src/models/Venue');
const Court = require('./src/models/Court');
require('dotenv').config();

async function fixVenues() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quickcourt_v2');
    console.log(`Connected to: ${mongoose.connection.host}`);
    
    const venues = await Venue.find().populate('courts');
    console.log(`Total Venues: ${venues.length}`);
    
    for (const v of venues) {
      if (v.courts.length === 0) {
        console.log(`Fixing Venue: ${v.name} (_id: ${v._id})`);
        
        // Create a default court
        const court = await Court.create({
          venue: v._id,
          name: 'Main Court',
          sport: v.sports && v.sports.length > 0 ? v.sports[0] : 'badminton',
          pricePerHour: v.pricing?.hourly || 500,
          isActive: true
        });
        
        v.courts.push(court._id);
        await v.save();
        console.log(`  Added Court: ${court.name} (${court.sport})`);
      }
    }
    
    console.log('Finished fixing venues.');
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

fixVenues();

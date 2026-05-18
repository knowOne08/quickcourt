const mongoose = require('mongoose');
const Venue = require('./src/models/Venue');
const Court = require('./src/models/Court');
require('dotenv').config();

async function checkVenues() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quickcourt_v2');
    console.log(`Connected to: ${mongoose.connection.host}`);
    
    const venues = await Venue.find().populate('courts');
    console.log(`Total Venues: ${venues.length}`);
    
    venues.forEach((v, i) => {
      console.log(`Venue ${i}: ${v.name} (_id: ${v._id})`);
      console.log(`  Status: ${v.status}`);
      console.log(`  Courts Count: ${v.courts.length}`);
      v.courts.forEach((c, j) => {
        console.log(`    Court ${j}: ${c.name} (${c.sport}) - ₹${c.pricePerHour}`);
      });
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkVenues();

const mongoose = require('mongoose');
const Venue = require('./src/models/Venue');
const path = require('path');

async function listVenues() {
  try {
    require('dotenv').config({ path: path.join(__dirname, '.env') });
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quickcourt_v2';
    await mongoose.connect(dbUri);
    
    const venues = await Venue.find({}, 'name');
    console.log('Current Venues:');
    venues.forEach(v => console.log(`- ${v.name}`));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

listVenues();

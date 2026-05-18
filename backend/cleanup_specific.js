const mongoose = require('mongoose');
const Venue = require('./src/models/Venue');
const path = require('path');

async function cleanupSpecificVenues() {
  try {
    require('dotenv').config({ path: path.join(__dirname, '.env') });
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quickcourt_v2';
    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB');

    const result = await Venue.deleteMany({
      name: { $in: ['arena', 'test', 'Test Venue'] }
    });

    console.log(`Deleted ${result.deletedCount} specific dummy venues`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

cleanupSpecificVenues();

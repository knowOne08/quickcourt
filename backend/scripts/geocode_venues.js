// Usage: node scripts/geocode_venues.js
const mongoose = require('mongoose');
const axios = require('axios');
const Venue = require('../src/models/Venue');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/quickcourt';

async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
  try {
    const res = await axios.get(url, { headers: { 'User-Agent': 'QuickCourtGeocoder/1.0' } });
    if (res.data && res.data.length > 0) {
      const { lat, lon } = res.data[0];
      return [parseFloat(lon), parseFloat(lat)]; // [longitude, latitude]
    }
  } catch (err) {
    console.error('Geocoding error:', err.message);
  }
  return null;
}

async function updateVenueCoordinates() {
  await mongoose.connect(MONGO_URI);
  const venues = await Venue.find({});
  for (const venue of venues) {
    const loc = venue.location;
    const fullAddress = `${loc.address}, ${loc.city}, ${loc.state}, ${loc.country}, ${loc.pincode}`;
    const coords = await geocodeAddress(fullAddress);
    if (coords) {
      venue.location.coordinates = coords;
      await venue.save();
      console.log(`Updated: ${venue.name} -> ${coords}`);
    } else {
      console.log(`Could not geocode: ${venue.name} (${fullAddress})`);
    }
    // Be polite to the API
    await new Promise(r => setTimeout(r, 1000));
  }
  mongoose.disconnect();
}

updateVenueCoordinates();

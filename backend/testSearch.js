// Test script for enhanced search functionality
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quickcourt', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const testSearchFunctionality = async () => {
  try {
    const Venue = require('./src/models/Venue');
    
    console.log('🔍 Testing search functionality...\n');
    
    // Test 1: Text search for badminton
    console.log('Test 1: Searching for "badminton"');
    const badmintonResults = await Venue.searchVenues({ search: 'badminton' });
    console.log(`Found ${badmintonResults.length} venues:`, 
      badmintonResults.map(v => ({ name: v.name, city: v.location?.city, textScore: v.textScore }))
    );
    
    // Test 2: Location search
    console.log('\nTest 2: Searching for "mumbai"');
    const mumbaiResults = await Venue.searchVenues({ search: 'mumbai' });
    console.log(`Found ${mumbaiResults.length} venues:`, 
      mumbaiResults.map(v => ({ name: v.name, city: v.location?.city, textScore: v.textScore }))
    );
    
    // Test 3: Partial location search
    console.log('\nTest 3: Searching for "ahme" (partial city name)');
    const partialResults = await Venue.searchVenues({ search: 'ahme' });
    console.log(`Found ${partialResults.length} venues:`, 
      partialResults.map(v => ({ name: v.name, city: v.location?.city, textScore: v.textScore }))
    );
    
    // Test 4: Combined search with filters
    console.log('\nTest 4: Searching for "sports" with badminton filter');
    const combinedResults = await Venue.searchVenues({ 
      search: 'sports', 
      sport: 'badminton' 
    });
    console.log(`Found ${combinedResults.length} venues:`, 
      combinedResults.map(v => ({ name: v.name, city: v.location?.city, sports: v.sports, textScore: v.textScore }))
    );
    
    // Test 5: Location-based search method
    console.log('\nTest 5: Using location-based search for "ahmedabad"');
    const locationResults = await Venue.searchByLocation('ahmedabad', { limit: 5 });
    console.log(`Found ${locationResults.length} venues:`, 
      locationResults.map(v => ({ name: v.name, city: v.location?.city, rating: v.rating?.average }))
    );
    
    console.log('\n✅ All search tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing search functionality:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await testSearchFunctionality();
  } catch (error) {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔐 Database connection closed');
    process.exit(0);
  }
};

// Run the test
main();

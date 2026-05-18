// Script to create text search indexes for enhanced venue search
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

const createSearchIndexes = async () => {
  try {
    console.log('📝 Creating text search indexes...');
    
    const db = mongoose.connection.db;
    const venuesCollection = db.collection('venues');
    
    // Drop existing text index if it exists
    try {
      await venuesCollection.dropIndex('venue_text_search');
      console.log('🗑️  Dropped existing text search index');
    } catch (error) {
      console.log('ℹ️  No existing text search index to drop');
    }
    
    // Create new text search index
    const textIndex = await venuesCollection.createIndex(
      {
        name: 'text',
        description: 'text',
        'location.address': 'text',
        'location.city': 'text',
        'location.state': 'text'
      },
      {
        weights: {
          name: 10,
          'location.city': 8,
          'location.address': 6,
          'location.state': 4,
          description: 2
        },
        name: 'venue_text_search'
      }
    );
    
    console.log('✅ Created text search index:', textIndex);
    
    // Create compound indexes for common search patterns
    const compoundIndexes = [
      { fields: { sports: 1, 'location.city': 1, status: 1 }, name: 'sports_city_status' },
      { fields: { 'pricing.hourly': 1, 'rating.average': -1, status: 1 }, name: 'price_rating_status' },
      { fields: { status: 1, isActive: 1, 'rating.average': -1 }, name: 'status_active_rating' },
      { fields: { 'location.city': 1, status: 1 }, name: 'city_status' },
      { fields: { 'location.state': 1, status: 1 }, name: 'state_status' }
    ];
    
    for (const indexSpec of compoundIndexes) {
      try {
        const result = await venuesCollection.createIndex(indexSpec.fields, { name: indexSpec.name });
        console.log(`✅ Created compound index ${indexSpec.name}:`, result);
      } catch (error) {
        if (error.codeName === 'IndexKeySpecsConflict' || error.code === 85) {
          console.log(`ℹ️  Index ${indexSpec.name} already exists`);
        } else {
          console.error(`❌ Error creating index ${indexSpec.name}:`, error.message);
        }
      }
    }
    
    // List all indexes
    const indexes = await venuesCollection.listIndexes().toArray();
    console.log('\n📋 All venue collection indexes:');
    indexes.forEach(index => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    console.log('\n🎉 Search indexes setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error creating search indexes:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await createSearchIndexes();
    console.log('\n✅ Database optimization completed!');
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔐 Database connection closed');
    process.exit(0);
  }
};

// Run the script
main();

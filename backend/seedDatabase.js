require('dotenv').config();
const mongoose = require('mongoose');
const seedData = require('./src/utils/seedData');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quickcourt';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB successfully!');
    
    // Run seed data
    console.log('Starting to seed database...');
    const result = await seedData();
    
    console.log('\n✅ Database seeded successfully!');
    console.log(`📊 Created ${result.users.length} users`);
    console.log(`🏟️  Created ${result.venues.length} venues`);
    console.log(`🏓 Created ${result.courts.length} courts`);
    
    console.log('\n👥 Test Users:');
    console.log('User: john@example.com / password123');
    console.log('Owner: owner1@example.com / password123');
    console.log('Admin: admin@example.com / password123');
    
    console.log('\n🏟️  Venues created:');
    result.venues.forEach(venue => {
      console.log(`- ${venue.name} (${venue.location.city})`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the seed function
seedDatabase();

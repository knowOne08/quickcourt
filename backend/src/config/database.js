const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    // Use a default connection string if none provided
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quickcourt';
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Database event listeners
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        logger.error('Error during database disconnection:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('Database connection error:', error.message);
    logger.error('Database connection error:', error.message);
    // Don't exit process, just log the error for development
    // process.exit(1);
  }
};

module.exports = connectDB;

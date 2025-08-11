const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Basic logger fallback
const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`)
};

// Try to connect to database, but don't fail if it's not available
try {
  const connectDB = require('./src/config/database');
  connectDB();
} catch (error) {
  logger.error('Database connection file not found or failed to load');
}

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Basic API test endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'QuickCourt API is running',
    version: '1.0.0'
  });
});

// Try to load routes, but don't fail if they're not available
try {
  const authRoutes = require('./src/routes/auth');
  app.use('/api/auth', authRoutes);
} catch (error) {
  logger.error('Auth routes not found');
  app.use('/api/auth', (req, res) => {
    res.json({ message: 'Auth routes not implemented yet' });
  });
}

try {
  const userRoutes = require('./src/routes/users');
  app.use('/api/users', userRoutes);
} catch (error) {
  logger.error('User routes not found');
  app.use('/api/users', (req, res) => {
    res.json({ message: 'User routes not implemented yet' });
  });
}

try {
  const venueRoutes = require('./src/routes/venues');
  app.use('/api/venues', venueRoutes);
} catch (error) {
  logger.error('Venue routes not found');
  app.use('/api/venues', (req, res) => {
    res.json({ message: 'Venue routes not implemented yet' });
  });
}

try {
  const bookingRoutes = require('./src/routes/bookings');
  app.use('/api/bookings', bookingRoutes);
} catch (error) {
  logger.error('Booking routes not found');
  app.use('/api/bookings', (req, res) => {
    res.json({ message: 'Booking routes not implemented yet' });
  });
}

try {
  const paymentRoutes = require('./src/routes/payments');
  app.use('/api/payments', paymentRoutes);
} catch (error) {
  logger.error('Payment routes not found');
  app.use('/api/payments', (req, res) => {
    res.json({ message: 'Payment routes not implemented yet' });
  });
}

try {
  const ownerRoutes = require('./src/routes/owner');
  app.use('/api/owner', ownerRoutes);
} catch (error) {
  logger.error('Owner routes not found');
  app.use('/api/owner', (req, res) => {
    res.json({ message: 'Owner routes not implemented yet' });
  });
}

try {
  const adminRoutes = require('./src/routes/admin');
  app.use('/api/admin', adminRoutes);
} catch (error) {
  logger.error('Admin routes not found');
  app.use('/api/admin', (req, res) => {
    res.json({ message: 'Admin routes not implemented yet' });
  });
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Basic error handler
app.use((err, req, res, next) => {
  logger.error(err.message);
  res.status(500).json({
    success: false,
    error: 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Rejection: ' + err.message);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;

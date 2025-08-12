const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Basic logger fallback
const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()}: ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()}: ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()}: ${msg}`)
};

// Try to connect to database, but don't fail if it's not available
try {
  const connectDB = require('./src/config/database');
  connectDB();
  logger.info('Database connection initiated');
} catch (error) {
  logger.error(`Database connection failed: ${error.message}`);
}

// Initialize session manager for authentication
try {
  const sessionManager = require('./src/utils/sessionManager');
  sessionManager.initPeriodicCleanup();
  logger.info('Session manager initialized');
} catch (error) {
  logger.error(`Session manager initialization failed: ${error.message}`);
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
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit for development
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Disable caching for API endpoints to fix 304 issues
app.use('/api', (req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  next();
});

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

// Helper function to load routes safely
const loadRoute = (routePath, mountPath, routeName) => {
  try {
    const route = require(routePath);
    if (route && typeof route === 'function') {
      app.use(mountPath, route);
      logger.info(`✅ ${routeName} routes loaded successfully at ${mountPath}`);
      return true;
    } else {
      logger.error(`❌ ${routeName} route file exists but doesn't export a valid router`);
      return false;
    }
  } catch (error) {
    logger.error(`❌ Failed to load ${routeName} routes: ${error.message}`);
    
    // Create a fallback route
    app.use(mountPath, (req, res) => {
      res.json({ 
        success: false,
        message: `${routeName} routes not implemented yet`,
        error: error.message
      });
    });
    return false;
  }
};

// Load all routes
logger.info('🚀 Loading API routes...');

loadRoute('./src/routes/auth', '/api/auth', 'Auth');
loadRoute('./src/routes/users', '/api/users', 'User');
loadRoute('./src/routes/venues', '/api/venues', 'Venue');
loadRoute('./src/routes/bookings', '/api/bookings', 'Booking');
loadRoute('./src/routes/payments', '/api/payments', 'Payment');
loadRoute('./src/routes/owner', '/api/owner', 'Owner');
loadRoute('./src/routes/admin', '/api/admin', 'Admin');

logger.info('📋 Route loading completed');

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`Global error handler: ${err.message}`);
  logger.error(`Stack: ${err.stack}`);
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Server Error' : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`🎉 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  logger.info(`🌐 Health check: http://localhost:${PORT}/health`);
  logger.info(`🔗 API base: http://localhost:${PORT}/api`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  process.exit(1);
});

module.exports = app;

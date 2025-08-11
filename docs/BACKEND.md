# Backend Development Guide

## Overview

The QuickCourt backend is built with Node.js and Express.js, following RESTful API principles and MVC architecture patterns.

## Project Structure

```
backend/src/
├── controllers/         # Route handlers and business logic
├── models/             # MongoDB schemas and data models
├── routes/             # Express route definitions
├── middleware/         # Custom middleware functions
├── services/           # Business logic and external service integration
├── config/             # Configuration files
├── utils/              # Helper functions and utilities
└── app.js              # Express application setup
```

## Core Components

### Models (MongoDB Schemas)

#### User Model (`src/models/User.js`)
```javascript
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { 
    type: String, 
    enum: ['user', 'facility_owner', 'admin'], 
    default: 'user' 
  },
  isVerified: { type: Boolean, default: false },
  avatar: { type: String },
  preferences: {
    sports: [String],
    location: String,
    notifications: { type: Boolean, default: true }
  }
}, { timestamps: true });
```

#### Venue Model (`src/models/Venue.js`)
```javascript
const venueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: {
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    coordinates: { type: [Number], index: '2dsphere' }
  },
  sports: [{ type: String, required: true }],
  amenities: [String],
  images: [String],
  pricing: {
    hourly: { type: Number, required: true },
    currency: { type: String, default: 'INR' }
  },
  availability: {
    openTime: { type: String, required: true },
    closeTime: { type: String, required: true },
    weeklyOff: [String]
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'suspended'], 
    default: 'pending' 
  }
}, { timestamps: true });
```

#### Booking Model (`src/models/Booking.js`)
```javascript
const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
  date: { type: Date, required: true },
  timeSlot: {
    start: { type: String, required: true },
    end: { type: String, required: true }
  },
  sport: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled', 'completed'], 
    default: 'pending' 
  },
  payment: {
    transactionId: String,
    method: String,
    status: { 
      type: String, 
      enum: ['pending', 'completed', 'failed', 'refunded'] 
    }
  },
  cancellation: {
    reason: String,
    cancelledAt: Date,
    refundAmount: Number
  }
}, { timestamps: true });
```

### Controllers

#### Auth Controller (`src/controllers/authController.js`)
```javascript
class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, password, phone, role } = req.body;
      
      // Validate input
      const validationResult = validateUserInput({ name, email, password });
      if (!validationResult.isValid) {
        return res.status(400).json({
          success: false,
          message: validationResult.message
        });
      }
      
      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists'
        });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create user
      const user = new User({
        name,
        email,
        password: hashedPassword,
        phone,
        role
      });
      
      await user.save();
      
      // Send verification email
      await emailService.sendVerificationEmail(user.email, user.name);
      
      res.status(201).json({
        success: true,
        message: 'Registration successful. Please verify your email.',
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        }
      });
      
    } catch (error) {
      next(error);
    }
  }
  
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      // Generate JWT
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          token
        }
      });
      
    } catch (error) {
      next(error);
    }
  }
}
```

#### Venue Controller (`src/controllers/venueController.js`)
```javascript
class VenueController {
  async getVenues(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        location,
        sport,
        minPrice,
        maxPrice,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
      
      // Build query
      const query = { status: 'approved' };
      
      if (location) {
        query['location.city'] = { $regex: location, $options: 'i' };
      }
      
      if (sport) {
        query.sports = { $in: [sport] };
      }
      
      if (minPrice || maxPrice) {
        query['pricing.hourly'] = {};
        if (minPrice) query['pricing.hourly'].$gte = Number(minPrice);
        if (maxPrice) query['pricing.hourly'].$lte = Number(maxPrice);
      }
      
      // Execute query with pagination
      const venues = await Venue.find(query)
        .populate('owner', 'name phone')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      
      const total = await Venue.countDocuments(query);
      
      res.json({
        success: true,
        data: {
          venues,
          pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil(total / limit),
            totalVenues: total,
            hasNext: page * limit < total,
            hasPrev: page > 1
          }
        }
      });
      
    } catch (error) {
      next(error);
    }
  }
  
  async createVenue(req, res, next) {
    try {
      const venueData = req.body;
      venueData.owner = req.user.userId;
      
      const venue = new Venue(venueData);
      await venue.save();
      
      res.status(201).json({
        success: true,
        message: 'Venue created successfully',
        data: { venue }
      });
      
    } catch (error) {
      next(error);
    }
  }
}
```

### Middleware

#### Authentication Middleware (`src/middleware/auth.js`)
```javascript
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    req.user = decoded;
    next();
    
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions.'
      });
    }
    
    next();
  };
};
```

#### Validation Middleware (`src/middleware/validation.js`)
```javascript
const { body, validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

const userValidationRules = () => {
  return [
    body('name')
      .isLength({ min: 2 })
      .withMessage('Name must be at least 2 characters'),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
  ];
};

const venueValidationRules = () => {
  return [
    body('name')
      .isLength({ min: 3 })
      .withMessage('Venue name must be at least 3 characters'),
    body('description')
      .isLength({ min: 10 })
      .withMessage('Description must be at least 10 characters'),
    body('location.address')
      .notEmpty()
      .withMessage('Address is required'),
    body('sports')
      .isArray({ min: 1 })
      .withMessage('At least one sport must be specified')
  ];
};
```

#### Rate Limiting (`src/middleware/rateLimit.js`)
```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  }
});
```

### Services

#### Email Service (`src/services/emailService.js`)
```javascript
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  
  async sendVerificationEmail(email, name, otp) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your QuickCourt Account',
      html: `
        <h2>Welcome to QuickCourt, ${name}!</h2>
        <p>Your verification code is: <strong>${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
      `
    };
    
    return await this.transporter.sendMail(mailOptions);
  }
  
  async sendBookingConfirmation(email, bookingDetails) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Booking Confirmation - QuickCourt',
      html: `
        <h2>Booking Confirmed!</h2>
        <p>Your booking at ${bookingDetails.venueName} has been confirmed.</p>
        <p><strong>Date:</strong> ${bookingDetails.date}</p>
        <p><strong>Time:</strong> ${bookingDetails.timeSlot}</p>
        <p><strong>Amount:</strong> ₹${bookingDetails.amount}</p>
      `
    };
    
    return await this.transporter.sendMail(mailOptions);
  }
}
```

#### Payment Service (`src/services/paymentService.js`)
```javascript
const Razorpay = require('razorpay');

class PaymentService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  
  async createOrder(amount, currency = 'INR', bookingId) {
    try {
      const order = await this.razorpay.orders.create({
        amount: amount * 100, // Amount in paise
        currency,
        receipt: `booking_${bookingId}`,
        payment_capture: 1
      });
      
      return order;
    } catch (error) {
      throw new Error('Failed to create payment order');
    }
  }
  
  async verifyPayment(paymentId, orderId, signature) {
    try {
      const crypto = require('crypto');
      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');
      
      return expectedSignature === signature;
    } catch (error) {
      return false;
    }
  }
}
```

### Database Configuration

#### Database Connection (`src/config/database.js`)
```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Database event listeners
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};
```

### Error Handling

#### Global Error Handler (`src/middleware/errorHandler.js`)
```javascript
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log error
  console.error(err.stack);
  
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { statusCode: 404, message };
  }
  
  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { statusCode: 400, message };
  }
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { statusCode: 400, message };
  }
  
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

### Testing

#### Unit Testing Example
```javascript
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');

describe('Auth Routes', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });
  
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
    });
    
    it('should not register user with invalid email', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
  });
});
```

### Performance Optimization

#### Database Indexing
```javascript
// In model files
venueSchema.index({ 'location.coordinates': '2dsphere' });
venueSchema.index({ 'location.city': 1 });
venueSchema.index({ sports: 1 });
venueSchema.index({ 'pricing.hourly': 1 });
venueSchema.index({ status: 1, createdAt: -1 });

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ venue: 1, date: 1 });
bookingSchema.index({ date: 1, status: 1 });
```

#### Caching Strategy
```javascript
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    const key = req.originalUrl;
    
    try {
      const cached = await client.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      res.sendResponse = res.json;
      res.json = (body) => {
        client.setex(key, duration, JSON.stringify(body));
        res.sendResponse(body);
      };
      
      next();
    } catch (error) {
      next();
    }
  };
};
```

## Development Best Practices

1. **Validation**: Always validate input data
2. **Error Handling**: Use try-catch blocks and global error handlers
3. **Security**: Implement authentication, authorization, and input sanitization
4. **Performance**: Use database indexing and caching where appropriate
5. **Testing**: Write unit and integration tests
6. **Documentation**: Keep API documentation updated
7. **Monitoring**: Implement logging and monitoring

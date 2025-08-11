# QuickCourt Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Installation Guide](#installation-guide)
4. [API Documentation](#api-documentation)
5. [Frontend Guide](#frontend-guide)
6. [Backend Guide](#backend-guide)
7. [Database Schema](#database-schema)
8. [Deployment](#deployment)
9. [Contributing](#contributing)

## Project Overview

QuickCourt is a comprehensive sports venue booking platform that connects users with sports facilities, enabling seamless venue discovery, booking, and management.

### Key Features
- **User Management**: Registration, authentication, and profile management
- **Venue Discovery**: Search and filter sports venues by location, sport type, and availability
- **Booking System**: Real-time slot booking with calendar integration
- **Payment Integration**: Secure payment processing for bookings
- **Owner Dashboard**: Facility management for venue owners
- **Admin Panel**: System administration and venue approval workflow
- **Review System**: User ratings and reviews for venues

### Technology Stack

#### Frontend
- **React 18**: Modern React with hooks and functional components
- **React Router v6**: Client-side routing
- **Context API**: State management for auth and booking
- **CSS Modules**: Styled components with responsive design
- **Axios**: HTTP client for API communication

#### Backend
- **Node.js**: Server runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database with Mongoose ODM
- **JWT**: JSON Web Token authentication
- **Cloudinary**: Image upload and management
- **Nodemailer**: Email service integration
- **Razorpay/Stripe**: Payment gateway integration

#### DevOps & Tools
- **Git**: Version control
- **npm**: Package management
- **Postman**: API testing
- **MongoDB Compass**: Database GUI

## Architecture

```
QuickCourt/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Route-based page components
│   │   ├── context/         # React Context providers
│   │   ├── services/        # API service layer
│   │   ├── hooks/           # Custom React hooks
│   │   ├── styles/          # CSS stylesheets
│   │   └── utils/           # Utility functions
│   └── public/              # Static assets
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # Express route definitions
│   │   ├── middleware/      # Custom middleware
│   │   ├── services/        # Business logic layer
│   │   ├── config/          # Configuration files
│   │   └── utils/           # Helper functions
│   └── server.js            # Application entry point
├── shared/                  # Shared utilities and constants
└── docs/                    # Documentation
```

## Installation Guide

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn package manager

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd quickcourt
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   
   # Install backend dependencies
   cd ../backend
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment template
   cp backend/.env.example backend/.env
   ```
   
   Configure the following variables in `backend/.env`:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/quickcourt
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Payment Gateway
   RAZORPAY_KEY_ID=your_razorpay_key
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB service
   mongod
   
   # Seed initial data (optional)
   cd backend
   npm run seed
   ```

5. **Start Development Servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## User Roles

### Regular User
- Browse and search venues
- Make bookings
- Manage profile
- View booking history
- Rate and review venues

### Facility Owner
- Register and manage venues
- Set pricing and availability
- View booking analytics
- Manage facility details
- Respond to reviews

### Admin
- Approve new venues
- Manage users and owners
- System analytics
- Content moderation
- Platform configuration

## Development Guidelines

### Code Style
- Use ES6+ features
- Follow component-based architecture
- Implement proper error handling
- Write descriptive commit messages
- Add comments for complex logic

### Testing
- Unit tests for utility functions
- Integration tests for API endpoints
- Component testing for React components
- End-to-end testing for critical user flows

### Security
- Input validation and sanitization
- Authentication middleware
- Rate limiting
- CORS configuration
- Environment variable protection

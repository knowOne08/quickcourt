const { body, param, query, validationResult } = require('express-validator');
const { ApplicationError } = require('./errorHandler');

// Validation result checker
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  next();
};

// User validation rules
const userRegistrationRules = () => {
  return [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Name can only contain letters and spaces'),
    
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    
    body('phone')
      .optional()
      .isMobilePhone('en-IN')
      .withMessage('Please provide a valid Indian phone number'),
    
    body('role')
      .optional()
      .isIn(['user', 'facility_owner'])
      .withMessage('Role must be either user or facility_owner')
  ];
};

const userLoginRules = () => {
  return [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ];
};

const userUpdateRules = () => {
  return [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    
    body('phone')
      .optional()
      .isMobilePhone('en-IN')
      .withMessage('Please provide a valid Indian phone number'),
    
    body('preferences.sports')
      .optional()
      .isArray()
      .withMessage('Sports preferences must be an array'),
    
    body('preferences.location')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Location must be at least 2 characters')
  ];
};

// Venue validation rules
const venueCreationRules = () => {
  return [
    body('name')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Venue name must be between 3 and 100 characters'),
    
    body('description')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters'),
    
    body('location.address')
      .trim()
      .isLength({ min: 10 })
      .withMessage('Address must be at least 10 characters'),
    
    body('location.city')
      .trim()
      .isLength({ min: 2 })
      .withMessage('City is required'),
    
    body('location.state')
      .trim()
      .isLength({ min: 2 })
      .withMessage('State is required'),
    
    body('location.pincode')
      .isPostalCode('IN')
      .withMessage('Please provide a valid Indian pincode'),
    
    body('sports')
      .isArray({ min: 1 })
      .withMessage('At least one sport must be specified'),
    
    body('sports.*')
      .isIn(['badminton', 'tennis', 'football', 'cricket', 'basketball', 'squash', 'table_tennis', 'volleyball'])
      .withMessage('Invalid sport specified'),
    
    body('pricing.hourly')
      .isFloat({ min: 0 })
      .withMessage('Hourly pricing must be a positive number'),
    
    body('availability.openTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Open time must be in HH:MM format'),
    
    body('availability.closeTime')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Close time must be in HH:MM format'),
    
    body('amenities')
      .optional()
      .isArray()
      .withMessage('Amenities must be an array')
  ];
};

// Booking validation rules
const bookingCreationRules = () => {
  return [
    body('venueId')
      .isMongoId()
      .withMessage('Valid venue ID is required'),
    
    body('date')
      .isISO8601()
      .withMessage('Valid date is required')
      .custom((value) => {
        const bookingDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (bookingDate < today) {
          throw new Error('Booking date cannot be in the past');
        }
        
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 90); // 90 days advance booking
        if (bookingDate > maxDate) {
          throw new Error('Booking date cannot be more than 90 days in advance');
        }
        
        return true;
      }),
    
    body('timeSlot.start')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Start time must be in HH:MM format'),
    
    body('timeSlot.end')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('End time must be in HH:MM format')
      .custom((value, { req }) => {
        const startTime = req.body.timeSlot?.start;
        if (startTime && value <= startTime) {
          throw new Error('End time must be after start time');
        }
        return true;
      }),
    
    body('sport')
      .isIn(['badminton', 'tennis', 'football', 'cricket', 'basketball', 'squash', 'table_tennis', 'volleyball'])
      .withMessage('Invalid sport specified')
  ];
};

// Query parameter validation
const paginationRules = () => {
  return [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ];
};

const venueSearchRules = () => {
  return [
    ...paginationRules(),
    
    query('location')
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage('Location must be at least 2 characters'),
    
    query('sport')
      .optional()
      .isIn(['badminton', 'tennis', 'football', 'cricket', 'basketball', 'squash', 'table_tennis', 'volleyball'])
      .withMessage('Invalid sport filter'),
    
    query('minPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Minimum price must be a positive number'),
    
    query('maxPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Maximum price must be a positive number'),
    
    query('sortBy')
      .optional()
      .isIn(['name', 'rating', 'price', 'createdAt'])
      .withMessage('Invalid sort field'),
    
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be asc or desc')
  ];
};

// Parameter validation
const mongoIdRules = (paramName = 'id') => {
  return [
    param(paramName)
      .isMongoId()
      .withMessage(`Valid ${paramName} is required`)
  ];
};

// Password reset validation
const passwordResetRules = () => {
  return [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
  ];
};

// Email verification rules
const emailVerificationRules = () => {
  return [
    body('token')
      .notEmpty()
      .withMessage('Verification token is required')
  ];
};

// Review validation rules
const reviewRules = () => {
  return [
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    
    body('comment')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Comment cannot exceed 500 characters')
  ];
};

module.exports = {
  handleValidationErrors,
  userRegistrationRules,
  userLoginRules,
  userUpdateRules,
  venueCreationRules,
  bookingCreationRules,
  paginationRules,
  venueSearchRules,
  mongoIdRules,
  passwordResetRules,
  emailVerificationRules,
  reviewRules
};

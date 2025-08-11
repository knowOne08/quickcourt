// const express = require('express');require('express-validator');const router = express.Router();const authController = require('../controllers/authController');// Validation middlewareconst authController = require('../controllers/authController');const auth = require('../middleware/auth');ionErrors = (req, res, next) => {dleware/auth');t checkerconst { validateSignup, validateLogin } = require('../middleware/validation');eq);./middleware/validation');, res, next) => {s.isEmpty()) {// Public routestus(400).json({router.post('/signup', validateSignup, authController.signup);map(error => ({router.post('/login', validateLogin, authController.login); error: errors.array()[0].msg,lidateLogin, authController.login); field: error.path,router.post('/logout', authController.logout);   errors: errors.array()thController.logout);   message: error.msg,router.post('/verify-email', authController.verifyEmail);    });il', authController.verifyEmail);      value: error.value// Protected routesrouter.get('/me', auth, authController.getMe);// Test routerouter.get('/test', (req, res) => {  res.json({    success: true,    message: 'Auth routes working'    .isLength({ min: 2, max: 50 })ge: 'Auth routes working'  next();  });ust be between 2 and 50 characters')});module.exports = router;});    .matches(/^[a-zA-Z\s]+$/)module.exports = router;    .withMessage('Name can only contain letters and spaces'),    body('email')RegistrationRules = () => {    .isEmail()    .normalizeEmail()e')    .withMessage('Please provide a valid email address'),    body('password')e between 2 and 50 characters')    .isLength({ min: 6 })    .withMessage('Password must be at least 6 characters long')  .withMessage('Name can only contain letters and spaces'),    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),)    body('role')se provide a valid email address')    .optional()  .normalizeEmail(),    .isIn(['user', 'facility_owner', 'admin'])    .withMessage('Role must be user, facility_owner, or admin'),    body('phoneNumber')haracters long')    .optional()  'Please provide a valid phone number'),e()  .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),  handleValidationErrors];  .optional()// Login validationhone('en-IN')const validateLogin = [e('Please provide a valid Indian phone number'),  body('email')    .isEmail()    .normalizeEmail()  .optional()    .withMessage('Please provide a valid email address'),    .isIn(['user', 'facility_owner'])        .withMessage('Role must be either user or facility_owner')  body('password')    .notEmpty()    .withMessage('Password is required'),  ules = () => {  handleValidationErrors];  .isEmail()module.exports = {Please provide a valid email address')  validateSignup,mail(),  validateLogin,  handleValidationErrorsbody('password')};    .notEmpty()  reviewRules};
const { body, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: errors.array()[0].msg,
      errors: errors.array()
    });
  }
  next();
};

// Signup validation
const validateSignup = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('role')
    .optional()
    .isIn(['user', 'facility_owner', 'admin'])
    .withMessage('Role must be user, facility_owner, or admin'),
  
  handleValidationErrors
];

// Login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Email verification validation
const validateEmailVerification = [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required'),
  
  handleValidationErrors
];

module.exports = {
  validateSignup,
  validateLogin,
  validateEmailVerification
};

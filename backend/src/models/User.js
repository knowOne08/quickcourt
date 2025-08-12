const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'facility_owner', 'admin'],
    default: 'user'
  },
  phoneNumber: {
    type: String,
    sparse: true
  },
  avatar: {
    type: String,
    default: ''
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationCode: {
    type: String
  },
  emailVerificationExpire: {
    type: Date
  },
  favoriteVenues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  }],
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpire: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  passwordChangedAt: {
    type: Date
  },
  refreshTokens: [{
    token: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true
    },
    device: String,
    ipAddress: String
  }],
  loginSessions: [{
    device: String,
    ipAddress: String,
    userAgent: String,
    lastActive: {
      type: Date,
      default: Date.now
    },
    refreshToken: String
  }]
}, {
  timestamps: true
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ emailVerificationCode: 1 });
userSchema.index({ resetPasswordToken: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to generate auth token payload
userSchema.methods.getTokenPayload = function () {
  return {
    userId: this._id,
    email: this.email,
    role: this.role,
    name: this.name
  };
};

// Static method to find by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Remove sensitive data from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.emailVerificationToken;
  delete user.emailVerificationExpires;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  return user;
};

// Add this method to your User schema
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

// Method to generate and store refresh token
userSchema.methods.generateRefreshToken = function(device = 'unknown', ipAddress = 'unknown') {
  const crypto = require('crypto');
  const refreshToken = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  
  // Remove old tokens for this device
  this.refreshTokens = this.refreshTokens.filter(rt => rt.device !== device);
  
  // Add new refresh token
  this.refreshTokens.push({
    token: refreshToken,
    expiresAt,
    device,
    ipAddress
  });
  
  return refreshToken;
};

// Method to validate refresh token
userSchema.methods.validateRefreshToken = function(token) {
  const refreshToken = this.refreshTokens.find(rt => 
    rt.token === token && rt.expiresAt > new Date()
  );
  return refreshToken ? true : false;
};

// Method to remove refresh token (logout)
userSchema.methods.removeRefreshToken = function(token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
};

// Method to remove all refresh tokens (logout from all devices)
userSchema.methods.removeAllRefreshTokens = function() {
  this.refreshTokens = [];
};

// Method to clean expired refresh tokens
userSchema.methods.cleanExpiredTokens = function() {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.expiresAt > new Date());
};

module.exports = mongoose.model('User', userSchema);
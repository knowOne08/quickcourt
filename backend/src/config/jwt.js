const jwt = require('jsonwebtoken');

class JWTService {
  generateToken(payload, options = {}) {
    const defaultOptions = {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m', // Shorter for access tokens
      issuer: 'quickcourt-api'
    };

    return jwt.sign(payload, process.env.JWT_SECRET, { ...defaultOptions, ...options });
  }

  generateRefreshToken(payload) {
    return this.generateToken(payload, { expiresIn: '30d' });
  }

  generateAccessToken(payload) {
    return this.generateToken(payload, { expiresIn: '15m' });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw new Error('Token verification failed');
    }
  }

  decodeToken(token) {
    return jwt.decode(token);
  }

  generatePasswordResetToken(userId) {
    return this.generateToken({ userId, type: 'password-reset' }, { expiresIn: '1h' });
  }

  generateEmailVerificationToken(userId) {
    return this.generateToken({ userId, type: 'email-verification' }, { expiresIn: '24h' });
  }

  // Extract token from request headers
  extractTokenFromRequest(req) {
    let token = null;
    
    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    return token;
  }

  // Generate both access and refresh tokens
  generateTokenPair(payload) {
    const accessToken = this.generateAccessToken(payload);
    const refreshTokenPayload = { ...payload, type: 'refresh' };
    const refreshToken = this.generateRefreshToken(refreshTokenPayload);
    
    return { accessToken, refreshToken };
  }
}

module.exports = new JWTService();

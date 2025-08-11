const jwt = require('jsonwebtoken');

class JWTService {
  generateToken(payload, options = {}) {
    const defaultOptions = {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'quickcourt-api'
    };

    return jwt.sign(payload, process.env.JWT_SECRET, { ...defaultOptions, ...options });
  }

  generateRefreshToken(payload) {
    return this.generateToken(payload, { expiresIn: '30d' });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
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
}

module.exports = new JWTService();

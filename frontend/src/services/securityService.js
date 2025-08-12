// frontend/src/services/securityService.js
import { authService } from './authService';

class SecurityService {
  constructor() {
    this.maxFailedAttempts = 5;
    this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
    this.sessionTimeout = 8 * 60 * 60 * 1000; // 8 hours
  }

  /**
   * Comprehensive user authentication check
   */
  async validateUserAuthentication() {
    try {
      const token = this.getValidToken();
      if (!token) {
        return {
          valid: false,
          reason: 'No valid authentication token found'
        };
      }

      // Verify token with backend
      const user = await authService.getCurrentUser();
      if (!user) {
        return {
          valid: false,
          reason: 'User session is invalid'
        };
      }

      // Check if user account is active
      if (user.status !== 'active') {
        return {
          valid: false,
          reason: 'User account is not active'
        };
      }

      // Check if email is verified (for payment operations)
      if (!user.isEmailVerified) {
        return {
          valid: false,
          reason: 'Email verification required for payments'
        };
      }

      // Check for any account restrictions
      if (user.paymentRestricted) {
        return {
          valid: false,
          reason: 'Payment functionality is restricted for this account'
        };
      }

      return {
        valid: true,
        user,
        reason: 'User authentication validated'
      };
    } catch (error) {
      console.error('User authentication validation error:', error);
      return {
        valid: false,
        reason: 'Authentication validation failed'
      };
    }
  }

  /**
   * Token validation and freshness check
   */
  getValidToken() {
    const token = localStorage.getItem('token') || sessionStorage.getItem('authToken');
    
    if (!token) return null;

    try {
      // Decode and validate JWT
      const payload = this.decodeJWT(token);
      if (!payload) return null;

      // Check expiration (with 5-minute buffer)
      const now = Math.floor(Date.now() / 1000);
      const buffer = 5 * 60; // 5 minutes
      
      if (payload.exp <= (now + buffer)) {
        this.clearAuthData();
        return null;
      }

      // Check if token was issued too long ago (max 24 hours)
      const maxAge = 24 * 60 * 60; // 24 hours
      if ((now - payload.iat) > maxAge) {
        this.clearAuthData();
        return null;
      }

      return token;
    } catch (error) {
      console.error('Token validation error:', error);
      this.clearAuthData();
      return null;
    }
  }

  /**
   * Session validation
   */
  validateSession() {
    try {
      const sessionId = sessionStorage.getItem('sessionId');
      const lastActivity = localStorage.getItem('lastActivity');
      const sessionStart = sessionStorage.getItem('sessionStart');

      if (!sessionId || !lastActivity || !sessionStart) {
        return {
          valid: false,
          reason: 'Session data is incomplete'
        };
      }

      // Check session age
      const sessionAge = Date.now() - parseInt(sessionStart);
      if (sessionAge > this.sessionTimeout) {
        this.clearSessionData();
        return {
          valid: false,
          reason: 'Session has expired'
        };
      }

      // Check activity freshness
      const lastActivityTime = new Date(lastActivity);
      const inactivityPeriod = Date.now() - lastActivityTime.getTime();
      const maxInactivity = 2 * 60 * 60 * 1000; // 2 hours

      if (inactivityPeriod > maxInactivity) {
        return {
          valid: false,
          reason: 'Session inactive for too long'
        };
      }

      return {
        valid: true,
        sessionAge,
        lastActivity: lastActivityTime,
        reason: 'Session is valid'
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return {
        valid: false,
        reason: 'Session validation failed'
      };
    }
  }

  /**
   * Environment security check
   */
  validateEnvironment() {
    const checks = {
      https: window.location.protocol === 'https:' || this.isLocalDevelopment(),
      origin: this.validateOrigin(),
      browserSecurity: this.checkBrowserSecurity(),
      noFraming: window.self === window.top,
      webRTC: this.checkWebRTCLeaks()
    };

    const failedChecks = Object.entries(checks)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    return {
      valid: failedChecks.length === 0,
      checks,
      failedChecks,
      reason: failedChecks.length > 0 ? 
        `Environment security failed: ${failedChecks.join(', ')}` : 
        'Environment is secure'
    };
  }

  /**
   * Device trust validation
   */
  validateDeviceTrust() {
    try {
      const deviceFingerprint = this.generateDeviceFingerprint();
      const trustedDevices = this.getTrustedDevices();
      const suspiciousFeatures = this.detectSuspiciousFeatures();

      return {
        valid: suspiciousFeatures.length === 0,
        deviceFingerprint,
        isKnownDevice: trustedDevices.includes(deviceFingerprint),
        suspiciousFeatures,
        reason: suspiciousFeatures.length > 0 ? 
          `Suspicious features detected: ${suspiciousFeatures.join(', ')}` : 
          'Device appears trustworthy'
      };
    } catch (error) {
      console.error('Device trust validation error:', error);
      return {
        valid: false,
        reason: 'Device trust validation failed'
      };
    }
  }

  /**
   * Rate limiting check
   */
  checkRateLimit(action) {
    try {
      const key = `rateLimit_${action}`;
      const attempts = JSON.parse(localStorage.getItem(key) || '[]');
      const now = Date.now();
      const windowSize = 15 * 60 * 1000; // 15 minutes

      // Clean old attempts
      const recentAttempts = attempts.filter(time => (now - time) < windowSize);

      // Check limits based on action
      let maxAttempts;
      switch (action) {
        case 'payment_create':
          maxAttempts = 5;
          break;
        case 'payment_verify':
          maxAttempts = 10;
          break;
        case 'login':
          maxAttempts = 5;
          break;
        default:
          maxAttempts = 3;
      }

      if (recentAttempts.length >= maxAttempts) {
        return {
          allowed: false,
          remainingAttempts: 0,
          retryAfter: Math.max(...recentAttempts) + windowSize - now,
          reason: `Rate limit exceeded for ${action}`
        };
      }

      // Add current attempt
      recentAttempts.push(now);
      localStorage.setItem(key, JSON.stringify(recentAttempts));

      return {
        allowed: true,
        remainingAttempts: maxAttempts - recentAttempts.length,
        reason: 'Rate limit check passed'
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      return {
        allowed: false,
        reason: 'Rate limit check failed'
      };
    }
  }

  /**
   * Comprehensive security validation for payments
   */
  async validatePaymentSecurity(amount) {
    const results = {
      authentication: await this.validateUserAuthentication(),
      session: this.validateSession(),
      environment: this.validateEnvironment(),
      deviceTrust: this.validateDeviceTrust(),
      rateLimit: this.checkRateLimit('payment_create'),
      amount: this.validateAmount(amount)
    };

    const failedChecks = Object.entries(results)
      .filter(([key, result]) => !result.valid && !result.allowed)
      .map(([key, result]) => ({ check: key, reason: result.reason }));

    return {
      valid: failedChecks.length === 0,
      results,
      failedChecks,
      summary: failedChecks.length > 0 ? 
        `Security validation failed: ${failedChecks.map(f => f.check).join(', ')}` : 
        'All security checks passed'
    };
  }

  // Helper methods
  decodeJWT(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  isLocalDevelopment() {
    return ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);
  }

  validateOrigin() {
    const allowedOrigins = [
      'https://quickcourt.com',
      'https://www.quickcourt.com',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
    return allowedOrigins.includes(window.location.origin);
  }

  checkBrowserSecurity() {
    return !(
      window.navigator.webdriver || // Automated browsers
      window.callPhantom || // PhantomJS
      window._phantom || // PhantomJS
      window.Buffer // Node.js environment
    );
  }

  checkWebRTCLeaks() {
    // Basic WebRTC leak detection (simplified)
    return !window.RTCPeerConnection || 
           typeof window.RTCPeerConnection !== 'function';
  }

  generateDeviceFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Security fingerprint', 2, 2);

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');

    return this.simpleHash(fingerprint);
  }

  getTrustedDevices() {
    try {
      return JSON.parse(localStorage.getItem('trustedDevices') || '[]');
    } catch {
      return [];
    }
  }

  detectSuspiciousFeatures() {
    const suspicious = [];

    if (window.navigator.webdriver) suspicious.push('automation_detected');
    if (window.outerWidth === 0 || window.outerHeight === 0) suspicious.push('invalid_viewport');
    if (window.screen.width < 100 || window.screen.height < 100) suspicious.push('unusual_screen');
    
    const failedAttempts = parseInt(sessionStorage.getItem('paymentFailedAttempts') || '0');
    if (failedAttempts > 3) suspicious.push('multiple_failures');

    return suspicious;
  }

  validateAmount(amount) {
    const numAmount = parseFloat(amount);
    const valid = numAmount > 0 && numAmount <= 100000 && !isNaN(numAmount);
    
    return {
      valid,
      amount: numAmount,
      reason: valid ? 'Amount is valid' : 'Invalid amount range (1-100000)'
    };
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  clearAuthData() {
    localStorage.removeItem('token');
    sessionStorage.removeItem('authToken');
    localStorage.removeItem('lastActivity');
  }

  clearSessionData() {
    sessionStorage.removeItem('sessionId');
    sessionStorage.removeItem('sessionStart');
    sessionStorage.removeItem('paymentSession');
  }

  updateActivity() {
    localStorage.setItem('lastActivity', new Date().toISOString());
  }

  addTrustedDevice() {
    try {
      const fingerprint = this.generateDeviceFingerprint();
      const trusted = this.getTrustedDevices();
      
      if (!trusted.includes(fingerprint)) {
        trusted.push(fingerprint);
        if (trusted.length > 5) trusted.shift(); // Keep only 5 most recent
        localStorage.setItem('trustedDevices', JSON.stringify(trusted));
      }
    } catch (error) {
      console.error('Add trusted device error:', error);
    }
  }
}

export const securityService = new SecurityService();

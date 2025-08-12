const User = require('../models/User');
const logger = require('./logger');

class SessionManager {
  constructor() {
    this.activeTokens = new Map(); // In-memory token store for blacklisting
  }

  // Add token to blacklist (for logout)
  blacklistToken(token) {
    if (token) {
      this.activeTokens.set(token, { blacklisted: true, timestamp: Date.now() });
      logger.info(`Token blacklisted: ${token.substring(0, 10)}...`);
    }
  }

  // Check if token is blacklisted
  isTokenBlacklisted(token) {
    return this.activeTokens.has(token) && this.activeTokens.get(token).blacklisted;
  }

  // Clean expired blacklisted tokens (should be called periodically)
  cleanExpiredTokens() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [token, data] of this.activeTokens.entries()) {
      if (now - data.timestamp > maxAge) {
        this.activeTokens.delete(token);
      }
    }
  }

  // Get user session info
  async getUserSessions(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return null;
      }

      // Filter out expired refresh tokens
      const activeSessions = user.refreshTokens.filter(rt => rt.expiresAt > new Date());
      
      return activeSessions.map(session => ({
        device: session.device || 'Unknown Device',
        ipAddress: session.ipAddress || 'Unknown IP',
        createdAt: session.createdAt,
        lastActive: session.lastActive || session.createdAt,
        isCurrentSession: false // This would need to be determined by comparing with current request
      }));
    } catch (error) {
      logger.error(`Error fetching user sessions: ${error.message}`);
      return null;
    }
  }

  // Terminate specific session
  async terminateSession(userId, sessionId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return false;
      }

      // Remove the specific refresh token
      const initialLength = user.refreshTokens.length;
      user.refreshTokens = user.refreshTokens.filter(rt => rt._id.toString() !== sessionId);
      
      if (user.refreshTokens.length < initialLength) {
        await user.save({ validateBeforeSave: false });
        logger.info(`Session terminated for user ${userId}: ${sessionId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error(`Error terminating session: ${error.message}`);
      return false;
    }
  }

  // Terminate all sessions except current
  async terminateOtherSessions(userId, currentRefreshToken) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return false;
      }

      // Keep only the current refresh token
      if (currentRefreshToken) {
        user.refreshTokens = user.refreshTokens.filter(rt => rt.token === currentRefreshToken);
      } else {
        user.refreshTokens = [];
      }

      await user.save({ validateBeforeSave: false });
      logger.info(`Other sessions terminated for user ${userId}`);
      return true;
    } catch (error) {
      logger.error(`Error terminating other sessions: ${error.message}`);
      return false;
    }
  }

  // Clean expired sessions for all users (should be run periodically)
  async cleanExpiredSessions() {
    try {
      const result = await User.updateMany(
        {},
        {
          $pull: {
            refreshTokens: {
              expiresAt: { $lt: new Date() }
            }
          }
        }
      );

      logger.info(`Cleaned expired sessions: ${result.modifiedCount} users updated`);
      return result.modifiedCount;
    } catch (error) {
      logger.error(`Error cleaning expired sessions: ${error.message}`);
      return 0;
    }
  }

  // Get session statistics
  async getSessionStats() {
    try {
      const stats = await User.aggregate([
        {
          $match: { isActive: true }
        },
        {
          $project: {
            activeSessionsCount: {
              $size: {
                $filter: {
                  input: '$refreshTokens',
                  cond: { $gt: ['$$this.expiresAt', new Date()] }
                }
              }
            }
          }
        },
        {
          $group: {
            _id: null,
            totalActiveUsers: { $sum: 1 },
            totalActiveSessions: { $sum: '$activeSessionsCount' },
            avgSessionsPerUser: { $avg: '$activeSessionsCount' }
          }
        }
      ]);

      return stats[0] || {
        totalActiveUsers: 0,
        totalActiveSessions: 0,
        avgSessionsPerUser: 0
      };
    } catch (error) {
      logger.error(`Error getting session stats: ${error.message}`);
      return null;
    }
  }

  // Monitor suspicious activity
  async detectSuspiciousActivity(userId, newSession) {
    try {
      const user = await User.findById(userId);
      if (!user || user.refreshTokens.length === 0) {
        return { suspicious: false };
      }

      const recentSessions = user.refreshTokens.filter(
        rt => rt.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      );

      // Check for unusual number of sessions
      if (recentSessions.length > 5) {
        return {
          suspicious: true,
          reason: 'Too many sessions created in 24 hours',
          count: recentSessions.length
        };
      }

      // Check for sessions from different geographical locations
      const uniqueIPs = new Set(recentSessions.map(s => s.ipAddress));
      if (uniqueIPs.size > 3) {
        return {
          suspicious: true,
          reason: 'Sessions from multiple IP addresses',
          ipCount: uniqueIPs.size
        };
      }

      // Check for rapid session creation
      const recentSessionsLast5Min = recentSessions.filter(
        rt => rt.createdAt > new Date(Date.now() - 5 * 60 * 1000)
      );
      
      if (recentSessionsLast5Min.length > 2) {
        return {
          suspicious: true,
          reason: 'Multiple sessions created within 5 minutes',
          count: recentSessionsLast5Min.length
        };
      }

      return { suspicious: false };
    } catch (error) {
      logger.error(`Error detecting suspicious activity: ${error.message}`);
      return { suspicious: false, error: error.message };
    }
  }

  // Initialize periodic cleanup
  initPeriodicCleanup() {
    // Clean expired tokens every hour
    setInterval(() => {
      this.cleanExpiredTokens();
      this.cleanExpiredSessions();
    }, 60 * 60 * 1000); // 1 hour

    logger.info('Session cleanup scheduler initialized');
  }
}

module.exports = new SessionManager();

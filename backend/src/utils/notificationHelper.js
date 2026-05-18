// backend/src/utils/notificationHelper.js
const Notification = require('../models/Notification');
const logger = require('./logger');

/**
 * Create a notification for a user
 * @param {Object} params
 * @param {String} params.recipient - User ID of the recipient
 * @param {String} params.sender - User ID of the sender (optional)
 * @param {String} params.type - Notification type
 * @param {String} params.title - Notification title
 * @param {String} params.message - Notification message
 * @param {Object} params.data - Additional data (teamId, bookingId, venueId)
 */
const createNotification = async ({
  recipient,
  sender,
  type,
  title,
  message,
  data = {}
}) => {
  try {
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      data
    });
    
    // In a real app, you might emit a socket.io event here for real-time notifications
    // io.to(recipient.toString()).emit('newNotification', notification);
    
    return notification;
  } catch (error) {
    logger.error(`Error creating notification: ${error.message}`);
    // Don't throw error to avoid breaking the main flow
    return null;
  }
};

module.exports = {
  createNotification
};

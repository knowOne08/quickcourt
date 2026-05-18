// backend/src/utils/constants.js
module.exports = {
  COMMISSION_RATE: 0.10, // 10% platform fee
  ROLES: {
    ADMIN: 'admin',
    OWNER: 'facility_owner',
    USER: 'user'
  },
  BOOKING_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed'
  },
  PAYMENT_STATUS: {
    PENDING: 'pending',
    PAID: 'paid',
    FAILED: 'failed',
    REFUNDED: 'refunded'
  }
};

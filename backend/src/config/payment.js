const crypto = require('crypto');
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    this.razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    this.razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
  }

  generateOrderId() {
    return 'order_' + crypto.randomBytes(12).toString('hex');
  }

  generateTransactionId() {
    return 'txn_' + crypto.randomBytes(16).toString('hex');
  }

  createRazorpayOrder(amount, currency = 'INR', receipt) {
    // In a real implementation, this would use the Razorpay SDK
    // For now, we'll simulate the order creation
    const order = {
      id: this.generateOrderId(),
      entity: 'order',
      amount: amount * 100, // Razorpay expects amount in paise
      amount_paid: 0,
      amount_due: amount * 100,
      currency: currency,
      receipt: receipt,
      status: 'created',
      attempts: 0,
      created_at: Math.floor(Date.now() / 1000)
    };

    logger.info('Razorpay order created:', order.id);
    return order;
  }

  verifyRazorpaySignature(orderId, paymentId, signature) {
    try {
      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', this.razorpayKeySecret)
        .update(body.toString())
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      logger.error('Signature verification failed:', error);
      return false;
    }
  }

  calculateRefundAmount(originalAmount, cancellationPolicy = 'flexible') {
    switch (cancellationPolicy) {
      case 'strict':
        return 0; // No refund
      case 'moderate':
        return originalAmount * 0.5; // 50% refund
      case 'flexible':
        return originalAmount * 0.9; // 90% refund (10% processing fee)
      default:
        return originalAmount * 0.8; // 80% refund
    }
  }

  processRefund(paymentId, amount, reason = 'Customer request') {
    // In a real implementation, this would use the Razorpay SDK
    // For now, we'll simulate the refund process
    const refund = {
      id: 'rfnd_' + crypto.randomBytes(12).toString('hex'),
      entity: 'refund',
      amount: amount * 100,
      currency: 'INR',
      payment_id: paymentId,
      receipt: null,
      status: 'processed',
      speed_requested: 'normal',
      speed_processed: 'normal',
      created_at: Math.floor(Date.now() / 1000)
    };

    logger.info('Refund processed:', refund.id);
    return refund;
  }

  generatePaymentLink(amount, description, customerInfo) {
    // Simulate payment link generation
    const linkId = 'plink_' + crypto.randomBytes(12).toString('hex');
    const paymentLink = {
      id: linkId,
      amount: amount * 100,
      currency: 'INR',
      description: description,
      customer: customerInfo,
      short_url: `https://rzp.io/${linkId}`,
      status: 'created',
      created_at: Math.floor(Date.now() / 1000),
      expire_by: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    return paymentLink;
  }

  validateWebhookSignature(payload, signature, secret) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      logger.error('Webhook signature validation failed:', error);
      return false;
    }
  }

  getPaymentStatus(paymentId) {
    // In a real implementation, this would fetch from Razorpay
    // For now, we'll simulate payment status
    return {
      id: paymentId,
      entity: 'payment',
      status: 'captured',
      amount: 50000, // Amount in paise
      currency: 'INR',
      method: 'card',
      captured: true,
      created_at: Math.floor(Date.now() / 1000)
    };
  }

  formatAmount(amount, currency = 'INR') {
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
      }).format(amount);
    }
    return amount.toString();
  }
}

module.exports = new PaymentService();

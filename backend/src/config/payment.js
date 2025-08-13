const crypto = require('crypto');
const logger = require('../utils/logger');

class PaymentService {
  constructor() {
    this.stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    this.stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  }

  generateOrderId() {
    return 'order_' + crypto.randomBytes(12).toString('hex');
  }

  generateTransactionId() {
    return 'txn_' + crypto.randomBytes(16).toString('hex');
  }

  createStripePaymentIntent(amount, currency = 'usd', metadata = {}) {
    // This method will be used by the payment controller
    // The actual Stripe integration is handled in the controller
    const paymentIntent = {
      id: 'pi_' + crypto.randomBytes(12).toString('hex'),
      amount: Math.round(amount * 100), // Amount in smallest currency unit
      currency: currency.toLowerCase(),
      status: 'requires_payment_method',
      client_secret: 'pi_' + crypto.randomBytes(12).toString('hex') + '_secret_' + crypto.randomBytes(24).toString('hex'),
      metadata: metadata,
      created: Math.floor(Date.now() / 1000)
    };

    logger.info('Stripe payment intent created:', paymentIntent.id);
    return paymentIntent;
  }

  verifyStripePayment(paymentIntentId, amount) {
    try {
      // In a real implementation, this would verify with Stripe API
      // For now, we'll simulate the verification
      const isValid = paymentIntentId && amount > 0;
      
      if (isValid) {
        logger.info('Stripe payment verified:', paymentIntentId);
      } else {
        logger.warn('Stripe payment verification failed:', paymentIntentId);
      }
      
      return isValid;
    } catch (error) {
      logger.error('Stripe payment verification error:', error);
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

  processRefund(paymentIntentId, amount, reason = 'Customer request') {
    // In a real implementation, this would use the Stripe SDK
    // For now, we'll simulate the refund process
    const refund = {
      id: 're_' + crypto.randomBytes(12).toString('hex'),
      object: 'refund',
      amount: Math.round(amount * 100),
      currency: 'usd',
      payment_intent: paymentIntentId,
      status: 'succeeded',
      reason: reason,
      created: Math.floor(Date.now() / 1000)
    };

    logger.info('Stripe refund processed:', refund.id);
    return refund;
  }

  generatePaymentLink(amount, description, customerInfo) {
    // Simulate Stripe payment link generation
    const linkId = 'plink_' + crypto.randomBytes(12).toString('hex');
    const paymentLink = {
      id: linkId,
      amount: Math.round(amount * 100),
      currency: 'usd',
      description: description,
      customer: customerInfo,
      url: `https://checkout.stripe.com/pay/${linkId}`,
      status: 'active',
      created: Math.floor(Date.now() / 1000),
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
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

  getPaymentStatus(paymentIntentId) {
    // In a real implementation, this would fetch from Stripe
    // For now, we'll simulate payment status
    return {
      id: paymentIntentId,
      object: 'payment_intent',
      status: 'succeeded',
      amount: 50000, // Amount in smallest currency unit
      currency: 'usd',
      payment_method_types: ['card'],
      created: Math.floor(Date.now() / 1000)
    };
  }

  formatAmount(amount, currency = 'usd') {
    const currencyUpper = currency.toUpperCase();
    if (currencyUpper === 'usd') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'usd'
      }).format(amount);
    } else if (currencyUpper === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'usd'
      }).format(amount);
    }
    return amount.toString();
  }
}

module.exports = new PaymentService();

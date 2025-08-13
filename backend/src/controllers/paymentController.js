// src/controllers/paymentController.js

const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Court = require('../models/Court');
const stripe = require('stripe');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Initialize Stripe client, checking for the secret key.
const stripeClient = process.env.STRIPE_SECRET_KEY ? stripe(process.env.STRIPE_SECRET_KEY) : null;

if (!stripeClient) {
  logger.error('Stripe secret key not configured. Payment functionality will be disabled.');
}

// --- Validation and Sanitization Helpers ---
const validateAmount = (amount) => {
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount > 0 && numAmount <= 100000;
};
const validateCurrency = (currency) => ['usd'].includes(currency.toLowerCase());
const sanitizeDescription = (description) => description.replace(/[<>]/g, '').substring(0, 350);

// --- Rate Limiters for Export ---
exports.paymentCreateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: { status: 'error', message: 'Too many payment attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
exports.paymentVerifyLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  message: { status: 'error', message: 'Too many verification attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// --- Core Payment Flows ---
exports.createPaymentOrder = async (req, res) => {
  try {
    // 1. Data Validation and User Check
    if (!req.user || !req.user.id) {
      logger.error('Authentication error: User not found on request in createPaymentOrder.');
      return res.status(401).json({ status: 'error', message: 'Authentication error. Please log in again.' });
    }
    const userId = req.user.id;

    let { bookingId, amount, currency = 'usd', venue, court, date, startTime, endTime, duration, venueName, courtName } = req.body;

    if (!validateAmount(amount)) return res.status(400).json({ status: 'error', message: 'Invalid amount provided.' });
    if (!validateCurrency(currency)) return res.status(400).json({ status: 'error', message: 'Invalid currency specified.' });
    if (!stripeClient) return res.status(503).json({ status: 'error', message: 'Payment service is currently unavailable.' });

    const bookingDate = new Date(date);
    if (isNaN(bookingDate.getTime())) {
        return res.status(400).json({ status: 'error', message: 'Invalid date format provided.' });
    }

    // 2. Booking Creation
    let booking;
    try {
        booking = new Booking({ user: userId, venue, court, date: bookingDate, startTime, endTime, duration, totalAmount: amount, status: 'pending' });
        await booking.save();
        bookingId = booking._id; // Use the newly created booking's ID
    } catch (dbError) {
        logger.error('Database error during booking creation:', dbError);
        return res.status(500).json({ status: 'error', message: 'Failed to save booking details.' });
    }
    
    // 3. Stripe Payment Intent Creation
    let paymentIntent;
    try {
        paymentIntent = await stripeClient.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: currency.toLowerCase(),
          description: sanitizeDescription(`Booking for ${venueName} - ${courtName}`),
          metadata: { bookingId: bookingId.toString(), userId: userId.toString() }
        });
    } catch (stripeError) {
        logger.error('Stripe API error during payment intent creation:', stripeError);
        return res.status(500).json({ status: 'error', message: 'Failed to communicate with payment provider.' });
    }

    // 4. Local Payment Record Creation
    try {
        const existingPayment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });
        if (existingPayment) {
            logger.warn(`Attempted to create a duplicate payment record for intent: ${paymentIntent.id}`);
            return res.status(409).json({ status: 'error', message: 'Payment record already exists.' });
        }
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
        const orderId = `ORD-${timestamp}-${randomString}`;

        await Payment.create({
          user: userId,
          booking: bookingId,
          orderId: orderId, // FIX: Provide the unique bookingId as the orderId
          amount,
          currency: currency.toLowerCase(),
          stripePaymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret, // This was the missing field
          status: 'pending' 
        });
    } catch (dbError) {
      logger.error('Database error during payment record creation:', dbError);
      
      return res.status(500).json({ 
          status: 'error', 
          message: 'Failed to save payment record.',
          // Also, send more detailed error info in development
          ...(process.env.NODE_ENV === 'development' && { errorDetail: dbError.message })
      });
  }

  res.status(201).json({ status: 'success', data: { paymentIntent, bookingId: bookingId.toString() } });

} catch (error) {
  logger.error('Unhandled error in createPaymentOrder:', error);
  res.status(500).json({ status: 'error', message: 'An unexpected error occurred.' });
}
};

exports.verifyPayment = async (req, res) => {
  const { payment_intent_id } = req.body;
  const userId = req.user.id;

  if (!payment_intent_id) {
    return res.status(400).json({ status: 'error', message: 'Payment Intent ID is required.' });
  }

  const session = await Payment.startSession();
  try {
    await session.withTransaction(async () => {
      const payment = await Payment.findOne({ stripePaymentIntentId: payment_intent_id, user: userId }).session(session);
      if (!payment) {
        throw new Error('Payment record not found or unauthorized.');
      }
      if (payment.status === 'completed') {
        // This is not an error, just idempotent.
        return; 
      }

      const paymentIntent = await stripeClient.paymentIntents.retrieve(payment_intent_id);
      if (paymentIntent.status !== 'succeeded') {
        throw new Error('Payment not successful on Stripe.');
      }

      payment.status = 'completed';
      payment.paidAt = new Date();
      await payment.save({ session });

      await Booking.findByIdAndUpdate(payment.booking, { status: 'confirmed', paymentStatus: 'paid' }, { session });
    });

    res.status(200).json({ status: 'success', message: 'Payment verified successfully.' });
  } catch (error) {
    logger.error(`Payment verification failed for intent ${payment_intent_id}:`, error);
    res.status(500).json({ status: 'error', message: error.message || 'Payment verification failed.' });
  } finally {
    session.endSession();
  }
};

// --- User-Facing Data Retrieval ---
exports.getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { user: req.user.id };
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .populate({ path: 'booking', select: 'venue court date startTime' })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);
    res.status(200).json({ status: 'success', data: { payments, totalPages: Math.ceil(total / limit), currentPage: parseInt(page) } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to retrieve payment history.' });
  }
};

exports.getPaymentDetails = async (req, res) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.paymentId, user: req.user.id }).populate('booking user');
    if (!payment) {
      return res.status(404).json({ status: 'error', message: 'Payment not found.' });
    }
    res.status(200).json({ status: 'success', data: { payment } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to retrieve payment details.' });
  }
};

exports.getWalletBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ status: 'success', data: { balance: user.walletBalance || 0 } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to retrieve wallet balance.' });
  }
};

exports.calculateBookingPrice = async (req, res) => {
  try {
    const { courtId, duration } = req.body;
    const court = await Court.findById(courtId);
    if (!court) return res.status(404).json({ status: 'error', message: 'Court not found.' });

    const hours = duration / 60;
    const basePrice = court.pricePerHour * hours;
    const platformFee = basePrice * 0.05; // 5%
    const tax = (basePrice + platformFee) * 0.18; // 18%
    const totalAmount = basePrice + platformFee + tax;

    res.status(200).json({ status: 'success', data: { basePrice, platformFee, tax, totalAmount } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to calculate price.' });
  }
};

exports.getPlatformFees = async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: { bookingFeePercent: 5, taxPercent: 18 }
  });
};

// --- Refunds ---
exports.initiateRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reason } = req.body;
    const payment = await Payment.findOne({ _id: paymentId, user: req.user.id });

    if (!payment) return res.status(404).json({ status: 'error', message: 'Payment not found.' });
    if (payment.status !== 'completed') return res.status(400).json({ status: 'error', message: 'Only completed payments can be refunded.' });

    const refund = await stripeClient.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      reason: reason || 'requested_by_customer',
    });

    payment.status = 'refunded';
    payment.refund = { refundId: refund.id, reason: refund.reason, status: refund.status };
    await payment.save();

    res.status(200).json({ status: 'success', data: { refund } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message || 'Failed to initiate refund.' });
  }
};

exports.getRefundStatus = async (req, res) => {
  try {
    const { refundId } = req.params;
    const refund = await stripeClient.refunds.retrieve(refundId);
    res.status(200).json({ status: 'success', data: { refund } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to get refund status.' });
  }
};

// --- Wallet ---
exports.addMoneyToWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;
    if (!validateAmount(amount)) return res.status(400).json({ status: 'error', message: 'Invalid amount.' });

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      description: `Wallet top-up for user ${userId}`,
      metadata: { type: 'wallet_topup', userId }
    });
    res.status(201).json({ status: 'success', data: { paymentIntent } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to add money to wallet.' });
  }
};

// --- Admin Functions ---
exports.getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, ...query } = req.query;
    const payments = await Payment.find(query).populate('user', 'name email').sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit);
    const total = await Payment.countDocuments(query);
    res.status(200).json({ status: 'success', data: { payments, totalPages: Math.ceil(total / limit), currentPage: parseInt(page) } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to retrieve payments.' });
  }
};

exports.processRefund = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;
    const payment = await Payment.findById(paymentId);
    if (!payment) return res.status(404).json({ status: 'error', message: 'Payment not found.' });

    const refundAmount = amount ? Math.round(amount * 100) : undefined; // Full refund if amount not specified
    const refund = await stripeClient.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      amount: refundAmount,
      reason: reason || 'requested_by_customer',
    });

    payment.status = 'refunded';
    payment.refund = { refundId: refund.id, amount: refund.amount / 100, reason: refund.reason, status: refund.status };
    await payment.save();

    res.status(200).json({ status: 'success', data: { refund } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message || 'Failed to process refund.' });
  }
};

exports.getPaymentAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    let startDate = new Date();
    if (period === '7d') startDate.setDate(startDate.getDate() - 7);
    else if (period === '90d') startDate.setDate(startDate.getDate() - 90);
    else startDate.setDate(startDate.getDate() - 30);

    const analytics = await Payment.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' }, totalTransactions: { $sum: 1 } } }
    ]);
    res.status(200).json({ status: 'success', data: analytics[0] || { totalRevenue: 0, totalTransactions: 0 } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to get payment analytics.' });
  }
};

exports.getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ status: 'error', message: 'Start and end dates are required.' });

    const report = await Payment.aggregate([
      { $match: { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }, status: 'completed' } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, dailyRevenue: { $sum: '$amount' } } },
      { $sort: { _id: 1 } }
    ]);
    res.status(200).json({ status: 'success', data: report });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to generate revenue report.' });
  }
};

// --- Webhooks ---
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !webhookSecret) return res.status(400).send('Webhook Error: Missing signature or secret.');

  let event;
  try {
    // Use the raw request body for verification
    event = stripeClient.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const session = await Payment.startSession();
  try {
    await session.withTransaction(async () => {
      switch (event.type) {
        // FIX: Add a case to handle the 'payment_intent.created' event to avoid "unhandled" logs.
        case 'payment_intent.created':
          logger.info(`Webhook received and acknowledged: Payment intent ${event.data.object.id} was created.`);
          break;
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id }).session(session);
          if (payment && payment.status !== 'completed') {
            payment.status = 'completed';
            payment.paidAt = new Date();
            await payment.save({ session });
            await Booking.findByIdAndUpdate(payment.booking, { status: 'confirmed', paymentStatus: 'paid' }, { session });
            logger.info(`Webhook processed: Payment ${paymentIntent.id} succeeded.`);
          }
          break;
        // Add other cases like payment_intent.payment_failed if needed
        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }
    });
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error(`Webhook processing error: ${error.message}`);
    res.status(500).json({ error: 'Webhook processing failed.' });
  } finally {
    session.endSession();
  }
};

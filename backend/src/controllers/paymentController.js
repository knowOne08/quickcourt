const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Security: Rate limiting for payment creation
const paymentCreateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 payment requests per windowMs
  message: {
    status: 'error',
    message: 'Too many payment attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security: Rate limiting for payment verification
const paymentVerifyLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 verify requests per windowMs
  message: {
    status: 'error',
    message: 'Too many verification attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Initialize Razorpay with environment validation
const initializeRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured');
  }
  
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const razorpay = initializeRazorpay();

// Security: Input validation helpers
const validateAmount = (amount) => {
  const numAmount = parseFloat(amount);
  return numAmount > 0 && numAmount <= 100000 && !isNaN(numAmount);
};

const validateCurrency = (currency) => {
  const allowedCurrencies = ['INR', 'USD'];
  return allowedCurrencies.includes(currency);
};

const sanitizeReceipt = (receipt) => {
  return receipt.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 40);
};

exports.createPaymentOrder = async (req, res) => {
  try {
    const { bookingId, amount, currency = 'INR' } = req.body;
    const userId = req.user.id;

    // Security: Input validation
    if (!validateAmount(amount)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid amount. Amount must be between 1 and 100000.'
      });
    }

    if (!validateCurrency(currency)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid currency. Only INR and USD are supported.'
      });
    }

    // Security: Verify booking ownership and status
    const booking = await Booking.findById(bookingId).populate('user');
    if (!booking) {
      logger.warn(`Payment attempt for non-existent booking: ${bookingId} by user: ${userId}`);
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    if (booking.user._id.toString() !== userId) {
      logger.warn(`Unauthorized payment attempt for booking: ${bookingId} by user: ${userId}`);
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to create payment for this booking'
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Booking is not in pending status'
      });
    }

    // Security: Check for duplicate payments
    const existingPayment = await Payment.findOne({
      booking: bookingId,
      status: { $in: ['pending', 'completed'] }
    });

    if (existingPayment) {
      return res.status(400).json({
        status: 'error',
        message: 'Payment already exists for this booking'
      });
    }

    // Security: Verify amount matches booking total
    const calculatedAmount = booking.totalAmount || amount;
    if (Math.abs(amount - calculatedAmount) > 0.01) {
      logger.warn(`Amount mismatch for booking: ${bookingId}. Expected: ${calculatedAmount}, Received: ${amount}`);
      return res.status(400).json({
        status: 'error',
        message: 'Amount does not match booking total'
      });
    }

    const receipt = sanitizeReceipt(`booking_${bookingId}_${Date.now()}`);
    
    const options = {
      amount: Math.round(amount * 100), // Amount in paise, rounded to avoid floating point issues
      currency,
      receipt,
      payment_capture: 1,
      notes: {
        bookingId: bookingId.toString(),
        userId: userId.toString(),
        timestamp: Date.now().toString()
      }
    };

    const order = await razorpay.orders.create(options);

    // Create payment record with security metadata
    const payment = await Payment.create({
      user: userId,
      booking: bookingId,
      amount,
      currency,
      orderId: order.id,
      status: 'pending',
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        createdAt: new Date()
      }
    });

    logger.info(`Payment order created: ${order.id} for booking: ${bookingId} by user: ${userId}`);

    res.status(201).json({
      status: 'success',
      data: {
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt
        },
        payment: {
          id: payment._id,
          orderId: payment.orderId,
          amount: payment.amount,
          currency: payment.currency
        }
      }
    });
  } catch (error) {
    logger.error('Payment order creation failed:', error);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create payment order. Please try again.'
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      bookingId 
    } = req.body;
    const userId = req.user.id;

    // Security: Input validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required payment verification parameters'
      });
    }

    // Security: Find payment and verify ownership
    const payment = await Payment.findOne({ 
      orderId: razorpay_order_id,
      user: userId 
    }).populate('booking');

    if (!payment) {
      logger.warn(`Payment verification failed - payment not found: ${razorpay_order_id} by user: ${userId}`);
      return res.status(404).json({
        status: 'error',
        message: 'Payment record not found'
      });
    }

    // Security: Check if payment is already processed
    if (payment.status === 'completed') {
      return res.status(400).json({
        status: 'error',
        message: 'Payment already processed'
      });
    }

    // Security: Verify payment within time window (30 minutes)
    const paymentCreatedAt = new Date(payment.createdAt);
    const now = new Date();
    const timeDifference = (now - paymentCreatedAt) / 1000 / 60; // in minutes

    if (timeDifference > 30) {
      await Payment.findByIdAndUpdate(payment._id, { 
        status: 'expired',
        notes: 'Payment verification expired' 
      });
      
      return res.status(400).json({
        status: 'error',
        message: 'Payment verification window expired'
      });
    }

    // Security: Verify Razorpay signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      logger.error(`Payment signature verification failed: ${razorpay_order_id} by user: ${userId}`);
      
      // Mark payment as failed
      await Payment.findByIdAndUpdate(payment._id, { 
        status: 'failed',
        failureReason: 'Invalid signature',
        metadata: {
          ...payment.metadata,
          verificationAttemptedAt: new Date(),
          failureDetails: 'Signature mismatch'
        }
      });

      return res.status(400).json({
        status: 'error',
        message: 'Payment verification failed - invalid signature'
      });
    }

    // Security: Verify payment amount with Razorpay
    try {
      const razorpayPayment = await razorpay.payments.fetch(razorpay_payment_id);
      
      if (razorpayPayment.amount !== payment.amount * 100) {
        logger.error(`Payment amount mismatch: Expected ${payment.amount * 100}, Got ${razorpayPayment.amount}`);
        
        await Payment.findByIdAndUpdate(payment._id, { 
          status: 'failed',
          failureReason: 'Amount mismatch' 
        });

        return res.status(400).json({
          status: 'error',
          message: 'Payment verification failed - amount mismatch'
        });
      }

      if (razorpayPayment.status !== 'captured') {
        await Payment.findByIdAndUpdate(payment._id, { 
          status: 'failed',
          failureReason: 'Payment not captured' 
        });

        return res.status(400).json({
          status: 'error',
          message: 'Payment not completed successfully'
        });
      }
    } catch (razorpayError) {
      logger.error('Failed to verify payment with Razorpay:', razorpayError);
      return res.status(400).json({
        status: 'error',
        message: 'Payment verification failed - unable to confirm with payment gateway'
      });
    }

    // All validations passed - update payment and booking
    const session = await Payment.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Update payment
        await Payment.findByIdAndUpdate(payment._id, {
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
          status: 'completed',
          paidAt: new Date(),
          metadata: {
            ...payment.metadata,
            verifiedAt: new Date(),
            verificationIp: req.ip,
            verificationUserAgent: req.get('User-Agent')
          }
        }, { session });

        // Update booking status
        await Booking.findByIdAndUpdate(payment.booking._id, { 
          status: 'confirmed',
          paymentStatus: 'paid',
          paidAt: new Date()
        }, { session });
      });

      logger.info(`Payment verified successfully: ${razorpay_payment_id} for booking: ${payment.booking._id}`);

      res.status(200).json({
        status: 'success',
        message: 'Payment verified successfully',
        data: { 
          paymentId: razorpay_payment_id,
          bookingId: payment.booking._id,
          amount: payment.amount,
          status: 'completed'
        }
      });

    } catch (transactionError) {
      logger.error('Payment verification transaction failed:', transactionError);
      throw transactionError;
    } finally {
      await session.endSession();
    }

  } catch (error) {
    logger.error('Payment verification error:', error);
    res.status(400).json({
      status: 'error',
      message: 'Payment verification failed. Please contact support.'
    });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { user: userId };
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .populate('booking', 'venue court date startTime endTime')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        payments,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getPaymentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const payment = await Payment.findById(id)
      .populate('booking')
      .populate('user', 'name email');

    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }

    if (payment.user._id.toString() !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { payment }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.initiateRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;
    const userId = req.user.id;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }

    if (payment.user.toString() !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized'
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        status: 'error',
        message: 'Can only refund completed payments'
      });
    }

    const refund = await razorpay.payments.refund(payment.paymentId, {
      amount: amount * 100,
      speed: 'normal',
      receipt: `refund_${payment._id}_${Date.now()}`
    });

    payment.refund = {
      refundId: refund.id,
      amount,
      reason,
      status: 'processing',
      initiatedAt: new Date()
    };
    await payment.save();

    res.status(200).json({
      status: 'success',
      data: { refund }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getRefundStatus = async (req, res) => {
  try {
    const { refundId } = req.params;

    const refund = await razorpay.refunds.fetch(refundId);

    res.status(200).json({
      status: 'success',
      data: { refund }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getWalletBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    res.status(200).json({
      status: 'success',
      data: {
        balance: user.walletBalance || 0
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.addMoneyToWallet = async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    const userId = req.user.id;

    // Create payment order for wallet top-up
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `wallet_${userId}_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    res.status(201).json({
      status: 'success',
      data: { order }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.calculateBookingPrice = async (req, res) => {
  try {
    const { venueId, courtId, duration, date } = req.body;

    const court = await Court.findById(courtId);
    if (!court) {
      return res.status(404).json({
        status: 'error',
        message: 'Court not found'
      });
    }

    const hours = duration / 60;
    const basePrice = court.pricePerHour * hours;
    const platformFee = basePrice * 0.05; // 5% platform fee
    const tax = basePrice * 0.18; // 18% GST
    const totalAmount = basePrice + platformFee + tax;

    res.status(200).json({
      status: 'success',
      data: {
        basePrice,
        platformFee,
        tax,
        totalAmount,
        breakdown: {
          courtPrice: basePrice,
          platformFee,
          tax
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getPlatformFees = async (req, res) => {
  try {
    const fees = {
      bookingFee: 5, // 5%
      cancellationFee: 10, // 10%
      processingFee: 2, // 2%
      tax: 18 // 18% GST
    };

    res.status(200).json({
      status: 'success',
      data: fees
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getAllPayments = async (req, res) => {
  try {
    const { status, user, startDate, endDate, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (user) query.user = user;
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const payments = await Payment.find(query)
      .populate('user', 'name email')
      .populate('booking', 'venue court date')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        payments,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }

    const refund = await razorpay.payments.refund(payment.paymentId, {
      amount: amount * 100,
      speed: 'normal'
    });

    payment.refund = {
      refundId: refund.id,
      amount,
      reason,
      status: 'processed',
      processedAt: new Date()
    };
    await payment.save();

    res.status(200).json({
      status: 'success',
      data: { refund }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getPaymentAnalytics = async (req, res) => {
  try {
    const { period } = req.query;
    let startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const analytics = await Payment.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          averageTransaction: { $avg: '$amount' }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: analytics[0] || {
        totalRevenue: 0,
        totalTransactions: 0,
        averageTransaction: 0
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const report = await Payment.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          dailyRevenue: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: report
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Export rate limiting middleware for use in routes
exports.paymentCreateLimit = paymentCreateLimit;
exports.paymentVerifyLimit = paymentVerifyLimit;
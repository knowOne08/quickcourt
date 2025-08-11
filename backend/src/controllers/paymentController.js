const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createPaymentOrder = async (req, res) => {
  try {
    const { bookingId, amount, currency = 'INR' } = req.body;
    const userId = req.user.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    if (booking.user.toString() !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized'
      });
    }

    const options = {
      amount: amount * 100, // Amount in paise
      currency,
      receipt: `booking_${bookingId}_${Date.now()}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    const payment = await Payment.create({
      user: userId,
      booking: bookingId,
      amount,
      currency,
      orderId: order.id,
      status: 'pending'
    });

    res.status(201).json({
      status: 'success',
      data: {
        order,
        payment
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid payment signature'
      });
    }

    const payment = await Payment.findOne({ orderId: razorpay_order_id });
    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }

    payment.paymentId = razorpay_payment_id;
    payment.signature = razorpay_signature;
    payment.status = 'completed';
    payment.paidAt = new Date();
    await payment.save();

    // Update booking status
    await Booking.findByIdAndUpdate(payment.booking, { status: 'confirmed' });

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
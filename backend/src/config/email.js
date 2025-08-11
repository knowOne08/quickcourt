const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  init() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Verify transporter configuration
    this.transporter.verify((error, success) => {
      if (error) {
        logger.error('Email transporter configuration error:', error);
      } else {
        logger.info('Email server is ready to send messages');
      }
    });
  }

  async sendEmail(options) {
    try {
      const mailOptions = {
        from: `QuickCourt <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      logger.error('Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendWelcomeEmail(email, name) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to QuickCourt! 🏆</h2>
        <p>Hi ${name},</p>
        <p>Welcome to QuickCourt - your ultimate sports venue booking platform!</p>
        <p>You can now:</p>
        <ul>
          <li>Browse and book sports venues in your area</li>
          <li>Manage your bookings and profile</li>
          <li>Rate and review venues</li>
          <li>Connect with other sports enthusiasts</li>
        </ul>
        <p>Get started by exploring venues near you!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Explore Venues
          </a>
        </div>
        <p>Best regards,<br>The QuickCourt Team</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to QuickCourt! 🏆',
      html
    });
  }

  async sendVerificationEmail(email, name, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Verify Your Email Address</h2>
        <p>Hi ${name},</p>
        <p>Please verify your email address to complete your registration:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #10b981; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
        <p><strong>This link will expire in 24 hours.</strong></p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <p>Best regards,<br>The QuickCourt Team</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your QuickCourt Account',
      html
    });
  }

  async sendPasswordResetEmail(email, name, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Reset Your Password</h2>
        <p>Hi ${name},</p>
        <p>We received a request to reset your password for your QuickCourt account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #ef4444; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
        <p><strong>This link will expire in 1 hour.</strong></p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
        <p>Best regards,<br>The QuickCourt Team</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your QuickCourt Password',
      html
    });
  }

  async sendBookingConfirmationEmail(email, name, bookingDetails) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Booking Confirmed! 🎉</h2>
        <p>Hi ${name},</p>
        <p>Your booking has been confirmed! Here are the details:</p>
        
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Booking Details</h3>
          <p><strong>Venue:</strong> ${bookingDetails.venueName}</p>
          <p><strong>Date:</strong> ${bookingDetails.date}</p>
          <p><strong>Time:</strong> ${bookingDetails.timeSlot}</p>
          <p><strong>Sport:</strong> ${bookingDetails.sport}</p>
          <p><strong>Amount Paid:</strong> ₹${bookingDetails.amount}</p>
          <p><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
        </div>

        <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;"><strong>Important:</strong> Please arrive 15 minutes before your scheduled time.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/my-bookings" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            View My Bookings
          </a>
        </div>

        <p>Have a great game!</p>
        <p>Best regards,<br>The QuickCourt Team</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Booking Confirmed - QuickCourt',
      html
    });
  }

  async sendBookingCancellationEmail(email, name, bookingDetails) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">Booking Cancelled</h2>
        <p>Hi ${name},</p>
        <p>Your booking has been cancelled as requested:</p>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Cancelled Booking Details</h3>
          <p><strong>Venue:</strong> ${bookingDetails.venueName}</p>
          <p><strong>Date:</strong> ${bookingDetails.date}</p>
          <p><strong>Time:</strong> ${bookingDetails.timeSlot}</p>
          <p><strong>Refund Amount:</strong> ₹${bookingDetails.refundAmount}</p>
          <p><strong>Booking ID:</strong> ${bookingDetails.bookingId}</p>
        </div>

        <p>Your refund will be processed within 5-7 business days.</p>
        <p>We hope to see you book with us again soon!</p>
        <p>Best regards,<br>The QuickCourt Team</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Booking Cancelled - QuickCourt',
      html
    });
  }
}

module.exports = new EmailService();

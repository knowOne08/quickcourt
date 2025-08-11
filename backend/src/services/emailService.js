const nodemailer = require('nodemailer');
const emailConfig = require('../config/email');

class EmailService {
  constructor() {
    this.transporter = emailConfig.transporter;
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'QuickCourt <noreply@quickcourt.com>',
        to,
        subject,
        html,
        text: text || this.htmlToText(html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error('Failed to send email');
    }
  }

  htmlToText(html) {
    // Simple HTML to text conversion
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  async sendVerificationEmail(email, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; }
          .button { background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { background-color: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to QuickCourt!</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for signing up with QuickCourt. To complete your registration, please verify your email address by clicking the button below:</p>
            
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            
            <p><strong>This verification link will expire in 10 minutes.</strong></p>
            
            <p>If you didn't create an account with QuickCourt, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 QuickCourt. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, 'Verify Your QuickCourt Account', html);
  }

  async sendWelcomeEmail(user) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; }
          .button { background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { background-color: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to QuickCourt, ${user.fullName}! 🎾</h1>
          </div>
          <div class="content">
            <h2>Your account is now active!</h2>
            <p>We're excited to have you join the QuickCourt community. You can now start booking courts at your favorite venues.</p>
            
            <h3>What's next?</h3>
            <ul>
              <li>🏟️ Browse and discover courts near you</li>
              <li>📅 Book your favorite time slots</li>
              <li>💳 Make secure payments</li>
              <li>⭐ Rate and review venues</li>
              <li>📱 Manage all your bookings in one place</li>
            </ul>
            
            <a href="${process.env.FRONTEND_URL}/venues" class="button">Start Exploring Courts</a>
            
            <p>If you have any questions, feel free to contact our support team.</p>
          </div>
          <div class="footer">
            <p>© 2024 QuickCourt. All rights reserved.</p>
            <p>Need help? Contact us at support@quickcourt.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, 'Welcome to QuickCourt! 🎾', html);
  }

  async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; }
          .button { background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { background-color: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; }
          .warning { background-color: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 5px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password for your QuickCourt account.</p>
            
            <a href="${resetUrl}" class="button">Reset Password</a>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            
            <div class="warning">
              <p><strong>Important:</strong></p>
              <ul>
                <li>This reset link will expire in 10 minutes</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password will remain unchanged until you create a new one</li>
              </ul>
            </div>
            
            <p>For security reasons, please don't share this link with anyone.</p>
          </div>
          <div class="footer">
            <p>© 2024 QuickCourt. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, 'Password Reset - QuickCourt', html);
  }

  async sendBookingConfirmationEmail(user, booking, venue, court) {
    const bookingDate = new Date(booking.date).toLocaleDateString();
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; }
          .booking-details { background-color: #f0f9ff; border: 1px solid #0ea5e9; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { background-color: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { background-color: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 5px 0; border-bottom: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmed! ✅</h1>
          </div>
          <div class="content">
            <h2>Hi ${user.fullName},</h2>
            <p>Great news! Your court booking has been confirmed. Here are the details:</p>
            
            <div class="booking-details">
              <h3>Booking Details</h3>
              <div class="detail-row">
                <span><strong>Booking ID:</strong></span>
                <span>${booking._id}</span>
              </div>
              <div class="detail-row">
                <span><strong>Venue:</strong></span>
                <span>${venue.name}</span>
              </div>
              <div class="detail-row">
                <span><strong>Court:</strong></span>
                <span>${court.name} (${court.sport})</span>
              </div>
              <div class="detail-row">
                <span><strong>Date:</strong></span>
                <span>${bookingDate}</span>
              </div>
              <div class="detail-row">
                <span><strong>Time:</strong></span>
                <span>${booking.startTime} - ${booking.endTime}</span>
              </div>
              <div class="detail-row">
                <span><strong>Duration:</strong></span>
                <span>${booking.duration} minutes</span>
              </div>
              <div class="detail-row">
                <span><strong>Total Amount:</strong></span>
                <span>₹${booking.totalAmount}</span>
              </div>
              <div class="detail-row">
                <span><strong>Status:</strong></span>
                <span style="color: #059669; font-weight: bold;">CONFIRMED</span>
              </div>
            </div>
            
            <h3>Venue Information</h3>
            <p><strong>Address:</strong> ${venue.address.street}, ${venue.address.city}, ${venue.address.state} - ${venue.address.pincode}</p>
            ${venue.contactInfo.phone ? `<p><strong>Phone:</strong> ${venue.contactInfo.phone}</p>` : ''}
            
            <a href="${process.env.FRONTEND_URL}/bookings/${booking._id}" class="button">View Booking Details</a>
            
            <h3>Important Notes:</h3>
            <ul>
              <li>Please arrive 10 minutes before your scheduled time</li>
              <li>Bring a valid ID for verification</li>
              <li>Follow the venue's rules and regulations</li>
              <li>Cancellations must be made at least 2 hours in advance</li>
            </ul>
          </div>
          <div class="footer">
            <p>© 2024 QuickCourt. All rights reserved.</p>
            <p>Need help? Contact us at support@quickcourt.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, `Booking Confirmed - ${venue.name}`, html);
  }

  async sendBookingCancellationEmail(user, booking, venue, court, refundAmount) {
    const bookingDate = new Date(booking.date).toLocaleDateString();
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; }
          .booking-details { background-color: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .refund-info { background-color: #f0f9ff; border: 1px solid #0ea5e9; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { background-color: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 5px 0; border-bottom: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Cancelled</h1>
          </div>
          <div class="content">
            <h2>Hi ${user.fullName},</h2>
            <p>Your booking has been cancelled successfully. We're sorry to see you go!</p>
            
            <div class="booking-details">
              <h3>Cancelled Booking Details</h3>
              <div class="detail-row">
                <span><strong>Booking ID:</strong></span>
                <span>${booking._id}</span>
              </div>
              <div class="detail-row">
                <span><strong>Venue:</strong></span>
                <span>${venue.name}</span>
              </div>
              <div class="detail-row">
                <span><strong>Court:</strong></span>
                <span>${court.name}</span>
              </div>
              <div class="detail-row">
                <span><strong>Date:</strong></span>
                <span>${bookingDate}</span>
              </div>
              <div class="detail-row">
                <span><strong>Time:</strong></span>
                <span>${booking.startTime} - ${booking.endTime}</span>
              </div>
              <div class="detail-row">
                <span><strong>Original Amount:</strong></span>
                <span>₹${booking.totalAmount}</span>
              </div>
            </div>
            
            ${refundAmount > 0 ? `
            <div class="refund-info">
              <h3>Refund Information</h3>
              <p><strong>Refund Amount:</strong> ₹${refundAmount}</p>
              <p>Your refund will be processed within 5-7 business days and will be credited to your original payment method.</p>
            </div>
            ` : `
            <div class="refund-info">
              <h3>Refund Information</h3>
              <p>No refund is applicable for this cancellation as per our cancellation policy.</p>
            </div>
            `}
            
            <p>We hope to serve you again soon. Thank you for choosing QuickCourt!</p>
          </div>
          <div class="footer">
            <p>© 2024 QuickCourt. All rights reserved.</p>
            <p>Questions about your refund? Contact us at support@quickcourt.com</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(user.email, `Booking Cancelled - ${venue.name}`, html);
  }

  async sendOTPEmail(email, otp, purpose = 'verification') {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background-color: #7c3aed; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; text-align: center; }
          .otp-code { background-color: #f3f4f6; border: 2px dashed #7c3aed; padding: 20px; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 8px; }
          .footer { background-color: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Your OTP Code</h1>
          </div>
          <div class="content">
            <h2>One-Time Password</h2>
            <p>Use this OTP for ${purpose}:</p>
            
            <div class="otp-code">${otp}</div>
            
            <p><strong>This OTP is valid for 5 minutes only.</strong></p>
            <p>If you didn't request this OTP, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 QuickCourt. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail(email, `Your OTP Code - QuickCourt`, html);
  }
}

module.exports = new EmailService();

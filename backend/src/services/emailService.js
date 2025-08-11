const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    // Create a test transporter for development
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || 'test@gmail.com',
        pass: process.env.EMAIL_PASS || 'test'
      }
    });
  }

  async sendVerificationEmail(email, verificationCode) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@quickcourt.com',
        to: email,
        subject: '🏸 Your QuickCourt Verification Code',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verification Code - QuickCourt</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">
                          🏸 QuickCourt
                        </h1>
                        <p style="color: #e8f0fe; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                          Your Sports Booking Platform
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Main Content -->
                    <tr>
                      <td style="padding: 50px 40px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                          <div style="background-color: #f8f9fa; border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 40px;">
                            🔐
                          </div>
                          <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 28px; font-weight: 600;">
                            Email Verification
                          </h2>
                          <p style="color: #6c757d; margin: 0; font-size: 16px; line-height: 1.6;">
                            Welcome to QuickCourt! Please use the verification code below to complete your registration.
                          </p>
                        </div>
                        
                        <!-- Verification Code -->
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
                          <p style="color: #ffffff; margin: 0 0 10px 0; font-size: 16px; font-weight: 500;">
                            Your Verification Code
                          </p>
                          <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin: 15px 0;">
                            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #2c3e50; font-family: 'Courier New', monospace;">
                              ${verificationCode}
                            </span>
                          </div>
                          <p style="color: #e8f0fe; margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">
                            Enter this code in the verification form
                          </p>
                        </div>
                        
                        <!-- Instructions -->
                        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #667eea;">
                          <p style="color: #495057; margin: 0 0 15px 0; font-size: 16px; line-height: 1.6;">
                            <strong>Instructions:</strong>
                          </p>
                          <ul style="color: #6c757d; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                            <li>Enter the 6-digit code exactly as shown above</li>
                            <li>The code is case-sensitive</li>
                            <li>Don't share this code with anyone</li>
                          </ul>
                        </div>
                        
                        <!-- Important Notice -->
                        <div style="border-top: 2px solid #e9ecef; padding-top: 25px; margin-top: 30px;">
                          <p style="color: #dc3545; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">
                            ⏰ <strong>Important:</strong> This code will expire in 10 minutes for security reasons.
                          </p>
                          <p style="color: #6c757d; margin: 0; font-size: 14px;">
                            🛡️ If you didn't create an account with QuickCourt, please ignore this email.
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #2c3e50; padding: 30px; text-align: center;">
                        <p style="color: #ecf0f1; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">
                          Need Help? 🤝
                        </p>
                        <p style="color: #bdc3c7; margin: 0 0 15px 0; font-size: 14px; line-height: 1.5;">
                          If you're having trouble with verification, contact our support team<br>
                          or try requesting a new code.
                        </p>
                        <div style="border-top: 1px solid #34495e; padding-top: 20px; margin-top: 20px;">
                          <p style="color: #95a5a6; margin: 0; font-size: 12px;">
                            © 2024 QuickCourt. All rights reserved.<br>
                            This email was sent to ${email}
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      };

      console.log("Sending verification code email...");
      const info = await this.transporter.sendMail(mailOptions);
      console.log("Verification code email sent:", info.messageId);
      logger.info(`Verification code email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error(`Email sending failed: ${error.message}`);
      console.log("Email error:", error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();

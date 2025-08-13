# Stripe Migration Guide

This document outlines the migration from Razorpay to Stripe payment gateway for the QuickCourt application.

## Overview

The application has been successfully migrated from Razorpay to Stripe payment processing. All payment-related functionality has been updated to use Stripe's API while maintaining the same user experience and security features.

## Changes Made

### Backend Changes

1. **Payment Model** (`backend/src/models/Payment.js`)
   - Replaced Razorpay-specific fields with Stripe fields
   - Updated currency handling to use lowercase (inr, usd)
   - Added Stripe payment intent and client secret fields

2. **Payment Configuration** (`backend/src/config/payment.js`)
   - Updated to use Stripe API methods
   - Replaced Razorpay order creation with Stripe payment intent creation
   - Updated webhook verification for Stripe

3. **Payment Security Middleware** (`backend/src/middleware/paymentSecurity.js`)
   - Updated validation for Stripe payment intent IDs
   - Modified webhook signature verification for Stripe
   - Updated CSP headers for Stripe domains

4. **Payment Routes** (`backend/src/routes/payments.js`)
   - Created proper Express router with Stripe endpoints
   - Added webhook handling for Stripe events
   - Updated route validation for Stripe parameters

5. **Payment Controller** (`backend/src/controllers/paymentController.js`)
   - Already had Stripe implementation
   - Uses Stripe SDK for payment processing
   - Handles Stripe webhooks and payment confirmation

### Frontend Changes

1. **Payment Service** (`frontend/src/services/paymentService.js`)
   - Updated API endpoints to use Stripe terminology
   - Changed from `createPaymentOrder` to `createPaymentIntent`
   - Changed from `verifyPayment` to `confirmPayment`

2. **Secure Payment Hook** (`frontend/src/hooks/useSecurePayment.js`)
   - Replaced Razorpay integration with Stripe
   - Updated payment flow to use Stripe's `confirmPayment`
   - Maintained all security features and validation

3. **Payment Section Component** (`frontend/src/components/booking/PaymentSection.js`)
   - Updated UI to reference Stripe instead of Razorpay
   - Changed payment method selection to Stripe
   - Updated loading states and error messages

4. **HTML Template** (`frontend/public/index.html`)
   - Replaced Razorpay script with Stripe script
   - Updated to use `https://js.stripe.com/v3/`

## Required Environment Variables

### Backend Environment Variables

Replace the following Razorpay environment variables with Stripe equivalents:

```bash
# Remove these Razorpay variables:
# RAZORPAY_KEY_ID=your_razorpay_key_id
# RAZORPAY_KEY_SECRET=your_razorpay_key_secret
# RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Add these Stripe variables:
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
```

### Frontend Environment Variables

Replace the following Razorpay environment variables with Stripe equivalents:

```bash
# Remove these Razorpay variables:
# REACT_APP_RAZORPAY_KEY_ID=your_razorpay_key_id

# Add these Stripe variables:
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

## Stripe Setup Instructions

1. **Create Stripe Account**
   - Sign up at https://stripe.com
   - Complete account verification

2. **Get API Keys**
   - Go to Stripe Dashboard > Developers > API keys
   - Copy your publishable key and secret key
   - Use test keys for development, live keys for production

3. **Configure Webhooks**
   - Go to Stripe Dashboard > Developers > Webhooks
   - Add endpoint: `https://your-domain.com/api/payments/webhook`
   - Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the webhook signing secret

4. **Update Environment Variables**
   - Add the environment variables listed above
   - Restart your application

## Payment Flow

The new Stripe payment flow works as follows:

1. **Create Payment Intent**
   - Frontend calls `/api/payments/create-intent`
   - Backend creates Stripe payment intent
   - Returns client secret to frontend

2. **Confirm Payment**
   - Frontend uses Stripe.js to confirm payment
   - User enters payment details in Stripe's secure form
   - Stripe processes the payment

3. **Webhook Processing**
   - Stripe sends webhook events to backend
   - Backend updates payment status based on events
   - Booking is confirmed on successful payment

## Security Features Maintained

- Rate limiting for payment creation and confirmation
- Input validation for all payment data
- Fraud detection and suspicious activity monitoring
- Secure webhook verification
- Device fingerprinting and session management
- Comprehensive audit logging

## Testing

1. **Test Mode**
   - Use Stripe test keys for development
   - Test with Stripe's test card numbers
   - Verify webhook events in Stripe dashboard

2. **Production Mode**
   - Switch to live Stripe keys
   - Update webhook endpoints to production URLs
   - Monitor payment processing in Stripe dashboard

## Migration Checklist

- [ ] Update environment variables
- [ ] Configure Stripe webhooks
- [ ] Test payment flow in development
- [ ] Update any hardcoded Razorpay references
- [ ] Test refund functionality
- [ ] Verify webhook processing
- [ ] Update documentation
- [ ] Deploy to production
- [ ] Monitor payment processing

## Support

For Stripe-related issues:
- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- Stripe Community: https://community.stripe.com

## Rollback Plan

If needed, you can rollback to Razorpay by:
1. Reverting the code changes
2. Restoring Razorpay environment variables
3. Updating the HTML to include Razorpay script
4. Testing the payment flow

However, this migration maintains all existing functionality while providing better international payment support and more robust payment processing.

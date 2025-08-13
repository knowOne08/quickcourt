// frontend/src/components/booking/PaymentSection.js
import React, { useState } from 'react';
import { 
  useStripe, 
  useElements, 
  PaymentElement // Import the PaymentElement
} from '@stripe/react-stripe-js';
import { useSecurePayment } from '../../hooks/useSecurePayment';
import './PaymentSection.css'; // Make sure you have some basic styling

const PaymentSection = ({ totalAmount, bookingDetails }) => {
  // Get stripe and elements instances from the Elements provider
  const stripe = useStripe();
  const elements = useElements();

  const {
    loading: paymentLoading,
    error: paymentError,
    paymentState,
    processPayment,
  } = useSecurePayment();

  const [termsAccepted, setTermsAccepted] = useState(false);

  const handlePaymentSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !termsAccepted) {
      // Disable form submission until Stripe.js has loaded and terms are accepted.
      return;
    }

    const paymentData = {
      amount: totalAmount,
      currency: 'usd', // Or get this dynamically from bookingDetails
      ...bookingDetails,
      date: bookingDetails.date instanceof Date 
        ? bookingDetails.date.toISOString().split('T')[0] 
        : bookingDetails.date,
    };

    // Pass stripe and elements to the hook's processing function
    await processPayment(paymentData, stripe, elements);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'usd',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <form onSubmit={handlePaymentSubmit} className="payment-section">
      {/* <h3>Complete Your Booking</h3> */}
      
      <div className="booking-summary">
        <div className="summary-item">
          <span>Total Amount:</span>
          <span className="total-amount">{formatCurrency(totalAmount)}</span>
        </div>
      </div>

      {/* This component renders the card number, expiry, CVC, etc. */}
      <PaymentElement />

      <div className="terms-section">
        <label>
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            required
          />
          I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms & Conditions</a>.
        </label>
      </div>

      {paymentError && (
        <div className="error-message">
          <p>⚠️ {paymentError}</p>
        </div>
      )}

      <button 
        type="submit" 
        className="pay-now-btn"
        disabled={!stripe || !elements || paymentLoading || !termsAccepted}
      >
        {paymentLoading 
          ? `Processing (${paymentState.status})...` 
          : `Pay Securely ${formatCurrency(totalAmount)}`}
      </button>

      <div className="security-badges">
        <span>🔒 256-bit SSL Encrypted</span>
        <span>🛡️ PCI DSS Compliant</span>
      </div>
    </form>
  );
};

export default PaymentSection;

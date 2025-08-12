// frontend/src/components/booking/PaymentSection.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSecurePayment } from '../../hooks/useSecurePayment';
import './PaymentSection.css';

const PaymentSection = ({ 
  totalAmount, 
  onContinue, 
  disabled = false,
  bookingDetails = null 
}) => {
  const { user } = useAuth();
  const {
    loading: paymentLoading,
    error: paymentError,
    paymentState,
    securityValidation,
    isSecurityValid,
    processPayment,
    resetPaymentState
  } = useSecurePayment();

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('razorpay');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Set up booking session for security
  useEffect(() => {
    if (bookingDetails) {
      sessionStorage.setItem('bookingSession', JSON.stringify({
        bookingId: bookingDetails.bookingId,
        amount: totalAmount,
        timestamp: Date.now()
      }));
    }

    return () => {
      // Cleanup on unmount
      if (paymentState.status !== 'completed') {
        sessionStorage.removeItem('bookingSession');
      }
    };
  }, [bookingDetails, totalAmount, paymentState.status]);

  const handleCreateBooking = async () => {
    if (!bookingDetails) {
      return;
    }

    if (!isSecurityValid) {
      return;
    }

    if (!termsAccepted) {
      return;
    }

    try {
      const paymentData = {
        bookingId: bookingDetails.bookingId || bookingDetails.id,
        amount: totalAmount,
        currency: 'INR',
        venueName: bookingDetails.venueName,
        ...bookingDetails
      };

      const result = await processPayment(paymentData);
      
      if (result.success) {
        setShowConfirmation(true);
        // Clear sensitive data
        sessionStorage.removeItem('bookingSession');
        
        // Redirect after delay
        setTimeout(() => {
          window.location.href = '/my-bookings';
        }, 3000);
      }
    } catch (error) {
      console.error('Payment processing error:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return time;
    }
  };

  if (showConfirmation) {
    return (
      <div className="payment-section confirmation">
        <div className="confirmation-content">
          <div className="success-icon">✓</div>
          <h3>Payment Successful!</h3>
          <p>Your booking has been confirmed and payment processed.</p>
          <p>You will receive a confirmation email shortly.</p>
          <div className="booking-confirmation-details">
            <p><strong>Booking ID:</strong> {bookingDetails?.bookingId || 'Generating...'}</p>
            <p><strong>Amount Paid:</strong> {formatCurrency(totalAmount)}</p>
          </div>
          <div className="redirect-message">
            Redirecting to My Bookings in 3 seconds...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-section">
      <div className="payment-header">
        <h3>Complete Your Booking</h3>
        <p>Review details and proceed with secure payment</p>
      </div>

      {/* Security Status Indicator */}
      {!isSecurityValid && (
        <div className="security-warning">
          <div className="warning-icon">⚠️</div>
          <p>Security validation in progress...</p>
          <div className="security-checks">
            <div className={`check-item ${securityValidation.userAuthenticated ? 'valid' : 'invalid'}`}>
              User authentication: {securityValidation.userAuthenticated ? '✓' : '✗'}
            </div>
            <div className={`check-item ${securityValidation.sessionValid ? 'valid' : 'invalid'}`}>
              Session validation: {securityValidation.sessionValid ? '✓' : '✗'}
            </div>
            <div className={`check-item ${securityValidation.amountValidated ? 'valid' : 'invalid'}`}>
              Amount validation: {securityValidation.amountValidated ? '✓' : '✗'}
            </div>
            <div className={`check-item ${securityValidation.environmentSecure ? 'valid' : 'invalid'}`}>
              Environment security: {securityValidation.environmentSecure ? '✓' : '✗'}
            </div>
          </div>
        </div>
      )}

      {bookingDetails && (
        <div className="booking-summary">
          <div className="summary-item">
            <span className="summary-label">Venue:</span>
            <span className="summary-value">{bookingDetails.venueName || 'Selected Venue'}</span>
          </div>
          
          {bookingDetails.courtName && (
            <div className="summary-item">
              <span className="summary-label">Court:</span>
              <span className="summary-value">{bookingDetails.courtName}</span>
            </div>
          )}
          
          <div className="summary-item">
            <span className="summary-label">Date:</span>
            <span className="summary-value">{formatDate(bookingDetails.date)}</span>
          </div>
          
          <div className="summary-item">
            <span className="summary-label">Time:</span>
            <span className="summary-value">
              {formatTime(bookingDetails.startTime)} - {formatTime(bookingDetails.endTime)}
            </span>
          </div>
          
          <div className="summary-item">
            <span className="summary-label">Duration:</span>
            <span className="summary-value">
              {bookingDetails.duration / 60} hour{bookingDetails.duration / 60 !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="summary-item">
            <span className="summary-label">Price per hour:</span>
            <span className="summary-value">₹{bookingDetails.pricePerHour || 0}</span>
          </div>
        </div>
      )}

      <div className="payment-total">
        <div className="total-row">
          <span className="total-label">Total Amount:</span>
          <span className="total-amount">{formatCurrency(totalAmount)}</span>
        </div>
        <div className="tax-info">
          <small>Inclusive of all taxes and fees</small>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="payment-methods">
        <h4>Select Payment Method</h4>
        <div className="payment-options">
          <label className={`payment-option ${selectedPaymentMethod === 'razorpay' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="paymentMethod"
              value="razorpay"
              checked={selectedPaymentMethod === 'razorpay'}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            />
            <div className="payment-method-info">
              <div className="payment-method-name">
                <span>Razorpay</span>
                <div className="payment-icons">
                  <span className="payment-icon">💳</span>
                  <span className="payment-icon">📱</span>
                </div>
              </div>
              <div className="payment-method-description">
                Credit/Debit Cards, Net Banking, UPI, Wallets
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="terms-section">
        <label className="terms-checkbox">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            required
          />
          <span className="checkmark"></span>
          <span className="terms-text">
            I agree to the <a href="/terms" target="_blank">Terms & Conditions</a> and 
            <a href="/cancellation-policy" target="_blank"> Cancellation Policy</a>
          </span>
        </label>
      </div>

      {paymentError && (
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <p>{paymentError}</p>
        </div>
      )}

      <div className="payment-actions">
        {bookingDetails ? (
          <button
            type="button"
            className="pay-now-btn"
            onClick={handleCreateBooking}
            disabled={disabled || paymentLoading || !termsAccepted || !isSecurityValid}
          >
            <div className="btn-content">
              {paymentLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>
                    {paymentState.status === 'creating' && 'Creating Order...'}
                    {paymentState.status === 'verifying' && 'Verifying Payment...'}
                    {paymentState.status === 'processing' && 'Processing Payment...'}
                    {paymentState.status === 'idle' && 'Processing...'}
                  </span>
                </>
              ) : (
                <>
                  <span className="secure-icon">🔒</span>
                  <span>Pay Securely {formatCurrency(totalAmount)}</span>
                </>
              )}
            </div>
          </button>
        ) : (
          <button
            type="button"
            className="continue-btn"
            onClick={onContinue}
            disabled={disabled}
          >
            Continue to Payment
          </button>
        )}
      </div>

      <div className="payment-info">
        <div className="security-badges">
          <div className="security-badge">
            <span className="badge-icon">🔒</span>
            <span>256-bit SSL Encrypted</span>
          </div>
          <div className="security-badge">
            <span className="badge-icon">🛡️</span>
            <span>PCI DSS Compliant</span>
          </div>
          <div className="security-badge">
            <span className="badge-icon">✓</span>
            <span>100% Secure Payment</span>
          </div>
        </div>
        
        <div className="payment-notes">
          <p className="info-text">
            <strong>Payment Security:</strong> All payments are processed through Razorpay's secure gateway.
          </p>
          <p className="info-text">
            <strong>Cancellation:</strong> Free cancellation up to 2 hours before booking time.
          </p>
          <p className="info-text">
            <strong>Refund:</strong> Refunds will be processed within 5-7 business days.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSection;

// frontend/src/components/booking/PaymentSection.js
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import './PaymentSection.css';

const PaymentSection = ({ 
  totalAmount, 
  onContinue, 
  disabled = false,
  bookingDetails = null 
}) => {
  const { user } = useAuth();
  const { createBooking, loading, error } = useBooking();
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleCreateBooking = async () => {
    if (!bookingDetails) {
      console.error('No booking details provided');
      return;
    }

    try {
      const result = await createBooking(bookingDetails);
      if (result.success) {
        setShowConfirmation(true);
        // Redirect to confirmation page or show success message
        setTimeout(() => {
          window.location.href = '/my-bookings';
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
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
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (showConfirmation) {
    return (
      <div className="payment-section confirmation">
        <div className="confirmation-content">
          <div className="success-icon">✓</div>
          <h3>Booking Confirmed!</h3>
          <p>Your booking has been successfully created.</p>
          <p>You will receive a confirmation email shortly.</p>
          <div className="redirect-message">
            Redirecting to My Bookings...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-section">
      <div className="payment-header">
        <h3>Booking Summary</h3>
        <p>Review your booking details before proceeding</p>
      </div>

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
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <div className="payment-actions">
        {bookingDetails ? (
          <button
            type="button"
            className="create-booking-btn"
            onClick={handleCreateBooking}
            disabled={disabled || loading}
          >
            {loading ? 'Creating Booking...' : 'Create Booking'}
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
        <p className="info-text">
          <strong>Note:</strong> Payment will be processed after booking confirmation.
        </p>
        <p className="info-text">
          You can cancel your booking up to 2 hours before the scheduled time.
        </p>
      </div>
    </div>
  );
};

export default PaymentSection;

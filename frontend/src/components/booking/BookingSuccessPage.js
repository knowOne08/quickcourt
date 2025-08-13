// frontend/src/pages/BookingSuccessPage.js
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { paymentService } from '../../services/paymentService'; // Ensure you have this service
import "../../styles/odoo-theme.css";
import "../../styles/responsive.css"


const BookingSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [bookingDetails, setBookingDetails] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const confirmPayment = async () => {
      const queryParams = new URLSearchParams(location.search);
      const paymentIntentId = queryParams.get('payment_intent');
      const bookingId = queryParams.get('bookingId');

      if (!paymentIntentId || !bookingId) {
        setError('Invalid success URL. Payment information is missing.');
        setLoading(false);
        return;
      }

      try {
        // Call your backend to verify the payment and get booking details
        const response = await paymentService.confirmPayment({
          payment_intent_id: paymentIntentId,
          bookingId: bookingId,
        });
        
        if (response.data.status === 'success') {
          // Assuming the backend returns the confirmed booking details
          setBookingDetails(response.data.data);
        } else {
          throw new Error(response.data.message || 'Payment verification failed.');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'An error occurred during payment verification.');
      } finally {
        setLoading(false);
      }
    };

    confirmPayment();
  }, [location.search]);

  if (loading) {
    return <div className="status-container">Verifying your payment...</div>;
  }

  if (error) {
    return <div className="status-container error">Error: {error}</div>;
  }

  return (
    <div className="booking-success-container">
      <div className="confirmation-card">
        <div className="success-icon">✓</div>
        <h1>Payment Successful!</h1>
        <p>Your booking has been confirmed. A confirmation email has been sent to you.</p>
        
        {bookingDetails && (
          <div className="booking-summary">
            <h3>Booking Summary</h3>
            <p><strong>Booking ID:</strong> {bookingDetails.bookingId}</p>
            <p><strong>Amount Paid:</strong> ${bookingDetails.amount.toFixed(2)}</p>
            {/* Add more details as needed, e.g., date, time, court */}
          </div>
        )}
        
        <div className="actions">
          <button onClick={() => navigate('/my-bookings')} className="btn-primary">
            View My Bookings
          </button>
          <button onClick={() => navigate('/')} className="btn-secondary">
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccessPage;
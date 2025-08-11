// frontend/src/pages/user/MyBookings.js
import React, { useState, useEffect } from 'react';
import { useBooking } from '../../context/BookingContext';

const MyBookings = () => {
  const { userBookings, loading, loadUserBookings, cancelBooking } = useBooking();

  useEffect(() => {
    loadUserBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      await cancelBooking(bookingId);
    }
  };

  if (loading) return <div>Loading bookings...</div>;

  return (
    <div className="my-bookings-page">
      <div className="bookings-container">
        <h1>My Bookings</h1>
        
        {userBookings.length === 0 ? (
          <p>No bookings found</p>
        ) : (
          <div className="bookings-list">
            {userBookings.map(booking => (
              <div key={booking._id} className="booking-card">
                <h3>{booking.venue?.name || 'Venue Name'}</h3>
                <p>Date: {new Date(booking.date).toLocaleDateString()}</p>
                <p>Time: {booking.startTime} - {booking.endTime}</p>
                <p>Status: {booking.status}</p>
                <p>Amount: ₹{booking.totalAmount}</p>
                
                {booking.status === 'confirmed' && (
                  <button 
                    onClick={() => handleCancelBooking(booking._id)}
                    className="cancel-btn"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;

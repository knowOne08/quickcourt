// frontend/src/pages/user/BookingPage.js
import React from 'react';
import { useParams } from 'react-router-dom';
import BookingForm from '../../components/booking/BookingForm';
import './BookingPage.css';

const BookingPage = () => {
  const { venueId } = useParams();

  console.log(venueId)

  const handleBookingSuccess = (booking) => {
    // Handle successful booking - could redirect or show success message
    console.log('Booking created successfully:', booking);
  };

  return (
    <div className="booking-page">
      <div className="booking-container">
        <div className="booking-header">
          <h1>Book Your Court</h1>
          <p>Select your preferred date, time, and court</p>
        </div>
        
        <BookingForm 
          venueId={venueId} 
          onSuccess={handleBookingSuccess}
        />
      </div>
    </div>
  );
};

export default BookingPage;
// frontend/src/pages/user/BookingPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BookingCalendar from '../../components/booking/BookingCalendar';
import TimeSlotSelector from '../../components/booking/TimeSlotSelector';
import PaymentSection from '../../components/booking/PaymentSection';
import { venueService } from '../../services/venueService';
import bookingService from '../../services/bookingService';
import './BookingPage.css';

const BookingPage = () => {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [venue, setVenue] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [duration, setDuration] = useState(60); // minutes
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchVenueDetails();
  }, [venueId, isAuthenticated]);

  useEffect(() => {
    if (venue && selectedDate && selectedCourt) {
      fetchAvailableSlots();
    }
  }, [venue, selectedDate, selectedCourt]);

  useEffect(() => {
    if (venue && duration) {
      const basePrice = venue.pricing.basePrice;
      const hours = duration / 60;
      setTotalAmount(basePrice * hours);
    }
  }, [venue, duration]);

  const fetchVenueDetails = async () => {
    try {
      setLoading(true);
      const response = await venueService.getVenueById(venueId);
      setVenue(response.data);

      // Set first court as default if available
      if (response.data.courts && response.data.courts.length > 0) {
        setSelectedCourt(response.data.courts[0]);
      }
    } catch (error) {
      console.error('Error fetching venue details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const response = await bookingService.getAvailableSlots(
        selectedCourt._id,
        selectedDate.toISOString().split('T')[0]
      );
      setAvailableSlots(response.data);
    } catch (error) {
      console.error('Error fetching available slots:', error);
    }
  };

  const handleDateChange = (date) => {
    // Only allow current date and future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date >= today) {
      setSelectedDate(date);
      setSelectedTimeSlot(null);
    }
  };

  const handleTimeSlotChange = (slot) => {
    // Validate that start time is in the future
    const selectedDateTime = new Date(selectedDate);
    const [hours, minutes] = slot.startTime.split(':');
    selectedDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (selectedDateTime > new Date()) {
      setSelectedTimeSlot(slot);
    }
  };

  const handleCourtChange = (court) => {
    setSelectedCourt(court);
    setSelectedTimeSlot(null);
  };

  const handleDurationChange = (newDuration) => {
    setDuration(newDuration);
  };

  const handleContinueToPayment = () => {
    if (!selectedDate || !selectedTimeSlot || !selectedCourt) {
      alert('Please select date, time slot, and court');
      return;
    }

    // Navigate to payment with booking details
    navigate('/payment', {
      state: {
        bookingDetails: {
          venue: venue._id,
          court: selectedCourt._id,
          date: selectedDate,
          startTime: selectedTimeSlot.startTime,
          endTime: selectedTimeSlot.endTime,
          duration,
          totalAmount
        }
      }
    });
  };

  if (loading) {
    return <div className="booking-loading">Loading booking details...</div>;
  }

  if (!venue) {
    return <div className="booking-error">Venue not found</div>;
  }

  return (
    <div className="booking-page">
      <div className="booking-container">
        <div className="booking-header">
          <h1>{venue.name}</h1>
          <p>{venue.location}</p>
        </div>

        <div className="booking-form">
          <div className="booking-section">
            <label htmlFor="date-picker">Date</label>
            <BookingCalendar
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              minDate={new Date()}
            />
          </div>

          <div className="booking-section">
            <label htmlFor="time-slot">Start Time</label>
            <TimeSlotSelector
              availableSlots={availableSlots}
              selectedSlot={selectedTimeSlot}
              onSlotChange={handleTimeSlotChange}
              operatingHours={venue.operatingHours}
            />
          </div>

          <div className="booking-section">
            <label htmlFor="duration">Duration</label>
            <select
              id="duration"
              value={duration}
              onChange={(e) => handleDurationChange(parseInt(e.target.value))}
              className="duration-select"
            >
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
              <option value={180}>3 hours</option>
            </select>
          </div>

          <div className="booking-section">
            <label htmlFor="court">Court</label>
            <div className="court-selector">
              {venue.courts?.map(court => (
                <div
                  key={court._id}
                  className={`court-option ${selectedCourt?._id === court._id ? 'selected' : ''}`}
                  onClick={() => handleCourtChange(court)}
                >
                  <h4>{court.name}</h4>
                  <p>{court.sport}</p>
                  <span className="court-price">₹{court.pricePerHour}/hour</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="booking-summary">
          <PaymentSection
            totalAmount={totalAmount}
            onContinue={handleContinueToPayment}
            disabled={!selectedDate || !selectedTimeSlot || !selectedCourt}
          />
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
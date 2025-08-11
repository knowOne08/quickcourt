// frontend/src/components/booking/BookingForm.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import BookingCalendar from './BookingCalendar';
import TimeSlotSelector from './TimeSlotSelector';
import PaymentSection from './PaymentSection';
import { venueService } from '../../services/venueService';
import { bookingService } from '../../services/bookingService';
import './BookingForm.css';

const BookingForm = ({ venueId, onSuccess }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { createBooking, loading, error } = useBooking();

  const [venue, setVenue] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [duration, setDuration] = useState(60); // minutes
  const [totalAmount, setTotalAmount] = useState(0);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [formStep, setFormStep] = useState(1); // 1: Date, 2: Time, 3: Court, 4: Payment
  const [formLoading, setFormLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchVenueDetails();
  }, [venueId, isAuthenticated]);

  useEffect(() => {
    console.log('=== useEffect for fetchAvailableSlots ===');
    console.log('useEffect triggered:', {
      venueId: venue?._id,
      selectedDate: selectedDate,
      courtId: selectedCourt?._id,
      duration: duration
    });
    
    if (venue?._id && selectedDate && selectedCourt?._id) {
      console.log('✅ All required data available, calling fetchAvailableSlots...');
      fetchAvailableSlots();
    } else {
      console.log('❌ Missing required data:', {
        hasVenue: !!venue?._id,
        hasDate: !!selectedDate,
        hasCourt: !!selectedCourt?._id
      });
    }

    console.log("fetch wala useEffect");
  }, [venue?._id, selectedDate, selectedCourt?._id, duration]);

  useEffect(() => {
    if (venue?._id && selectedCourt?._id && duration) {
      const basePrice = selectedCourt.pricePerHour || venue.pricing?.hourly || 0;
      const hours = duration / 60;
      setTotalAmount(basePrice * hours);
    }
  }, [venue?._id, selectedCourt?._id, duration]);

  const fetchAvailableSlots = useCallback(async () => {
    try {
      console.log('=== fetchAvailableSlots START ===');
      console.log('User authenticated:', isAuthenticated);
      console.log('Selected court:', selectedCourt);
      console.log('Selected date:', selectedDate);
      console.log('Court ID:', selectedCourt?._id);
      console.log('Date string:', selectedDate?.toISOString().split('T')[0]);
      
      if (!selectedCourt?._id) {
        console.error('No court selected');
        return;
      }
      
      if (!selectedDate) {
        console.error('No date selected');
        return;
      }
      
      console.log('Making API call to:', `/bookings/available-slots/${selectedCourt._id}/${selectedDate.toISOString().split('T')[0]}`);
      
      const response = await bookingService.getAvailableSlots(
        selectedCourt._id,
        selectedDate.toISOString().split('T')[0],
        duration
      );
      console.log('Available slots response:', response);
      
      // Handle the correct API response structure
      const slots = response.data || response || [];
      console.log('Extracted slots:', slots);
      setAvailableSlots(slots);
      console.log('=== fetchAvailableSlots END ===');
    } catch (error) {
      console.error('Error fetching available slots:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status
      });
      setAvailableSlots([]);
    }
  }, [selectedCourt?._id, selectedDate, duration, isAuthenticated]);

  const fetchVenueDetails = async () => {
    try {
      console.log("HEREeeeeeeee")
      setFormLoading(true);
      const response = await venueService.getVenueById(venueId);
      console.log('Venue response:', response);
      
      // Handle the correct API response structure
      let venueData;
      if (response.data?.venue) {
        // Structure: { data: { venue: {...} } }
        venueData = response.data.venue;
      } else if (response.data?.data?.venue) {
        // Structure: { data: { data: { venue: {...} } } }
        venueData = response.data.data.venue;
      } else if (response.data) {
        // Structure: { data: {...} }
        venueData = response.data;
      } else {
        // Fallback
        venueData = response;
      }
      
      console.log("Extracted venue data:", venueData);
      setVenue(venueData);

      // Set first court as default if available
      if (venueData?.courts && venueData.courts.length > 0) {
        console.log("Setting first court:", venueData.courts[0]);
        setSelectedCourt(venueData.courts[0]);
      } else {
        console.log("No courts found in venue data");
      }
    } catch (error) {
      console.error('Error fetching venue details:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDateChange = (date) => {
    // Only allow current date and future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date >= today) {
      // Create a stable date object by setting time to midnight
      const stableDate = new Date(date);
      stableDate.setHours(0, 0, 0, 0);
      
      setSelectedDate(stableDate);
      setSelectedTimeSlot(null);
      setFormStep(2);
    }
  };

  const handleTimeSlotChange = (slot) => {
    // Validate that start time is in the future
    const selectedDateTime = new Date(selectedDate);
    const [hours, minutes] = slot.startTime.split(':');
    selectedDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    if (selectedDateTime > new Date()) {
      setSelectedTimeSlot(slot);
      // Don't auto-advance to next step, let user click continue
    }
  };

  const handleCourtChange = (court) => {
    setSelectedCourt(court);
    setSelectedTimeSlot(null);
    setFormStep(2);
  };

  const handleDurationChange = (newDuration) => {
    setDuration(newDuration);
    setSelectedTimeSlot(null); // Clear selected time slot when duration changes
    // The useEffect will automatically refetch available slots with new duration
  };

  const handleContinueToPayment = () => {
    if (!selectedDate || !selectedTimeSlot || !selectedCourt) {
      alert('Please select date, time slot, and court');
      return;
    }

    setFormStep(4);
  };

  const handleCreateBooking = async () => {
    if (!selectedDate || !selectedTimeSlot || !selectedCourt) {
      alert('Please complete all selections');
      return;
    }

    const bookingData = {
      venue: venue._id,
      court: selectedCourt._id,
      date: selectedDate,
      startTime: selectedTimeSlot.startTime,
      endTime: selectedTimeSlot.endTime,
      duration,
      totalAmount,
      venueName: venue.name,
      courtName: selectedCourt.name,
      pricePerHour: selectedCourt.pricePerHour
    };

    try {
      const result = await createBooking(bookingData);
      if (result.success) {
        if (onSuccess) {
          onSuccess(result.booking);
        } else {
          navigate('/my-bookings');
        }
      }
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  const goToStep = (step) => {
    // Allow going to any step, but validate completion
    if (step >= 1 && step <= 4) {
      setFormStep(step);
    }
  };

  const isStepCompleted = (step) => {
    switch (step) {
      case 1:
        return selectedDate !== null;
      case 2:
        return selectedCourt !== null;
      case 3:
        return selectedTimeSlot !== null;
      case 4:
        return selectedDate && selectedTimeSlot && selectedCourt;
      default:
        return false;
    }
  };

  if (formLoading) {
    return (
      <div className="booking-form-loading">
        <div className="loading-spinner"></div>
        <p>Loading venue details...</p>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="booking-form-error">
        <p>Venue not found</p>
        <button onClick={() => navigate('/venues')}>Back to Venues</button>
      </div>
    );
  }

  return (
    <div className="booking-form-container">
      {/* Progress Steps */}
      <div className="booking-progress">
        <div className={`progress-step ${formStep >= 1 ? 'active' : ''} ${isStepCompleted(1) ? 'completed' : ''}`}>
          <div className="step-number">1</div>
          <span className="step-label">Select Date</span>
        </div>
        <div className={`progress-step ${formStep >= 2 ? 'active' : ''} ${isStepCompleted(2) ? 'completed' : ''}`}>
          <div className="step-number">2</div>
          <span className="step-label">Duration & Court</span>
        </div>
        <div className={`progress-step ${formStep >= 3 ? 'active' : ''} ${isStepCompleted(3) ? 'completed' : ''}`}>
          <div className="step-number">3</div>
          <span className="step-label">Choose Time</span>
        </div>
        <div className={`progress-step ${formStep >= 4 ? 'active' : ''} ${isStepCompleted(4) ? 'completed' : ''}`}>
          <div className="step-number">4</div>
          <span className="step-label">Confirm & Pay</span>
        </div>
      </div>

      {/* Form Content */}
      <div className="booking-form-content">
        {/* Step 1: Date Selection */}
        {formStep === 1 && (
          <div className="form-step">
            <div className="step-header">
              <h2>Select Date</h2>
              <p>Choose the date for your booking</p>
            </div>
            <BookingCalendar
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              minDate={new Date()}
            />
          </div>
        )}

        {/* Step 2: Duration & Court Selection */}
        {formStep === 2 && (
          <div className="form-step">
            <div className="step-header">
              <h2>Select Duration & Court</h2>
              <p>Choose your preferred duration and court</p>
            </div>
            <div className="court-selection">
              <div className="duration-selector">
                <label htmlFor="duration">Duration:</label>
                <select
                  id="duration"
                  value={duration}
                  onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                  className="duration-select"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                  <option value={180}>3 hours</option>
                </select>
              </div>
              
              <div className="courts-grid">
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
            <div className="step-navigation">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => goToStep(1)}
              >
                Back to Date
              </button>
              <button 
                type="button" 
                className="btn-primary"
                onClick={() => goToStep(3)}
                disabled={!selectedCourt}
              >
                Continue to Time Selection
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Time Slot Selection */}
        {formStep === 3 && (
          <div className="form-step">
            <div className="step-header">
              <h2>Choose Time</h2>
              <p>Select your preferred time slot</p>
            </div>
            <TimeSlotSelector
              availableSlots={availableSlots}
              selectedSlot={selectedTimeSlot}
              onSlotChange={handleTimeSlotChange}
              operatingHours={venue.operatingHours}
              selectedDuration={duration}
            />
            <div className="step-navigation">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => goToStep(2)}
              >
                Back to Court Selection
              </button>
              <button 
                type="button" 
                className="btn-primary"
                onClick={() => goToStep(4)}
                disabled={!selectedTimeSlot}
              >
                Continue to Payment
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Payment & Confirmation */}
        {formStep === 4 && (
          <div className="form-step">
            <div className="step-header">
              <h2>Confirm & Pay</h2>
              <p>Review your booking details and proceed to payment</p>
            </div>
            <PaymentSection
              totalAmount={totalAmount}
              onContinue={handleCreateBooking}
              disabled={!selectedDate || !selectedTimeSlot || !selectedCourt}
              bookingDetails={{
                venue: venue._id,
                court: selectedCourt._id,
                date: selectedDate,
                startTime: selectedTimeSlot.startTime,
                endTime: selectedTimeSlot.endTime,
                duration,
                totalAmount,
                venueName: venue.name,
                courtName: selectedCourt.name,
                pricePerHour: selectedCourt.pricePerHour
              }}
            />
            <div className="step-navigation">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={() => goToStep(3)}
              >
                Back to Court Selection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingForm;

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
import { toast } from 'react-hot-toast';
import { FiCalendar, FiClock, FiGrid, FiUsers, FiCreditCard, FiArrowRight, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';

const BookingForm = ({ venueId, onSuccess }) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { createBooking } = useBooking();

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
  const [formStep, setFormStep] = useState(1);
  const [formLoading, setFormLoading] = useState(true);
  const [playerMode, setPlayerMode] = useState('team');
  const [matchMode, setMatchMode] = useState('private');
  const [teamSize, setTeamSize] = useState(10);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchVenueDetails();
  }, [venueId, isAuthenticated]);

  useEffect(() => {
    if (venue?._id && selectedDate && selectedCourt?._id) {
      fetchAvailableSlots();
    }
  }, [venue?._id, selectedDate, selectedCourt?._id, duration]);

  useEffect(() => {
    if (venue?._id && selectedCourt?._id && duration) {
      const basePrice = selectedCourt.pricePerHour || venue.pricing?.hourly || 0;
      const hours = duration / 60;
      setTotalAmount(basePrice * hours);
    }
  }, [venue?._id, selectedCourt?._id, duration]);

  useEffect(() => {
    if (selectedCourt?.sport) {
      const sport = selectedCourt.sport;
      let defaultSize = 10;
      if (['Badminton', 'Tennis', 'Table Tennis'].includes(sport)) defaultSize = 2;
      else if (sport === 'Pickleball') defaultSize = 4;
      else if (['Volleyball', 'Basketball'].includes(sport)) defaultSize = 12;
      else if (['Football', 'Box Cricket'].includes(sport)) defaultSize = 14;
      else if (sport === 'Turf Games') defaultSize = 16;
      setTeamSize(defaultSize);
    }
  }, [selectedCourt?.sport]);

  const fetchAvailableSlots = useCallback(async () => {
    try {
      if (!isAuthenticated || !selectedCourt?._id || !selectedDate) return;
      const response = await bookingService.getAvailableSlots(
        selectedCourt._id,
        selectedDate.toISOString().split('T')[0],
        duration
      );
      let slots = [];
      if (response.data && response.data.status === 'success' && Array.isArray(response.data.data)) {
        slots = response.data.data;
      } else if (Array.isArray(response.data)) {
        slots = response.data;
      } else if (response.data && typeof response.data === 'object') {
        slots = response.data.slots || response.data.availableSlots || response.data.data || [];
      }
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      if (error.response?.status === 401) navigate('/login');
      setAvailableSlots([]);
    }
  }, [selectedCourt?._id, selectedDate, duration, isAuthenticated]);

  const fetchVenueDetails = async () => {
    try {
      setFormLoading(true);
      const response = await venueService.getVenueById(venueId);
      let venueData = response.data?.data?.venue || response.data?.venue || response.data || response;
      setVenue(venueData);
      if (venueData?.courts?.length > 0) setSelectedCourt(venueData.courts[0]);
      if (venueData?.slotDuration) setDuration(venueData.slotDuration);
    } catch (error) {
      console.error('Error fetching venue details:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDateChange = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date >= today) {
      const stableDate = new Date(date);
      stableDate.setHours(0, 0, 0, 0);
      setSelectedDate(stableDate);
      setSelectedTimeSlot(null);
      setFormStep(2);
    }
  };

  const handleTimeSlotChange = (slot) => {
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
    setFormStep(2);
  };

  const handleDurationChange = (newDuration) => {
    setDuration(newDuration);
    setSelectedTimeSlot(null);
  };

  const handleCreateBooking = async (paymentData = {}) => {
    if (!selectedDate || !selectedTimeSlot || !selectedCourt) {
      toast.error('Complete all selections');
      return;
    }

    const bookingData = {
      venue: venue._id,
      court: selectedCourt._id,
      date: selectedDate.toLocaleDateString('en-CA'),
      startTime: selectedTimeSlot.startTime,
      endTime: selectedTimeSlot.endTime,
      duration,
      totalAmount,
      venueName: venue.name,
      courtName: selectedCourt.name,
      pricePerHour: selectedCourt.pricePerHour,
      playerMode,
      matchMode,
      teamSize,
      ...paymentData
    };

    try {
      const result = await createBooking(bookingData);
      if (result.success) {
        toast.success(`Success! Venue booked successfully.`, {
          style: { borderRadius: '10px', background: '#333', color: '#fff' }
        });
        navigate('/my-bookings');
        if (onSuccess) onSuccess(result.booking);
      } else {
        toast.error(result.message || 'Booking failed.');
      }
      return result;
    } catch (error) {
      toast.error('An unexpected error occurred: ' + error.message);
      return { success: false, error: error.message };
    }
  };

  const isStepCompleted = (step) => {
    switch (step) {
      case 1: return selectedDate !== null;
      case 2: return selectedCourt !== null;
      case 3: return selectedTimeSlot !== null;
      case 4: return selectedDate && selectedTimeSlot && selectedCourt;
      default: return false;
    }
  };

  if (formLoading) return (
    <div className="p-20 flex flex-col items-center justify-center bg-white rounded-3xl">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500 font-medium">Syncing with facility systems...</p>
    </div>
  );

  if (!venue) return (
    <div className="p-20 text-center bg-white rounded-3xl">
      <p className="text-gray-500 mb-6 font-bold">Venue not found</p>
      <button onClick={() => navigate('/venues')} className="bg-primary text-white px-8 py-3 rounded-xl font-bold">Back to Venues</button>
    </div>
  );

  const steps = [
    { id: 1, label: 'Date', icon: <FiCalendar /> },
    { id: 2, label: 'Facility', icon: <FiGrid /> },
    { id: 3, label: 'Schedule', icon: <FiClock /> },
    { id: 4, label: 'Match', icon: <FiUsers /> },
    { id: 5, label: 'Confirm', icon: <FiCreditCard /> },
  ];

  return (
    <div className="p-8 md:p-12">
      {/* Premium Progress Steps */}
      <div className="flex justify-between items-center mb-12 relative">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-primary transition-all duration-500 -translate-y-1/2 z-0"
          style={{ width: `${((formStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>
        
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => isStepCompleted(step.id - 1) && setFormStep(step.id)}
            disabled={step.id > 1 && !isStepCompleted(step.id - 1)}
            className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
              formStep === step.id ? 'bg-primary border-primary text-white scale-125 shadow-lg shadow-primary/30' :
              formStep > step.id ? 'bg-primary/10 border-primary text-primary' :
              'bg-white border-gray-100 text-gray-300'
            }`}
          >
            {formStep > step.id ? <FiCheckCircle /> : step.icon}
            <span className={`absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${
              formStep === step.id ? 'text-primary' : 'text-gray-400'
            }`}>
              {step.label}
            </span>
          </button>
        ))}
      </div>

      {/* Animated Step Content */}
      <div className="mt-16 animate-fade-in">
        {formStep === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-800">Select Date</h2>
              <p className="text-gray-500 text-sm">Choose when you want to dominate the court.</p>
            </div>
            <div className="max-w-2xl mx-auto bg-gray-50 p-6 rounded-3xl border border-gray-100 shadow-inner">
              <BookingCalendar
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
                minDate={new Date()}
              />
            </div>
          </div>
        )}

        {formStep === 2 && (
          <div className="space-y-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-800">Duration & Court</h2>
              <p className="text-gray-500 text-sm">Select your facility and session length.</p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8">
              <div className="md:w-1/3 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-4">Session Length</label>
                <div className="grid grid-cols-1 gap-3">
                  {[30, 60, 90, 120, 180].map(mins => (
                    <button
                      key={mins}
                      onClick={() => handleDurationChange(mins)}
                      className={`py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all ${
                        duration === mins ? 'border-primary bg-primary text-white' : 'border-gray-50 bg-gray-50 text-gray-500 hover:border-primary/20'
                      }`}
                    >
                      {mins >= 60 ? `${mins / 60} Hour${mins > 60 ? 's' : ''}` : `${mins} Mins`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:w-2/3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-4 px-2">Choose Facility</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {venue.courts?.map(court => (
                    <button
                      key={court._id}
                      onClick={() => handleCourtChange(court)}
                      className={`p-6 rounded-3xl border-2 text-left transition-all group ${
                        selectedCourt?._id === court._id ? 'border-primary bg-primary/5' : 'border-gray-50 bg-gray-50 hover:border-primary/20'
                      }`}
                    >
                      <h4 className={`font-bold mb-1 ${selectedCourt?._id === court._id ? 'text-primary' : 'text-gray-800'}`}>{court.name}</h4>
                      <p className="text-xs text-gray-500 mb-4">{court.sport} • {court.surface}</p>
                      <span className={`text-sm font-bold ${selectedCourt?._id === court._id ? 'text-primary' : 'text-primary-light'}`}>₹{court.pricePerHour}/hr</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-8 border-t border-gray-50">
              <button onClick={() => setFormStep(1)} className="flex items-center gap-2 text-gray-400 font-bold hover:text-gray-600 transition-colors">
                <FiArrowLeft /> Back to Date
              </button>
              <button onClick={() => setFormStep(3)} disabled={!selectedCourt} className="bg-primary text-white px-10 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all">
                Continue <FiArrowRight />
              </button>
            </div>
          </div>
        )}

        {formStep === 3 && (
          <div className="space-y-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-800">Select Time</h2>
              <p className="text-gray-500 text-sm">Choose your preferred slot for {duration} mins.</p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <TimeSlotSelector
                availableSlots={availableSlots}
                selectedSlot={selectedTimeSlot}
                onSlotChange={handleTimeSlotChange}
                operatingHours={venue.operatingHours}
                selectedDuration={duration}
              />
            </div>

            <div className="flex justify-between pt-8 border-t border-gray-50">
              <button onClick={() => setFormStep(2)} className="flex items-center gap-2 text-gray-400 font-bold hover:text-gray-600 transition-colors">
                <FiArrowLeft /> Back to Facility
              </button>
              <button onClick={() => setFormStep(4)} disabled={!selectedTimeSlot} className="bg-primary text-white px-10 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all">
                Setup Match <FiArrowRight />
              </button>
            </div>
          </div>
        )}

        {formStep === 4 && (
          <div className="space-y-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-800">Match Setup</h2>
              <p className="text-gray-500 text-sm">Configure how others can interact with your game.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { id: 'private', title: 'Private Match', desc: 'Invite-only. Completely private session.' },
                { id: 'public', title: 'Open Joiners', desc: 'Allow others to request to join your game.' },
                { id: 'looking', title: 'Find Team', desc: 'System will find a team for you to join.' },
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setMatchMode(mode.id)}
                  className={`p-6 rounded-3xl border-2 text-left transition-all ${
                    matchMode === mode.id ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-gray-50 bg-gray-50'
                  }`}
                >
                  <h4 className={`font-bold mb-2 ${matchMode === mode.id ? 'text-primary' : 'text-gray-800'}`}>{mode.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{mode.desc}</p>
                </button>
              ))}
            </div>

            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex gap-4">
                {['single', 'duo', 'team'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => { setPlayerMode(mode); if(mode !== 'team') setTeamSize(mode === 'single' ? 1 : 2); }}
                    className={`px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                      playerMode === mode ? 'bg-primary text-white' : 'bg-white text-gray-400 border border-gray-100'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              
              {playerMode === 'team' && (
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Team Size:</span>
                  <div className="flex items-center bg-white border border-gray-100 rounded-xl px-2">
                    <button onClick={() => setTeamSize(Math.max(3, teamSize - 1))} className="p-2 text-primary">-</button>
                    <input 
                      type="number" 
                      value={teamSize} 
                      onChange={(e) => setTeamSize(parseInt(e.target.value))}
                      className="w-12 text-center font-bold text-gray-800 border-none focus:ring-0" 
                    />
                    <button onClick={() => setTeamSize(Math.min(22, teamSize + 1))} className="p-2 text-primary">+</button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-8 border-t border-gray-50">
              <button onClick={() => setFormStep(3)} className="flex items-center gap-2 text-gray-400 font-bold hover:text-gray-600 transition-colors">
                <FiArrowLeft /> Back to Schedule
              </button>
              <button onClick={() => setFormStep(5)} className="bg-primary text-white px-10 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all">
                Go to Payment <FiArrowRight />
              </button>
            </div>
          </div>
        )}

        {formStep === 5 && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-800">Checkout</h2>
              <p className="text-gray-500 text-sm">Secure your session with our encrypted payment gateway.</p>
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

            <div className="flex justify-start pt-8 border-t border-gray-50">
              <button onClick={() => setFormStep(4)} className="flex items-center gap-2 text-gray-400 font-bold hover:text-gray-600 transition-colors">
                <FiArrowLeft /> Edit Match Setup
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingForm;


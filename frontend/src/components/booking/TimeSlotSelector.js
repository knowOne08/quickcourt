// frontend/src/components/booking/TimeSlotSelector.js
import React, { useState, useEffect } from 'react';
import './TimeSlotSelector.css';

const TimeSlotSelector = ({ 
  availableSlots, 
  selectedSlot, 
  onSlotChange, 
  operatingHours,
  selectedDuration = 60, // Get duration from parent
  disabled = false 
}) => {
  const [filteredSlots, setFilteredSlots] = useState([]);

  console.log('TimeSlotSelector received props:', {
    availableSlots,
    slotsLength: availableSlots?.length,
    slotsType: typeof availableSlots,
    isArray: Array.isArray(availableSlots)
  });

  useEffect(() => {
    console.log('TimeSlotSelector - useEffect triggered:', {
      availableSlots: availableSlots?.length,
      selectedDuration,
      slotsData: availableSlots
    });
    
    if (availableSlots && availableSlots.length > 0) {

      console.log('Available slots:', availableSlots);
      // Filter slots that can accommodate the selected duration
      const filtered = availableSlots.filter(slot => {
        if (!slot.available) return false;
        
        // For single slot bookings (60 minutes or less)
        if (selectedDuration <= 70) {
          return true;
        }
        
        // For longer durations, check if we have enough consecutive available slots
        const requiredSlots = Math.ceil(selectedDuration / 60);
        const slotIndex = availableSlots.findIndex(s => s.startTime === slot.startTime);
        
        // Check if we have enough consecutive slots from this position
        for (let i = 0; i < requiredSlots; i++) {
          const checkSlot = availableSlots[slotIndex + i];
          if (!checkSlot || !checkSlot.available) {
            return false;
          }
        }
        
        return true;
      });
      
      console.log('TimeSlotSelector - Filtered slots:', {
        original: availableSlots.length,
        filtered: filtered.length,
        filteredData: filtered
      });
      
      setFilteredSlots(filtered);
    } else {
      console.log('TimeSlotSelector - No available slots to filter');
      setFilteredSlots([]);
    }
  }, [availableSlots, selectedDuration]);

  const handleSlotClick = (slot) => {
    if (disabled || !slot.available) return;
    
    // Calculate end time based on selected duration
    const startTime = new Date(`2000-01-01T${slot.startTime}`);
    const endTime = new Date(startTime.getTime() + selectedDuration * 60000);
    
    // Ensure end time doesn't exceed venue closing time
    const venueCloseTime = new Date(`2000-01-01T${operatingHours?.end || '23:00'}`);
    const actualEndTime = endTime > venueCloseTime ? venueCloseTime : endTime;
    
    const selectedSlotData = {
      ...slot,
      endTime: actualEndTime.toTimeString().slice(0, 5),
      duration: selectedDuration,
      startTime: slot.startTime
    };
    
    onSlotChange(selectedSlotData);
  };

  const isSlotSelected = (slot) => {
    if (!selectedSlot) return false;
    return selectedSlot.startTime === slot.startTime;
  };

  const canSlotAccommodateDuration = (slot) => {
    if (selectedDuration <= 60) return true;
    
    const requiredSlots = Math.ceil(selectedDuration / 60);
    const slotIndex = availableSlots.findIndex(s => s.startTime === slot.startTime);
    
    // Check if we have enough consecutive slots from this position
    for (let i = 0; i < requiredSlots; i++) {
      const checkSlot = availableSlots[slotIndex + i];
      if (!checkSlot || !checkSlot.available) {
        return false;
      }
    }
    
    return true;
  };

  const calculateEndTime = (startTime, durationMinutes) => {
    try {
      const startDate = new Date(`2000-01-01T${startTime}`);
      const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
      return endDate.toTimeString().slice(0, 5);
    } catch (error) {
      console.error('Error calculating end time:', error, { startTime, durationMinutes });
      return startTime; // fallback to start time
    }
  };

  const formatTime = (time) => {
    // Handle both string and number inputs
    if (typeof time === 'number') {
      // If it's a timestamp, convert to time string
      const date = new Date(time);
      time = date.toTimeString().slice(0, 5);
    }
    
    if (typeof time !== 'string') {
      console.error('formatTime received invalid input:', time, typeof time);
      return '00:00';
    }

    const parts = time.split(':');
    if (parts.length < 2) {
      console.error('formatTime: invalid time format:', time);
      return '00:00';
    }

    const [hours, minutes] = parts;
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };



  if (!availableSlots || availableSlots.length === 0) {
    return (
      <div className="time-slot-selector">
        <div className="no-slots">
          <p>No time slots available for the selected date.</p>
          <p>Please try a different date.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="time-slot-selector">
      <div className="duration-info">
        <small>
          ⓘ Selected duration: {selectedDuration} minutes
          {selectedDuration > 60 && (
            <span> - We'll book consecutive time slots automatically.</span>
          )}
        </small>
      </div>

      <div className="slots-grid">
        {filteredSlots.length > 0 ? (
          filteredSlots.map((slot, index) => (
            <button
              key={index}
              type="button"
              className={`time-slot ${
                isSlotSelected(slot) ? 'selected' : ''
              } ${
                !slot.available ? 'unavailable' : ''
              }`}
              onClick={() => handleSlotClick(slot)}
              disabled={disabled || !slot.available}
              aria-label={`${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`}
            >
              <div className="slot-time">
                <span className="start-time">{formatTime(slot.startTime)}</span>
                <span className="time-separator">-</span>
                <span className="end-time">
                  {formatTime(calculateEndTime(slot.startTime, selectedDuration))}
                </span>
              </div>
              <div className="slot-price">
                ₹{slot.price}/hour
              </div>
              <div className="slot-status">
                {slot.available ? 'Available' : 'Booked'}
              </div>
            </button>
          ))
        ) : (
          <div className="no-available-slots">
            <p>No {selectedDuration}-minute slots available for the selected duration.</p>
            <p>Try selecting a shorter duration or different date.</p>
          </div>
        )}
      </div>

      {selectedSlot && (
        <div className="selected-slot-info">
          <h4>Selected Time Slot:</h4>
          <div className="slot-details">
            <p><strong>Time:</strong> {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}</p>
            <p><strong>Duration:</strong> {selectedDuration / 60} hour{selectedDuration / 60 !== 1 ? 's' : ''}</p>
            <p><strong>Price:</strong> ₹{selectedSlot.price}/hour</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSlotSelector;

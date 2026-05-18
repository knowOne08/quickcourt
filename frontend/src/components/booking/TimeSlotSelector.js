// frontend/src/components/booking/TimeSlotSelector.js
import React, { useState, useEffect } from 'react';
import { FiClock, FiInfo, FiCheck } from 'react-icons/fi';

const TimeSlotSelector = ({ 
  availableSlots, 
  selectedSlot, 
  onSlotChange, 
  operatingHours,
  selectedDuration = 60,
  disabled = false 
}) => {
  const [filteredSlots, setFilteredSlots] = useState([]);

  useEffect(() => {
    if (availableSlots && availableSlots.length > 0) {
      const filtered = availableSlots.filter(slot => {
        if (!slot.available) return false;
        if (selectedDuration <= 70) return true;
        const requiredSlots = Math.ceil(selectedDuration / 60);
        const slotIndex = availableSlots.findIndex(s => s.startTime === slot.startTime);
        for (let i = 0; i < requiredSlots; i++) {
          const checkSlot = availableSlots[slotIndex + i];
          if (!checkSlot || !checkSlot.available) return false;
        }
        return true;
      });
      setFilteredSlots(filtered);
    } else {
      setFilteredSlots([]);
    }
  }, [availableSlots, selectedDuration]);

  const handleSlotClick = (slot) => {
    if (disabled || !slot.available) return;
    const startTime = new Date(`2000-01-01T${slot.startTime}`);
    const endTime = new Date(startTime.getTime() + selectedDuration * 60000);
    const venueCloseTime = new Date(`2000-01-01T${operatingHours?.end || '23:00'}`);
    const actualEndTime = endTime > venueCloseTime ? venueCloseTime : endTime;
    
    onSlotChange({
      ...slot,
      endTime: actualEndTime.toTimeString().slice(0, 5),
      duration: selectedDuration,
      startTime: slot.startTime
    });
  };

  const calculateEndTime = (startTime, durationMinutes) => {
    try {
      const startDate = new Date(`2000-01-01T${startTime}`);
      const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
      return endDate.toTimeString().slice(0, 5);
    } catch (error) {
      return startTime;
    }
  };

  const formatTime = (time) => {
    if (typeof time === 'number') {
      const date = new Date(time);
      time = date.toTimeString().slice(0, 5);
    }
    if (typeof time !== 'string' || !time.includes(':')) return '00:00';
    const parts = time.split(':');
    const hour = parseInt(parts[0]);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${parts[1]} ${ampm}`;
  };

  if (!availableSlots || availableSlots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
        <FiClock className="text-gray-300 mb-4" size={48} />
        <p className="text-gray-500 font-bold">No slots available</p>
        <p className="text-gray-400 text-sm">Please try a different date or duration.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 bg-primary/5 p-4 rounded-2xl border border-primary/10">
        <FiInfo className="text-primary" />
        <p className="text-xs font-medium text-primary">
          Selected duration: <span className="font-bold">{selectedDuration} minutes</span>. 
          {selectedDuration > 60 && " We'll book consecutive slots automatically."}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filteredSlots.length > 0 ? (
          filteredSlots.map((slot, index) => (
            <button
              key={index}
              type="button"
              disabled={disabled || !slot.available}
              onClick={() => handleSlotClick(slot)}
              className={`p-4 rounded-2xl border-2 text-left transition-all relative group ${
                selectedSlot?.startTime === slot.startTime ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20' :
                !slot.available ? 'bg-gray-50 border-gray-50 opacity-40 cursor-not-allowed' :
                'bg-white border-gray-100 hover:border-primary/30'
              }`}
            >
              <div className={`text-sm font-bold mb-1 ${selectedSlot?.startTime === slot.startTime ? 'text-white' : 'text-gray-800'}`}>
                {formatTime(slot.startTime)}
              </div>
              <div className={`text-[10px] uppercase tracking-widest font-bold ${selectedSlot?.startTime === slot.startTime ? 'text-white/80' : 'text-primary'}`}>
                ₹{slot.price}
              </div>
              {selectedSlot?.startTime === slot.startTime && (
                <div className="absolute top-2 right-2 text-white">
                  <FiCheck size={14} />
                </div>
              )}
            </button>
          ))
        ) : (
          <div className="col-span-full p-8 text-center bg-gray-50 rounded-2xl">
            <p className="text-gray-500 text-sm">No {selectedDuration}-minute slots available. Try a shorter duration.</p>
          </div>
        )}
      </div>

      {selectedSlot && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm animate-fade-in">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Reservation Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Schedule</p>
              <p className="text-sm font-bold text-gray-800">
                {formatTime(selectedSlot.startTime)} - {formatTime(calculateEndTime(selectedSlot.startTime, selectedDuration))}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Duration</p>
              <p className="text-sm font-bold text-gray-800">{selectedDuration / 60} Hour{selectedDuration / 60 !== 1 ? 's' : ''}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Base Rate</p>
              <p className="text-sm font-bold text-gray-800">₹{selectedSlot.price}/hr</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Total</p>
              <p className="text-sm font-bold text-primary">₹{(selectedSlot.price * (selectedDuration / 60)).toFixed(0)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeSlotSelector;


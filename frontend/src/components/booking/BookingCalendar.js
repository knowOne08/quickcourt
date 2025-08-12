// frontend/src/components/booking/BookingCalendar.js
import React, { useState, useEffect, useMemo } from 'react';
import './BookingCalendar.css';

const BookingCalendar = ({ selectedDate, onDateChange, minDate, maxDate, disabledDates = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);

  // Memoize the disabledDates array to prevent infinite re-renders
  const memoizedDisabledDates = useMemo(() => disabledDates, [JSON.stringify(disabledDates)]);

  useEffect(() => {
    generateCalendarDays();
  }, [currentMonth, minDate, maxDate, memoizedDisabledDates]);

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    // Calculate days from previous month to show
    const daysFromPrevMonth = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const days = [];
    
    // Add days from previous month
    for (let i = daysFromPrevMonth; i > 0; i--) {
      const prevDate = new Date(year, month, 1 - i);
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        isDisabled: isDateDisabled(prevDate),
        isPast: isDatePast(prevDate)
      });
    }
    
    // Add days from current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currentDate = new Date(year, month, i);
      days.push({
        date: currentDate,
        isCurrentMonth: true,
        isDisabled: isDateDisabled(currentDate),
        isPast: isDatePast(currentDate),
        isSelected: isSameDate(currentDate, selectedDate)
      });
    }
    
    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        isDisabled: isDateDisabled(nextDate),
        isPast: isDatePast(nextDate)
      });
    }
    
    setCalendarDays(days);
  };

  const isDateDisabled = (date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    if (disabledDates.some(disabledDate => isSameDate(date, disabledDate))) return true;
    return false;
  };

  const isDatePast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isSameDate = (date1, date2) => {
    if (!date1 || !date2) return false;
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  };

  const handleDateClick = (day) => {
    if (day.isDisabled || day.isPast) return;
    onDateChange(day.date);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    if (!isDateDisabled(today)) {
      onDateChange(today);
    }
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatDayName = (dayIndex) => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days[dayIndex];
  };

  return (
    <div className="booking-calendar">
      <div className="calendar-header">
        <button 
          type="button"
          className="calendar-nav-btn"
          onClick={goToPreviousMonth}
          aria-label="Previous month"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6"></polyline>
          </svg>
        </button>
        
        <h3 className="calendar-title">{formatMonthYear(currentMonth)}</h3>
        
        <button 
          type="button"
          className="calendar-nav-btn"
          onClick={goToNextMonth}
          aria-label="Next month"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9,18 15,12 9,6"></polyline>
          </svg>
        </button>
      </div>

      <button 
        type="button"
        className="today-btn"
        onClick={goToToday}
      >
        Today
      </button>

      <div className="calendar-weekdays">
        {[1, 2, 3, 4, 5, 6, 0].map(dayIndex => (
          <div key={dayIndex} className="weekday">
            {formatDayName(dayIndex)}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {calendarDays.map((day, index) => (
          <button
            key={index}
            type="button"
            className={`calendar-day ${
              day.isCurrentMonth ? 'current-month' : 'other-month'
            } ${
              day.isSelected ? 'selected' : ''
            } ${
              day.isDisabled ? 'disabled' : ''
            } ${
              day.isPast ? 'past' : ''
            }`}
            onClick={() => handleDateClick(day)}
            disabled={day.isDisabled || day.isPast}
            aria-label={`${day.date.toDateString()}${day.isSelected ? ' (selected)' : ''}`}
          >
            <span className="day-number">{day.date.getDate()}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BookingCalendar;

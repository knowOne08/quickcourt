// frontend/src/components/booking/BookingCalendar.js
import React, { useState, useEffect, useMemo } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const BookingCalendar = ({ selectedDate, onDateChange, minDate, maxDate, disabledDates = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);

  const memoizedDisabledDates = useMemo(() => disabledDates, [JSON.stringify(disabledDates)]);

  useEffect(() => {
    generateCalendarDays();
  }, [currentMonth, minDate, maxDate, memoizedDisabledDates]);

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysFromPrevMonth = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    const days = [];

    for (let i = daysFromPrevMonth; i > 0; i--) {
      const prevDate = new Date(year, month, 1 - i);
      days.push({ date: prevDate, isCurrentMonth: false, isDisabled: isDateDisabled(prevDate), isPast: isDatePast(prevDate) });
    }

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

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false, isDisabled: isDateDisabled(nextDate), isPast: isDatePast(nextDate) });
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

  const goToPreviousMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    if (!isDateDisabled(today)) onDateChange(today);
  };

  const formatMonthYear = (date) => date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="w-full select-none">
      <div className="flex items-center justify-between mb-6 px-2">
        <button type="button" onClick={goToPreviousMonth} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <FiChevronLeft size={20} />
        </button>
        <h3 className="text-lg font-bold text-gray-800">{formatMonthYear(currentMonth)}</h3>
        <button type="button" onClick={goToNextMonth} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <FiChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center py-2">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <button
            key={index}
            type="button"
            disabled={day.isDisabled || day.isPast}
            onClick={() => handleDateClick(day)}
            className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all relative ${
              day.isSelected ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105 z-10' :
              day.isPast || day.isDisabled ? 'text-gray-200 cursor-not-allowed' :
              day.isCurrentMonth ? 'text-gray-700 hover:bg-primary/5 hover:text-primary' : 'text-gray-300'
            }`}
          >
            {day.date.getDate()}
            {isSameDate(day.date, new Date()) && !day.isSelected && (
              <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary"></div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <button type="button" onClick={goToToday} className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">
          Go to Today
        </button>
      </div>
    </div>
  );
};

export default BookingCalendar;


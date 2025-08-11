// frontend/src/context/BookingContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { bookingService } from '../services/bookingService';

const BookingContext = createContext();

const initialState = {
  currentBooking: null,
  userBookings: [],
  selectedVenue: null,
  selectedCourt: null,
  selectedDate: null,
  selectedTimeSlot: null,
  bookingStep: 'venue', // venue, court, time, payment, confirmation
  loading: false,
  error: null
};

const bookingReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
        error: null
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case 'SET_SELECTED_VENUE':
      return {
        ...state,
        selectedVenue: action.payload,
        selectedCourt: null,
        bookingStep: 'court'
      };
    case 'SET_SELECTED_COURT':
      return {
        ...state,
        selectedCourt: action.payload,
        bookingStep: 'time'
      };
    case 'SET_SELECTED_DATE':
      return {
        ...state,
        selectedDate: action.payload,
        selectedTimeSlot: null
      };
    case 'SET_SELECTED_TIME_SLOT':
      return {
        ...state,
        selectedTimeSlot: action.payload,
        bookingStep: 'payment'
      };
    case 'SET_CURRENT_BOOKING':
      return {
        ...state,
        currentBooking: action.payload
      };
    case 'SET_USER_BOOKINGS':
      return {
        ...state,
        userBookings: action.payload
      };
    case 'ADD_BOOKING':
      return {
        ...state,
        userBookings: [action.payload, ...state.userBookings],
        currentBooking: action.payload
      };
    case 'UPDATE_BOOKING':
      return {
        ...state,
        userBookings: state.userBookings.map(booking =>
          booking._id === action.payload._id ? action.payload : booking
        ),
        currentBooking: state.currentBooking?._id === action.payload._id 
          ? action.payload 
          : state.currentBooking
      };
    case 'CANCEL_BOOKING':
      return {
        ...state,
        userBookings: state.userBookings.map(booking =>
          booking._id === action.payload ? { ...booking, status: 'cancelled' } : booking
        )
      };
    case 'RESET_BOOKING':
      return {
        ...initialState,
        userBookings: state.userBookings
      };
    case 'SET_BOOKING_STEP':
      return {
        ...state,
        bookingStep: action.payload
      };
    default:
      return state;
  }
};

export const BookingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  // Load user bookings on component mount
  useEffect(() => {
    loadUserBookings();
  }, []);

  const loadUserBookings = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await bookingService.getUserBookings();
      dispatch({ type: 'SET_USER_BOOKINGS', payload: response.data });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to load bookings' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const createBooking = async (bookingData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await bookingService.createBooking(bookingData);
      dispatch({ type: 'ADD_BOOKING', payload: response.data });
      dispatch({ type: 'SET_BOOKING_STEP', payload: 'confirmation' });
      return { success: true, booking: response.data };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to create booking' });
      return { success: false, message: error.response?.data?.message || 'Failed to create booking' };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const cancelBooking = async (bookingId, reason = '') => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await bookingService.cancelBooking(bookingId, reason);
      dispatch({ type: 'CANCEL_BOOKING', payload: bookingId });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.response?.data?.message || 'Failed to cancel booking' });
      return { success: false, message: error.response?.data?.message || 'Failed to cancel booking' };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const setSelectedVenue = (venue) => {
    dispatch({ type: 'SET_SELECTED_VENUE', payload: venue });
  };

  const setSelectedCourt = (court) => {
    dispatch({ type: 'SET_SELECTED_COURT', payload: court });
  };

  const setSelectedDate = (date) => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: date });
  };

  const setSelectedTimeSlot = (timeSlot) => {
    dispatch({ type: 'SET_SELECTED_TIME_SLOT', payload: timeSlot });
  };

  const resetBooking = () => {
    dispatch({ type: 'RESET_BOOKING' });
  };

  const setBookingStep = (step) => {
    dispatch({ type: 'SET_BOOKING_STEP', payload: step });
  };

  const value = {
    // State
    currentBooking: state.currentBooking,
    userBookings: state.userBookings,
    selectedVenue: state.selectedVenue,
    selectedCourt: state.selectedCourt,
    selectedDate: state.selectedDate,
    selectedTimeSlot: state.selectedTimeSlot,
    bookingStep: state.bookingStep,
    loading: state.loading,
    error: state.error,
    
    // Actions
    createBooking,
    cancelBooking,
    setSelectedVenue,
    setSelectedCourt,
    setSelectedDate,
    setSelectedTimeSlot,
    resetBooking,
    setBookingStep,
    loadUserBookings
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
};
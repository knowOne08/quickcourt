// frontend/src/hooks/useBookings.js
import { useState, useEffect, useCallback } from 'react';
import { bookingService } from '../services/bookingService';

export const useBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });

  const fetchUserBookings = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await bookingService.getUserBookings(params);

      if (response.data?.status === 'success') {
        setBookings(response.data.data.bookings);
        setPagination({
          currentPage: response.data.data.currentPage,
          totalPages: response.data.data.totalPages,
          total: response.data.data.total
        });
      } else {
        throw new Error('Failed to fetch bookings');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBooking = useCallback(async (bookingData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await bookingService.createBooking(bookingData);

      if (response.data?.status === 'success') {
        // Refresh bookings list
        await fetchUserBookings();
        return { success: true, booking: response.data.data.booking };
      } else {
        throw new Error('Failed to create booking');
      }
    } catch (err) {
      setError(err.message || 'Failed to create booking');
      console.error('Error creating booking:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [fetchUserBookings]);

  const cancelBooking = useCallback(async (bookingId, reason) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await bookingService.cancelBooking(bookingId, reason);

      if (response.data?.status === 'success') {
        // Update the booking in the list
        setBookings(prev => 
          prev.map(booking => 
            booking._id === bookingId 
              ? { ...booking, status: 'cancelled' }
              : booking
          )
        );
        return { success: true };
      } else {
        throw new Error('Failed to cancel booking');
      }
    } catch (err) {
      setError(err.message || 'Failed to cancel booking');
      console.error('Error cancelling booking:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getAvailableSlots = useCallback(async (courtId, date) => {
    try {
      const response = await bookingService.getAvailableSlots(courtId, date);

      if (response.data?.status === 'success') {
        return { success: true, slots: response.data.data };
      } else {
        throw new Error('Failed to fetch available slots');
      }
    } catch (err) {
      console.error('Error fetching available slots:', err);
      return { success: false, error: err.message };
    }
  }, []);

  useEffect(() => {
    fetchUserBookings();
  }, [fetchUserBookings]);

  return {
    bookings,
    loading,
    error,
    pagination,
    fetchUserBookings,
    createBooking,
    cancelBooking,
    getAvailableSlots
  };
};

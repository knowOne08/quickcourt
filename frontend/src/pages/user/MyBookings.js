// frontend/src/pages/user/MyBookings.js
import React, { useEffect } from 'react';
import { useBooking } from '../../context/BookingContext';

const MyBookings = () => {
  const { userBookings = [], loading, error, loadUserBookings, cancelBooking } = useBooking();

  useEffect(() => {
    loadUserBookings();
  }, [loadUserBookings]);

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      const result = await cancelBooking(bookingId);
      if (result.success) {
        // Booking was successfully cancelled
        loadUserBookings(); // Refresh the bookings list
      } else {
        alert(result.message || 'Failed to cancel booking');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    // Convert 24-hour format to 12-hour format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'text-green-600';
      case 'cancelled':
        return 'text-red-600';
      case 'completed':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-600">Error: {error}</p>
        <button
          onClick={() => loadUserBookings()}
          className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="my-bookings-page max-w-6xl mx-auto p-4">
      <div className="bookings-container">
        <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

        {!Array.isArray(userBookings) || userBookings.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No bookings found</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {userBookings.map(booking => (
              <div
                key={booking._id}
                className="booking-card bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-semibold mb-2">{booking.venue?.name || 'Venue Name'}</h3>
                <div className="space-y-2">
                  <p className="text-gray-600">
                    <span className="font-medium">Date:</span> {formatDate(booking.date)}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Time:</span> {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Court:</span> {booking.court?.name || 'Court Name'}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{' '}
                    <span className={getStatusColor(booking.status)}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Amount:</span> ₹{booking.totalAmount.toFixed(2)}
                  </p>
                </div>

                {booking.status === 'confirmed' && (
                  <button
                    onClick={() => handleCancelBooking(booking._id)}
                    className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;

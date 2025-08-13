// frontend/src/pages/user/MyBookings.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import BookingCard from '../../components/booking/BookingCard';
import './MyBookings.css';

const MyBookings = () => {
  const navigate = useNavigate(); // Call the hook to get the navigate function
  const { user, isAuthenticated } = useAuth();
  const { userBookings, loadUserBookings, loading, error } = useBooking();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [currentPage, setCurrentPage] = useState(1);
  const [bookingsPerPage] = useState(10);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserBookings();
    }
  }, [isAuthenticated, loadUserBookings]);

  const handleBookingUpdate = () => {
    loadUserBookings();
  };

  const filterBookings = (bookings) => {
    if (!Array.isArray(bookings)) {
        return [];
    }

    // --- FIX: Use the current time for comparison, not just the date ---
    const now = new Date(); 

    const createBookingDateTime = (booking) => {
        if (!booking.date || !booking.startTime) return null;
        const datePart = new Date(booking.date);
        const [hours, minutes] = booking.startTime.split(':');
        // Create a date object that correctly reflects the booking's local time
        return new Date(datePart.getFullYear(), datePart.getMonth(), datePart.getDate(), hours, minutes);
    };

    if (activeTab === 'upcoming') {
      return bookings.filter(booking => {
        const bookingDateTime = createBookingDateTime(booking);
        // A booking is upcoming if its start time is after the current time
        return bookingDateTime && bookingDateTime > now && booking.status !== 'cancelled';
      });
    } else if (activeTab === 'past') {
      return bookings.filter(booking => {
        const bookingDateTime = createBookingDateTime(booking);
        // A booking is past if its start time is before or at the current time
        return bookingDateTime && (bookingDateTime <= now || booking.status === 'completed');
      });
    } else if (activeTab === 'cancelled') {
      return bookings.filter(booking => booking.status === 'cancelled');
    }
    
    return bookings;
  };

  const filteredBookings = filterBookings(userBookings);
  
  // Pagination
  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking);
  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  if (!isAuthenticated) {
    return (
      <div className="my-bookings-page">
        <div className="auth-required">
          <h2>Authentication Required</h2>
          <p>Please log in to view your bookings.</p>
        </div>
      </div>
    );
  }

  // Helper for tab counts to avoid repeating logic
  const getBookingCount = (filterType) => {
    if (!Array.isArray(userBookings)) return 0;
    
    // --- FIX: Use the current time for comparison in tab counts as well ---
    const now = new Date();

    const createBookingDateTime = (booking) => {
        if (!booking.date || !booking.startTime) return null;
        const datePart = new Date(booking.date);
        const [hours, minutes] = booking.startTime.split(':');
        return new Date(datePart.getFullYear(), datePart.getMonth(), datePart.getDate(), hours, minutes);
    };

    return userBookings.filter(b => {
      const bookingDateTime = createBookingDateTime(b);
      if (!bookingDateTime) return false;

      if (filterType === 'upcoming') {
        return bookingDateTime > now && b.status !== 'cancelled';
      }
      if (filterType === 'past') {
        return bookingDateTime <= now || b.status === 'completed';
      }
      if (filterType === 'cancelled') {
        return b.status === 'cancelled';
      }
      return false;
    }).length;
  };

  return (
    <div className="my-bookings-page">
      <div className="bookings-container">
        <div className="bookings-header">
          <h1>My Bookings</h1>
          <p>Manage and track your court bookings</p>
        </div>

        {/* Tabs */}
        <div className="bookings-tabs">
          <button
            className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming ({getBookingCount('upcoming')})
          </button>
          <button
            className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveTab('past')}
          >
            Past ({getBookingCount('past')})
          </button>
          <button
            className={`tab-btn ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => setActiveTab('cancelled')}
          >
            Cancelled ({getBookingCount('cancelled')})
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bookings-loading">
            <div className="loading-spinner"></div>
            <p>Loading your bookings...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bookings-error">
            <p>Error: {error}</p>
            <button onClick={loadUserBookings} className="retry-btn">
              Try Again
            </button>
          </div>
        )}

        {/* Bookings List */}
        {!loading && !error && (
          <>
            {currentBookings.length === 0 ? (
              <div className="no-bookings">
                <div className="no-bookings-icon">📅</div>
                <h3>No {activeTab} bookings</h3>
                <p>
                  {activeTab === 'upcoming' 
                    ? "You don't have any upcoming bookings. Book a court now!"
                    : activeTab === 'past'
                    ? "You don't have any past bookings yet."
                    : "You don't have any cancelled bookings."
                  }
                </p>
                {activeTab === 'upcoming' && (
                  <button 
                    onClick={() => navigate('/venues')}
                    className="book-now-btn"
                  >
                    Book a Court
                  </button>
                )}
              </div>
            ) : (
              <div className="bookings-grid">
                {currentBookings.map(booking => {
                  // --- CHANGE: Determine if a review can be added ---
                  const canAddReview = activeTab === 'past' && booking.status === 'pending' && !booking.review;
                  
                  return (
                    <BookingCard
                      key={booking._id}
                      booking={booking}
                      onUpdate={handleBookingUpdate}
                      showReviewButton={canAddReview} // Pass this new prop
                    />
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`page-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  className="page-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyBookings;

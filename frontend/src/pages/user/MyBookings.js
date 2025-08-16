import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBooking } from '../../context/BookingContext';
import BookingCard from '../../components/booking/BookingCard';
import './MyBookings.css';

const MyBookings = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { userBookings, loadUserBookings, loading, error } = useBooking();

  // State for main tabs and sub-filters
  const [activeTab, setActiveTab] = useState('upcoming');
  const [subFilter, setSubFilter] = useState('all'); // 'all', 'approved', 'pending'

  const [currentPage, setCurrentPage] = useState(1);
  const [bookingsPerPage] = useState(10);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserBookings();
    }
  }, [isAuthenticated, loadUserBookings]);

  // Reset sub-filter and page when main tab changes
  useEffect(() => {
    setSubFilter('all');
    setCurrentPage(1);
  }, [activeTab]);


  const handleBookingUpdate = () => {
    loadUserBookings();
  };

  const createBookingDateTime = (booking) => {
    if (!booking.date || !booking.startTime) return null;
    const datePart = new Date(booking.date);
    const [hours, minutes] = booking.startTime.split(':');
    return new Date(datePart.getFullYear(), datePart.getMonth(), datePart.getDate(), hours, minutes);
  };

  // Memoize booking lists for performance
  const { upcomingBookings, pastBookings, cancelledBookings } = useMemo(() => {
    if (!Array.isArray(userBookings)) {
      return { upcomingBookings: [], pastBookings: [], cancelledBookings: [] };
    }
    const now = new Date();
    const upcoming = [];
    const past = [];
    const cancelled = [];

    userBookings.forEach(booking => {
      if (booking.status === 'cancelled') {
        cancelled.push(booking);
      } else {
        const bookingDateTime = createBookingDateTime(booking);
        if (bookingDateTime && bookingDateTime > now) {
          upcoming.push(booking);
        } else {
          past.push(booking);
        }
      }
    });
    return { upcomingBookings: upcoming, pastBookings: past, cancelledBookings: cancelled };
  }, [userBookings]);

  const filteredBookings = useMemo(() => {
    let sourceBookings;
    if (activeTab === 'upcoming') sourceBookings = upcomingBookings;
    else if (activeTab === 'past') sourceBookings = pastBookings;
    else sourceBookings = cancelledBookings;

    if (subFilter === 'all' || activeTab === 'cancelled') {
      return sourceBookings;
    }

    return sourceBookings.filter(booking => {
      const isApproved = ['confirmed', 'completed'].includes(booking.status);
      if (subFilter === 'approved') return isApproved;
      if (subFilter === 'pending') return !isApproved;
      return true;
    });
  }, [activeTab, subFilter, upcomingBookings, pastBookings, cancelledBookings]);


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

  return (
    <div className="my-bookings-page">
      <div className="bookings-container">
        <div className="bookings-header">
          <h1>My Bookings</h1>
          <p>Manage and track your court bookings</p>
        </div>

        {/* Main Tabs */}
        <div className="bookings-tabs">
          <button className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>
            Upcoming ({upcomingBookings.length})
          </button>
          <button className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`} onClick={() => setActiveTab('past')}>
            Past ({pastBookings.length})
          </button>
          <button className={`tab-btn ${activeTab === 'cancelled' ? 'active' : ''}`} onClick={() => setActiveTab('cancelled')}>
            Cancelled ({cancelledBookings.length})
          </button>
        </div>

        {/* Sub-Filter Tabs */}
        {(activeTab === 'upcoming' || activeTab === 'past') && (
          <div className="bookings-sub-tabs">
            <button className={`sub-tab-btn ${subFilter === 'all' ? 'active' : ''}`} onClick={() => setSubFilter('all')}>
              All
            </button>
            <button className={`sub-tab-btn ${subFilter === 'approved' ? 'active' : ''}`} onClick={() => setSubFilter('approved')}>
              Confirmed
            </button>
            <button className={`sub-tab-btn ${subFilter === 'pending' ? 'active' : ''}`} onClick={() => setSubFilter('pending')}>
              Pending
            </button>
          </div>
        )}


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
                <h3>No {subFilter !== 'all' && subFilter} {activeTab} bookings</h3>
                <p>You don't have any bookings that match the current filter.</p>
                {activeTab === 'upcoming' && (
                  <button onClick={() => navigate('/venues')} className="book-now-btn">
                    Book a Court
                  </button>
                )}
              </div>
            ) : (
              <div className="bookings-grid">
                {currentBookings.map(booking => {
                  const now = new Date();
                  const bookingDateTime = createBookingDateTime(booking);
                  const isPast = bookingDateTime && bookingDateTime <= now;

                  const displayBooking = { ...booking };
                  if (isPast && booking.status === 'confirmed') {
                    displayBooking.status = 'confirmed';
                  }

                  const canAddReview = isPast && booking.status === 'confirmed' && !booking.review;

                  return (
                    <BookingCard
                      key={booking._id}
                      booking={displayBooking}
                      onUpdate={handleBookingUpdate}
                      showReviewButton={canAddReview}
                    />
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button className="page-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} className={`page-btn ${currentPage === page ? 'active' : ''}`} onClick={() => handlePageChange(page)}>
                    {page}
                  </button>
                ))}
                <button className="page-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
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

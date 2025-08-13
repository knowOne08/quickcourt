// // frontend/src/components/booking/BookingCard.js
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useBooking } from '../../context/BookingContext';
// import './BookingCard.css';

// const BookingCard = ({ booking, onUpdate }) => {
//   const navigate = useNavigate();
//   const { cancelBooking, loading } = useBooking();
//   const [showCancelModal, setShowCancelModal] = useState(false);
//   const [cancelReason, setCancelReason] = useState('');

//   const handleCancel = async () => {
//     if (!cancelReason.trim()) {
//       alert('Please provide a reason for cancellation');
//       return;
//     }

//     try {
//       const result = await cancelBooking(booking._id, cancelReason);
//       if (result.success) {
//         setShowCancelModal(false);
//         setCancelReason('');
//         if (onUpdate) onUpdate();
//       }
//     } catch (error) {
//       console.error('Error cancelling booking:', error);
//     }
//   };

//   const formatDate = (date) => {
//     return new Date(date).toLocaleDateString('en-US', {
//       weekday: 'short',
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   };

//   const formatTime = (time) => {
//     if (!time) return '';
//     const [hours, minutes] = time.split(':');
//     const hour = parseInt(hours);
//     const ampm = hour >= 12 ? 'PM' : 'AM';
//     const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
//     return `${displayHour}:${minutes} ${ampm}`;
//   };

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'usd',
//       minimumFractionDigits: 0
//     }).format(amount);
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'confirmed':
//         return 'status-confirmed';
//       case 'pending':
//         return 'status-pending';
//       case 'cancelled':
//         return 'status-cancelled';
//       case 'completed':
//         return 'status-completed';
//       default:
//         return 'status-pending';
//     }
//   };

//   const getStatusText = (status) => {
//     return status.charAt(0).toUpperCase() + status.slice(1);
//   };

//   const canCancel = () => {
//     if (booking.status === 'cancelled' || booking.status === 'completed') return false;
    
//     const bookingDateTime = new Date(`${booking.date.split('T')[0]}T${booking.startTime}`);
//     const now = new Date();
//     const twoHoursBefore = new Date(bookingDateTime.getTime() - 2 * 60 * 60 * 1000);
    
//     return now < twoHoursBefore;
//   };

//   const isPast = () => {
//     const bookingDateTime = new Date(`${booking.date.split('T')[0]}T${booking.startTime}`);
//     return new Date() > bookingDateTime;
//   };

//   const getVenueImage = () => {
//     if (booking.venue?.images && booking.venue.images.length > 0) {
//       return booking.venue.images[0];
//     }
//     return '/default-venue.jpg'; // Default image
//   };

//   return (
//     <>
//       <div className={`booking-card ${isPast() ? 'past-booking' : ''}`}>
//         <div className="booking-image">
//           <img 
//             src={getVenueImage()} 
//             alt={booking.venue?.name || 'Venue'} 
//             onError={(e) => {
//               e.target.src = '/default-venue.jpg';
//             }}
//           />
//           <div className={`status-badge ${getStatusColor(booking.status)}`}>
//             {getStatusText(booking.status)}
//           </div>
//         </div>

//         <div className="booking-content">
//           <div className="booking-header">
//             <h3 className="venue-name">{booking.venue?.name || 'Venue Name'}</h3>
//             <p className="venue-location">
//               {booking.venue?.location?.address || 'Address'}, {booking.venue?.location?.city || 'City'}
//             </p>
//           </div>

//           <div className="booking-details">
//             <div className="detail-row">
//               <span className="detail-label">Court:</span>
//               <span className="detail-value">{booking.court?.name || 'Court Name'}</span>
//             </div>
            
//             <div className="detail-row">
//               <span className="detail-label">Sport:</span>
//               <span className="detail-value">{booking.court?.sport || 'Sport'}</span>
//             </div>
            
//             <div className="detail-row">
//               <span className="detail-label">Date:</span>
//               <span className="detail-value">{formatDate(booking.date)}</span>
//             </div>
            
//             <div className="detail-row">
//               <span className="detail-label">Time:</span>
//               <span className="detail-value">
//                 {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
//               </span>
//             </div>
            
//             <div className="detail-row">
//               <span className="detail-label">Duration:</span>
//               <span className="detail-value">
//                 {booking.duration / 60} hour{booking.duration / 60 !== 1 ? 's' : ''}
//               </span>
//             </div>
            
//             <div className="detail-row total">
//               <span className="detail-label">Total Amount:</span>
//               <span className="detail-value amount">{formatCurrency(booking.totalAmount)}</span>
//             </div>
//           </div>

//           <div className="booking-actions">
//             <button
//               type="button"
//               className="action-btn view-btn"
//               onClick={() => navigate(`/booking/${booking._id}`)}
//             >
//               View Details
//             </button>
            
//             {canCancel() && (
//               <button
//                 type="button"
//                 className="action-btn cancel-btn"
//                 onClick={() => setShowCancelModal(true)}
//                 disabled={loading}
//               >
//                 {loading ? 'Cancelling...' : 'Cancel'}
//               </button>
//             )}
            
//             {booking.status === 'completed' && !booking.review && (
//               <button
//                 type="button"
//                 className="action-btn review-btn"
//                 onClick={() => navigate(`/booking/${booking._id}/review`)}
//               >
//                 Add Review
//               </button>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Cancel Modal */}
//       {showCancelModal && (
//         <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
//           <div className="modal-content" onClick={(e) => e.stopPropagation()}>
//             <h3>Cancel Booking</h3>
//             <p>Are you sure you want to cancel this booking?</p>
            
//             <div className="form-group">
//               <label htmlFor="cancel-reason">Reason for cancellation:</label>
//               <textarea
//                 id="cancel-reason"
//                 value={cancelReason}
//                 onChange={(e) => setCancelReason(e.target.value)}
//                 placeholder="Please provide a reason for cancellation..."
//                 rows="3"
//                 className="cancel-reason-input"
//               />
//             </div>
            
//             <div className="modal-actions">
//               <button
//                 type="button"
//                 className="btn-secondary"
//                 onClick={() => setShowCancelModal(false)}
//               >
//                 Keep Booking
//               </button>
//               <button
//                 type="button"
//                 className="btn-danger"
//                 onClick={handleCancel}
//                 disabled={loading || !cancelReason.trim()}
//               >
//                 {loading ? 'Cancelling...' : 'Cancel Booking'}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// export default BookingCard;


// frontend/src/components/booking/BookingCard.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import './BookingCard.css';

const BookingCard = ({ booking, onUpdate }) => {
  const navigate = useNavigate();
  const { cancelBooking, loading } = useBooking();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    try {
      const result = await cancelBooking(booking._id, cancelReason);
      if (result.success) {
        setShowCancelModal(false);
        setCancelReason('');
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'usd',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'status-confirmed';
      case 'pending':
        return 'status-pending';
      case 'cancelled':
        return 'status-cancelled';
      case 'completed':
        return 'status-completed';
      default:
        return 'status-pending';
    }
  };

  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const canCancel = () => {
    if (booking.status === 'cancelled' || booking.status === 'completed' || !booking.date || !booking.startTime) return false;
    
    const bookingDateTime = new Date(`${booking.date.split('T')[0]}T${booking.startTime}`);
    const now = new Date();
    const twoHoursBefore = new Date(bookingDateTime.getTime() - 2 * 60 * 60 * 1000);
    
    return now < twoHoursBefore;
  };

  const isPast = () => {
    if (!booking.date || !booking.startTime) return false;
    const bookingDateTime = new Date(`${booking.date.split('T')[0]}T${booking.startTime}`);
    return new Date() > bookingDateTime;
  };

  // FIX: Use a dynamic placeholder if the venue image doesn't exist.
  const getVenueImage = () => {
    if (booking.venue?.images && booking.venue.images.length > 0) {
      return booking.venue.images[0];
    }
    // Generate a placeholder with the venue name
    const venueName = booking.venue?.name || 'Venue';
    return `https://placehold.co/600x400/E2E8F0/4A5568?text=${encodeURIComponent(venueName)}`;
  };

  return (
    <>
      <div className={`booking-card ${isPast() ? 'past-booking' : ''}`}>
        <div className="booking-image">
          <img 
            src={getVenueImage()} 
            alt={booking.venue?.name || 'Venue'} 
            onError={(e) => {
              // FIX: If the primary image URL fails, fall back to a generic placeholder.
              e.target.onerror = null; // Prevents infinite loops
              e.target.src = 'https://placehold.co/600x400/E2E8F0/4A5568?text=Image+Not+Found';
            }}
          />
          <div className={`status-badge ${getStatusColor(booking.status)}`}>
            {getStatusText(booking.status)}
          </div>
        </div>

        <div className="booking-content">
          <div className="booking-header">
            <h3 className="venue-name">{booking.venue?.name || 'Venue Name'}</h3>
            <p className="venue-location">
              {booking.venue?.location?.address || 'Address'}, {booking.venue?.location?.city || 'City'}
            </p>
          </div>

          <div className="booking-details">
            <div className="detail-row">
              <span className="detail-label">Court:</span>
              <span className="detail-value">{booking.court?.name || 'Court Name'}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Sport:</span>
              <span className="detail-value">{booking.court?.sport || 'Sport'}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Date:</span>
              <span className="detail-value">{booking.date ? formatDate(booking.date) : 'N/A'}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Time:</span>
              <span className="detail-value">
                {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
              </span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Duration:</span>
              <span className="detail-value">
                {booking.duration / 60} hour{booking.duration / 60 !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="detail-row total">
              <span className="detail-label">Total Amount:</span>
              <span className="detail-value amount">{formatCurrency(booking.totalAmount)}</span>
            </div>
          </div>

          <div className="booking-actions">
            <button
              type="button"
              className="action-btn view-btn"
              onClick={() => navigate(`/booking/${booking._id}`)}
            >
              View Details
            </button>
            
            {canCancel() && (
              <button
                type="button"
                className="action-btn cancel-btn"
                onClick={() => setShowCancelModal(true)}
                disabled={loading}
              >
                {loading ? 'Cancelling...' : 'Cancel'}
              </button>
            )}
            
            {booking.status === 'completed' && !booking.review && (
              <button
                type="button"
                className="action-btn review-btn"
                onClick={() => navigate(`/booking/${booking._id}/review`)}
              >
                Add Review
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Cancel Booking</h3>
            <p>Are you sure you want to cancel this booking?</p>
            
            <div className="form-group">
              <label htmlFor="cancel-reason">Reason for cancellation:</label>
              <textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancellation..."
                rows="3"
                className="cancel-reason-input"
              />
            </div>
            
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowCancelModal(false)}
              >
                Keep Booking
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleCancel}
                disabled={loading || !cancelReason.trim()}
              >
                {loading ? 'Cancelling...' : 'Cancel Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookingCard;

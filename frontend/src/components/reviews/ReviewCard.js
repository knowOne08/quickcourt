// frontend/src/components/reviews/ReviewCard.js
import React from 'react';
// import './ReviewCard.css';

const ReviewCard = ({ review }) => {
  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} className={i < rating ? 'star-filled' : 'star-empty'}>★</span>
    ));
  };

  return (
    <div className="review-card">
      <div className="review-header">
        <span className="reviewer-name">{review.user?.name || 'Anonymous'}</span>
        <div className="review-rating">{renderStars(review.rating.overall)}</div>
      </div>
      <h4 className="review-title">{review.title}</h4>
      <p className="review-comment">{review.comment}</p>
      <div className="review-footer">
        <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
        {review.isVerifiedBooking && <span className="verified-badge">✓ Verified Booking</span>}
      </div>
    </div>
  );
};

export default ReviewCard;
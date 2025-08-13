// frontend/src/pages/user/AddReviewPage.js
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reviewService } from '../../services/reviewService';
// import './AddReviewPage.css'; // Add styling for your form

const AddReviewPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  
  const [rating, setRating] = useState({ overall: 0, cleanliness: 0, facilities: 0 });
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating.overall === 0 || !title.trim() || !comment.trim()) {
      setError('Please provide an overall rating, title, and comment.');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await reviewService.submitReview({
        bookingId,
        rating,
        title,
        comment,
      });
      navigate('/my-bookings'); // Redirect after successful submission
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  // A simple star rating component
  const StarRating = ({ category, value, onRate }) => (
    <div className="star-rating">
      <label>{category.charAt(0).toUpperCase() + category.slice(1)}:</label>
      <div>
        {[...Array(5)].map((_, index) => {
          const ratingValue = index + 1;
          return (
            <span 
              key={ratingValue}
              className={ratingValue <= value ? 'star-filled' : 'star-empty'}
              onClick={() => onRate(category, ratingValue)}
            >
              ★
            </span>
          );
        })}
      </div>
    </div>
  );

  const handleRatingChange = (category, value) => {
    setRating(prev => ({ ...prev, [category]: value }));
  };

  return (
    <div className="add-review-page">
      <form onSubmit={handleSubmit} className="review-form">
        <h2>Write a Review</h2>
        <p>Share your experience for booking ID: {bookingId}</p>

        <div className="ratings-container">
          <StarRating category="overall" value={rating.overall} onRate={handleRatingChange} />
          <StarRating category="cleanliness" value={rating.cleanliness} onRate={handleRatingChange} />
          <StarRating category="facilities" value={rating.facilities} onRate={handleRatingChange} />
          {/* Add other rating categories from your schema here */}
        </div>

        <div className="form-group">
          <label htmlFor="title">Review Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="comment">Your Comment</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="5"
            required
          ></textarea>
        </div>

        {error && <p className="error-message">{error}</p>}
        
        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

export default AddReviewPage;

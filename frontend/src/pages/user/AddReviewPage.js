import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reviewService } from '../../services/reviewService'; // Assuming this is the correct path
import '../../styles/addreviewPage.css';

// A self-contained StarRating component for clarity
const StarRating = ({ label, rating, onRatingChange }) => {
  return (
    <div className="star-rating">
      <label>{label}:</label>
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rating ? 'star-filled' : 'star-empty'}
            onClick={() => onRatingChange(star)}
          >
            ★
          </span>
        ))}
      </div>
    </div>
  );
};

const AddReviewPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  // State for each rating category from your model
  const [overallRating, setOverallRating] = useState(0);
  const [cleanlinessRating, setCleanlinessRating] = useState(0);
  const [facilitiesRating, setFacilitiesRating] = useState(0);
  const [staffRating, setStaffRating] = useState(0);
  const [valueForMoneyRating, setValueForMoneyRating] = useState(0);
  const [locationRating, setLocationRating] = useState(0);

  // State for text inputs
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  // State for form submission status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // --- Validation Check ---
    if (overallRating === 0 || !title.trim() || !comment.trim()) {
      setError('Please provide an overall rating, title, and comment.');
      return;
    }

    setLoading(true);

    const reviewData = {
      bookingId,
      rating: {
        overall: overallRating,
        cleanliness: cleanlinessRating,
        facilities: facilitiesRating,
        staff: staffRating,
        valueForMoney: valueForMoneyRating,
        location: locationRating,
      },
      title,
      comment,
    };

    try {
      // --- API Call using reviewService ---
      await reviewService.submitReview(reviewData);

      alert('Review submitted successfully!');
      navigate('/my-bookings'); // Redirect after successful submission

    } catch (err) {
      // Handle errors from the API service (e.g., Axios)
      const errorMessage = err.response?.data?.message || 'Failed to submit review. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-review-page">
      <form onSubmit={handleSubmit} className="review-form">
        <h2>Write a Review</h2>
        <p>Share your experience for booking ID: <strong>{bookingId}</strong></p>

        <div className="ratings-container">
          <StarRating
            label="Overall"
            rating={overallRating}
            onRatingChange={setOverallRating}
          />
          <StarRating
            label="Cleanliness"
            rating={cleanlinessRating}
            onRatingChange={setCleanlinessRating}
          />
          <StarRating
            label="Facilities"
            rating={facilitiesRating}
            onRatingChange={setFacilitiesRating}
          />
          <StarRating
            label="Staff"
            rating={staffRating}
            onRatingChange={setStaffRating}
          />
          <StarRating
            label="Value for Money"
            rating={valueForMoneyRating}
            onRatingChange={setValueForMoneyRating}
          />
          <StarRating
            label="Location"
            rating={locationRating}
            onRatingChange={setLocationRating}
          />
        </div>

        <div className="form-group">
          <label htmlFor="title">Review Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., 'A wonderful stay!'"
          />
        </div>

        <div className="form-group">
          <label htmlFor="comment">Your Comment</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="5"
            placeholder="Tell us about your experience..."
          ></textarea>
        </div>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

export default AddReviewPage;

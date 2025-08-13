import React, { useState, useEffect } from 'react';
import { reviewService } from '../../services/reviewService';
import ReviewCard from './ReviewCard';

const ReviewList = ({ venueId }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setLoading(true);
                const response = await reviewService.getReviewsForVenue(venueId);
                setReviews(response.data.data.reviews);
            } catch (error) {
                console.error("Failed to fetch reviews:", error);
            } finally {
                setLoading(false);
            }
        };

        if (venueId) {
            fetchReviews();
        }
    }, [venueId]);

    if (loading) return <p>Loading reviews...</p>;
    if (reviews.length === 0) return <p>No reviews yet.</p>;

    return (
        <div className="review-list">
            <h2>What people are saying</h2>
            {reviews.map(review => (
                <ReviewCard key={review._id} review={review} />
            ))}
        </div>
    );
};

export default ReviewList;
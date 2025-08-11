// frontend/src/components/venue/VenueCard.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './VenueCard.css';

const VenueCard = ({ venue }) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/venue/${venue._id}`);
  };

  return (
    <div className="venue-card">
      <div className="venue-image">
        <img 
          // src={venue.images[0] || '/assets/images/default-venue.jpg'} 
          alt={venue.name}
          onError={(e) => {
            // e.target.src = '/assets/images/default-venue.jpg';
          }}
        />
      </div>
      
      <div className="venue-info">
        <div className="venue-header">
          <h3 className="venue-name">{venue.name}</h3>
          <div className="venue-rating">
            <span className="rating-value">{venue.rating.average}</span>
            <span className="rating-count">({venue.rating.count})</span>
          </div>
        </div>
        
        <p className="venue-location">{venue.location}</p>
        
        <div className="venue-tags">
          <span className="sport-tag">{venue.sports[0]}</span>
          <span className="type-tag">{venue.venueType || 'Indoor'}</span>
          <span className="rating-tag">Top Rated</span>
          <span className="price-tag">₹ Budget</span>
        </div>
        
        <div className="venue-actions">
          <button 
            className="view-details-btn"
            onClick={handleViewDetails}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default VenueCard;
// frontend/src/pages/user/VenueDetails.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { venueService } from '../../services/venueService';

const VenueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVenueDetails();
  }, [id]);

  const fetchVenueDetails = async () => {
    try {
      setLoading(true);
      // Mock data for now
      const mockVenue = {
        _id: id,
        name: 'Elite Sports Complex',
        location: 'Ahmedabad',
        description: 'Premium sports facility with modern amenities',
        sports: ['badminton', 'tennis'],
        images: ['/assets/images/venue1.jpg'],
        rating: { average: 4.5, count: 120 },
        pricing: { basePrice: 500 }
      };
      setVenue(mockVenue);
    } catch (error) {
      console.error('Error fetching venue details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading venue details...</div>;
  if (!venue) return <div>Venue not found</div>;

  return (
    <div className="venue-details-page">
      <div className="venue-details-container">
        <h1>{venue.name}</h1>
        <p>{venue.location}</p>
        <p>{venue.description}</p>
        
        <div className="venue-actions">
          <button 
            onClick={() => navigate(`/book/${venue._id}`)}
            className="book-now-btn"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default VenueDetails;

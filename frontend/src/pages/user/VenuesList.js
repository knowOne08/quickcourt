// frontend/src/pages/user/VenuesList.js
import React, { useState, useEffect } from 'react';
import VenueCard from '../../components/venue/VenueCard';
import { venueService } from '../../services/venueService';
import './VenuesList.css';

const VenuesList = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    location: '',
    sport: '',
    priceRange: ''
  });

  useEffect(() => {
    fetchVenues();
  }, [filters]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      // Mock data for now
      const mockVenues = [
        {
          _id: '1',
          name: 'Elite Sports Complex',
          location: 'Ahmedabad',
          sports: ['badminton', 'tennis'],
          images: ['/assets/images/venue1.jpg'],
          rating: { average: 4.5, count: 120 }
        },
        {
          _id: '2',
          name: 'Champions Arena',
          location: 'Ahmedabad',
          sports: ['football', 'cricket'],
          images: ['/assets/images/venue2.jpg'],
          rating: { average: 4.2, count: 85 }
        }
      ];
      setVenues(mockVenues);
    } catch (error) {
      console.error('Error fetching venues:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="venues-list-page">
      <div className="venues-container">
        <h1>Find Sports Venues</h1>
        
        <div className="venues-filters">
          <select 
            value={filters.location} 
            onChange={(e) => setFilters({...filters, location: e.target.value})}
          >
            <option value="">All Locations</option>
            <option value="ahmedabad">Ahmedabad</option>
            <option value="mumbai">Mumbai</option>
          </select>
          
          <select 
            value={filters.sport} 
            onChange={(e) => setFilters({...filters, sport: e.target.value})}
          >
            <option value="">All Sports</option>
            <option value="badminton">Badminton</option>
            <option value="tennis">Tennis</option>
            <option value="football">Football</option>
          </select>
        </div>
        
        <div className="venues-grid">
          {loading ? (
            <p>Loading venues...</p>
          ) : venues.length > 0 ? (
            venues.map(venue => (
              <VenueCard key={venue._id} venue={venue} />
            ))
          ) : (
            <p>No venues found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VenuesList;

// frontend/src/pages/user/Home.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { venueService } from '../../services/venueService';
import './Home.css';

const Home = () => {
  const [selectedLocation, setSelectedLocation] = useState('Ahmedabad');
  const [venues, setVenues] = useState([]);
  const [topVenues, setTopVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Popular sports data (static since it's just for display)

  useEffect(() => {
    fetchVenues();
    fetchTopVenues();
  }, [selectedLocation]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const response = await venueService.getAllVenues({
        city: selectedLocation,
        limit: 8
      });

      if (response.data?.status === 'success') {
        setVenues(response.data.data.venues);
      } else {
        setError('Failed to fetch venues');
      }
    } catch (err) {
      console.error('Error fetching venues:', err);
      setError('Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopVenues = async () => {
    try {
      const response = await venueService.getTopVenues(6);

      if (response.data?.status === 'success') {
        setTopVenues(response.data.data.venues);
      }
    } catch (err) {
      console.error('Error fetching top venues:', err);
    }
  };

  const formatLocation = (location) => {
    if (!location) return '';
    const parts = [location.address, location.city, location.state].filter(Boolean);
    return parts.join(', ');
  };

  const formatPriceRange = (venue) => {
    if (venue.pricing?.hourly) {
      return `₹${venue.pricing.hourly}/hour`;
    }
    if (venue.priceRange) {
      return `₹${venue.priceRange.min}-${venue.priceRange.max}/hour`;
    }
    return 'Price not available';
  };

  const getVenueImage = (venue) => {
    if (venue.images && venue.images.length > 0) {
      return venue.images[0].url || venue.images[0];
    }
    // Fallback images based on sport
    const fallbackImages = {
      badminton: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=300&h=200&fit=crop',
      football: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=200&fit=crop',
      cricket: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop',
      tennis: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=300&h=200&fit=crop',
      basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=300&h=200&fit=crop'
    };
    return fallbackImages[venue.sports?.[0]] || 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=300&h=200&fit=crop';
  };

  return (
    <div className="home-page">
      {/* Header Section */}
      <div className="header-section">
        <div className="header-content">
          <div className="location-selector">
            <div className="location-icon">📍</div>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="location-dropdown"
            >
              <option value="Ahmedabad">Ahmedabad</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Chennai">Chennai</option>
              <option value="Hyderabad">Hyderabad</option>
            </select>
          </div>

          <div className="search-section">
            <h1>FIND PLAYERS & VENUES NEARBY</h1>
            <p>Seamlessly explore sports venues and play with sports enthusiasts just like you</p>
          </div>

          <div className="map-placeholder">
            <div className="map-content">
              <span>IMAGE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Book Venues Section */}
      <div className="book-venues-section">
        <div className="section-header">
          <h2>Book Venues</h2>
          <a href="/venues" className="see-all-link">See all venues →</a>
        </div>

        {loading ? (
          <div className="loading-state">
            <div>Loading venues...</div>
          </div>
        ) : error ? (
          <div className="error-state">
            <div>{error}</div>
            <button onClick={fetchVenues} className="retry-btn">Retry</button>
          </div>
        ) : (
          <div className="venues-grid">
            {venues.length > 0 ? (
              venues.map((venue) => (
                <div key={venue._id} className="venue-card">
                  <div className="venue-image">
                    <img src={getVenueImage(venue)} alt={venue.name} />
                  </div>
                  <div className="venue-info">
                    <div className="venue-data">
                      <h3>{venue.name}</h3>
                      <div className="venue-rating">
                        <span className="stars">⭐ {venue.rating?.average || venue.averageRating || 'N/A'}</span>
                        <span className="review-count">({venue.rating?.count || venue.totalReviews || 0})</span>
                      </div>
                    </div>
                    <p className="venue-location">📍 {formatLocation(venue.location)}</p>

                    <div className="venue-amenities">
                      {venue.sports && venue.sports.slice(0, 2).map((sport, index) => (
                        <span key={index} className="amenity-tag">
                          {sport === 'badminton' && '🏸'}
                          {sport === 'football' && '⚽'}
                          {sport === 'cricket' && '🏏'}
                          {sport === 'tennis' && '🎾'}
                          {sport === 'basketball' && '🏀'}
                          {sport === 'table_tennis' && '🏓'}
                          {sport}
                        </span>
                      ))}
                    </div>
                    <div className="venue-actions">
                      <span className="price-range">{formatPriceRange(venue)}</span>
                      <button
                        className="book-button"
                        onClick={() => navigate(`/venue/${venue._id}`)}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-venues-message">
                <p>No venues found in {selectedLocation}. Try another location or check back later.</p>
              </div>
            )}
          </div>
        )}

        {venues.length > 0 && (
          <div className="pagination">
            <button className="pagination-btn">‹</button>
            <button className="pagination-btn">›</button>
          </div>
        )}
      </div>

      {/* Popular Sports Section */}
    </div>
  );
};

export default Home;
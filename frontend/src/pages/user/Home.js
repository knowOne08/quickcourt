// frontend/src/pages/user/Home.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [selectedLocation, setSelectedLocation] = useState('Ahmedabad');
  const navigate = useNavigate();

  // Mock data for venues
  const mockVenues = [
    {
      id: 1,
      name: 'SRK Badminton',
      location: 'Vaishnavdevi Cir',
      rating: 4.5,
      reviews: 6,
      image: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=300&h=200&fit=crop',
      amenities: ['badminton', 'ac-court'],
      priceRange: '₹ 300-500'
    },
    {
      id: 2,
      name: 'SRK Badminton',
      location: 'Vaishnavdevi Cir',
      rating: 4.5,
      reviews: 6,
      image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=200&fit=crop',
      amenities: ['badminton', 'ac-court'],
      priceRange: '₹ 300-500'
    },
    {
      id: 3,
      name: 'SRK Badminton',
      location: 'Vaishnavdevi Cir',
      rating: 4.5,
      reviews: 6,
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop',
      amenities: ['badminton', 'ac-court'],
      priceRange: '₹ 300-500'
    },
    {
      id: 4,
      name: 'SRK Badminton',
      location: 'Vaishnavdevi Cir',
      rating: 4.5,
      reviews: 6,
      image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=300&h=200&fit=crop',
      amenities: ['badminton', 'ac-court'],
      priceRange: '₹ 300-500'
    }
  ];

  // Mock data for popular sports
  const popularSports = [
    {
      name: 'Badminton',
      image: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=150&h=150&fit=crop'
    },
    {
      name: 'Football',
      image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=150&h=150&fit=crop'
    },
    {
      name: 'Cricket',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop'
    },
    {
      name: 'Swimming',
      image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=150&h=150&fit=crop'
    },
    {
      name: 'Tennis',
      image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=150&h=150&fit=crop'
    },
    {
      name: 'Table Tennis',
      image: 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=150&h=150&fit=crop'
    }
  ];

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

        <div className="venues-grid">
          {mockVenues.map((venue) => (
            <div key={venue.id} className="venue-card">
              <div className="venue-image">
                <img src={venue.image} alt={venue.name} />

              </div>
              <div className="venue-info">
                <div className="venue-data">
                  <h3>{venue.name}</h3>
                  <div className="venue-rating">
                    <span className="stars">⭐ {venue.rating}</span>
                    <span className="review-count">({venue.reviews})</span>
                  </div>
                </div>
                <p className="venue-location">📍 {venue.location}</p>

                <div className="venue-amenities">
                  <span className="amenity-tag">🏸 badminton</span>
                  <span className="amenity-tag">❄️ ac-court</span>
                </div>
                <div className="venue-actions">
                  <span className="price-range">{venue.priceRange}</span>
                  <button className="book-button" onClick={() => navigate(`/venue/${venue.id}`)}>View Details</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pagination">
          <button className="pagination-btn">‹</button>
          <button className="pagination-btn">›</button>
        </div>
      </div>

      {/* Popular Sports Section */}
      <div className="popular-sports-section">
        <h2>Popular Sports</h2>
        <div className="sports-grid">
          {popularSports.map((sport, index) => (
            <div key={index} className="sport-card">
              <div className="sport-image">
                <img src={sport.image} alt={sport.name} />
              </div>
              <h3>{sport.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
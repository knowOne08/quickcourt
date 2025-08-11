// frontend/src/pages/user/Home.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VenueCard from '../../components/venue/VenueCard';
import { venueService } from '../../services/venueService';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('Ahmedabad');
  const [topVenues, setTopVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopVenues();
  }, [location]);

  const fetchTopVenues = async () => {
    try {
      setLoading(true);
      const response = await venueService.getTopVenues(location);
      setTopVenues(response.data);
    } catch (error) {
      console.error('Error fetching top venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationChange = (e) => {
    setLocation(e.target.value);
  };

  const handleBookVenues = () => {
    navigate('/venues');
  };

  return (
    <div className="home-page">
      {/* Hero Section - Following Mockup */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <div className="location-selector">
              <select 
                value={location} 
                onChange={handleLocationChange}
                className="location-select"
              >
                <option value="Ahmedabad">Ahmedabad</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi">Delhi</option>
                <option value="Bangalore">Bangalore</option>
              </select>
            </div>
            
            <h1 className="hero-title">
              FIND PLAYERS & VENUES<br />
              NEARBY
            </h1>
            
            <p className="hero-description">
              Seamlessly explore sports venues and play with<br />
              sports enthusiasts just like you!
            </p>
            
            <button 
              className="book-venues-btn"
              onClick={handleBookVenues}
            >
              Book Venues
            </button>
          </div>
          
          {/* Hero Image - Hide on Mobile as per mockup */}
          <div className="hero-image desktop-only">
            <img 
              src="/assets/images/sports-hero.png" 
              alt="Sports enthusiasts" 
            />
          </div>
        </div>
      </section>

      {/* Top Rated Venues Section */}
      <section className="venues-section">
        <div className="section-header">
          <div className="carousel-controls">
            <button className="carousel-btn prev">&lt;</button>
            <button className="carousel-btn next">&gt;</button>
          </div>
        </div>
        
        <div className="venues-carousel">
          {loading ? (
            <div className="loading-spinner">Loading venues...</div>
          ) : (
            <>
              {topVenues.map(venue => (
                <VenueCard key={venue._id} venue={venue} />
              ))}
            </>
          )}
        </div>
        
        <div className="see-all-venues">
          <button 
            className="see-all-btn"
            onClick={() => navigate('/venues')}
          >
            See all venues &gt;
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;
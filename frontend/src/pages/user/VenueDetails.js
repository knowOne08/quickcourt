// frontend/src/pages/user/VenueDetails.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { venueService } from '../../services/venueService';
import ReviewList from '../../components/reviews/ReviewList';
import './VenueDetails.css';

const VenueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [activeSport, setActiveSport] = useState(null);

  useEffect(() => {
    const fetchVenueDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Fetching venue with ID:', id);
        const response = await venueService.getVenueById(id);
        // console.log('📡 API Response:', response);
        
        console.log(response);
        // if (!response?.data.data.venue) {
        //   throw new Error('Invalid API response: missing venue data');
        // }

        console.log("Kcuh to locah haiiiii");
        
        const venueData = response.data.data.venue;
        console.log('🏟️ Venue Data:', venueData);
        
        setVenue(venueData);
        setActiveSport(venueData.sports?.[0] || '');
      } catch (e) {
        console.error('❌ Error loading venue:', e);
        setError(`Failed to load venue details: ${e.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVenueDetails();
  }, [id]);

  const formatLocation = (location) => {
    if (!location) return 'Location not specified';
    const parts = [location.address, location.city, location.state, location.country].filter(Boolean);
    return parts.join(', ');
  };

  const formatPrice = (pricing) => {
    if (!pricing?.hourly) return 'Price not available';
    return `₹${pricing.hourly}/hour`;
  };

  const getVenueImage = () => {
    if (venue?.images && venue.images.length > 0) {
      return venue.images[imgIndex]?.url || venue.images[imgIndex];
    }
    return '/assets/images/venue1.jpg'; // Fallback image
  };

  const getSportIcon = (sport) => {
    const icons = {
      badminton: '🏸',
      football: '⚽',
      cricket: '🏏',
      tennis: '🎾',
      basketball: '🏀',
      table_tennis: '🏓',
      volleyball: '🏐',
      squash: '🥎'
    };
    return icons[sport] || '🏟️';
  };

  if (loading) return <div className="loading-state">Loading venue details...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;
  if (!venue) return <div className="error-state">Venue not found</div>;

  return (
    <div className="venue-page">
      <div className="venue-container">
        {/* Header */}
        <div className="venue-header">
          <div>
            <div className="venue-title">{venue.name}</div>
            <div className="venue-sub">
              <span>📍 {formatLocation(venue.location)}</span>
              <span>⭐ {venue.rating?.average || 0} ({venue.rating?.count || 0})</span>
            </div>
          </div>
          <div>
            <button className="cta" onClick={() => navigate(`/book/${venue._id}`)}>
              Book This Venue
            </button>
          </div>
        </div>

        {/* Top Grid: Media + Info */}
        <div className="top-grid">
          <div className="media-box">
            <img src={getVenueImage()} alt={venue.name} className="media-img" />
            {venue.images && venue.images.length > 1 && (
              <div className="carousel-nav">
                <button 
                  className="carousel-btn" 
                  onClick={() => setImgIndex((i) => (i - 1 + venue.images.length) % venue.images.length)}
                >
                  {'<'}
                </button>
                <button 
                  className="carousel-btn" 
                  onClick={() => setImgIndex((i) => (i + 1) % venue.images.length)}
                >
                  {'>'}
                </button>
              </div>
            )}
          </div>
          
          <div className="info-panel">
            <div className="info-card">
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Operating Hours</div>
              <div>{venue.availability?.openTime || '6:00'} - {venue.availability?.closeTime || '22:00'}</div>
            </div>
            <div className="info-card">
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Address</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{formatLocation(venue.location)}</div>
            </div>
            <div className="info-card">
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Price</div>
              <div>{formatPrice(venue.pricing)}</div>
            </div>
            <div className="info-card">
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Type</div>
              <div>{venue.venueType || 'Not specified'}</div>
            </div>
          </div>
        </div>

        {/* Description */}
        {venue.description && (
          <div className="section">
            <div className="section-title">About Venue</div>
            <p className="venue-description">{venue.description}</p>
          </div>
        )}

        {/* Sports */}
        {venue.sports && venue.sports.length > 0 && (
          <div className="section">
            <div className="section-title">Sports Available</div>
            <div className="sports-row">
              {venue.sports.map((sport) => (
                <button 
                  key={sport} 
                  className={`sport-tile ${activeSport === sport ? 'active' : ''}`} 
                  onClick={() => setActiveSport(sport)}
                >
                  <div className="sport-icon">{getSportIcon(sport)}</div>
                  <div className="sport-name">{sport.replace('_', ' ').toUpperCase()}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Courts */}
        {venue.courts && venue.courts.length > 0 && (
          <div className="section">
            <div className="section-title">Available Courts</div>
            <div className="courts-grid">
              {venue.courts.map((court) => (
                <div key={court._id} className="court-card">
                  <div className="court-name">{court.name}</div>
                  <div className="court-details">
                    <span className="court-sport">
                      {getSportIcon(court.sport)} {court.sport.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="court-price">₹{court.pricePerHour}/hour</span>
                  </div>
                  <div className="court-info">
                    <span className="court-type">{court.type}</span>
                    <span className="court-surface">{court.surface}</span>
                  </div>
                  {court.amenities && court.amenities.length > 0 && (
                    <div className="court-amenities">
                      {court.amenities.slice(0, 3).map((amenity, idx) => (
                        <span key={idx} className="court-amenity">{amenity}</span>
                      ))}
                    </div>
                  )}
                  {court.rating && (
                    <div className="court-rating">
                      ⭐ {court.rating.average} ({court.rating.count})
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Amenities */}
        {venue.amenities && venue.amenities.length > 0 && (
          <div className="section">
            <div className="section-title">Amenities</div>
            <div className="amenities-grid">
              {venue.amenities.map((amenity) => (
                <div key={amenity} className="amenity">
                  <span className="dot" /> {amenity.replace('_', ' ').toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact & Policies */}
        <div className="section">
          <div className="section-title">Contact & Policies</div>
          <div className="contact-policies-grid">
            {venue.contact && (
              <div className="contact-card">
                <h4>Contact Information</h4>
                <p>📞 {venue.contact.phone}</p>
                <p>📧 {venue.contact.email}</p>
              </div>
            )}
            {venue.policies && (
              <div className="policies-card">
                <h4>Policies</h4>
                <p>Cancellation: {venue.policies.cancellation}</p>
                <p>Advance Booking: {venue.policies.advance_booking_days} days</p>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        {venue.recentReviews && venue.recentReviews.length > 0 && (
          <div className="section">
            <div className="section-title">Recent Reviews</div>
            <div className="review-list">
              {/* {venue.recentReviews.map((review) => (
                <div key={review._id} className="review-item">
                  <div className="review-top">
                    <div className="review-name">
                      {review.user?.name || 'Anonymous'} — {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </div>
                    <div>📅 {new Date(review.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ marginTop: 6 }}>{review.comment}</div>
                </div>
              ))} */}
              <ReviewList venueId={venueId} />
            </div>
          </div>
        )}

        {/* Stats */}
        {venue.stats && (
          <div className="section">
            <div className="section-title">Venue Statistics</div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{venue.stats.totalBookings || 0}</div>
                <div className="stat-label">Total Bookings</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{venue.stats.totalRevenue || 0}</div>
                <div className="stat-label">Total Revenue</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{venue.stats.averageOccupancy || 0}%</div>
                <div className="stat-label">Avg. Occupancy</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueDetails;


// frontend/src/pages/user/VenueDetails.js
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './VenueDetails.css';

const VenueDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [activeSport, setActiveSport] = useState(null);

  useEffect(() => {
    const fetchVenueDetails = async () => {
      try {
        setLoading(true);
        // Mocked until API integration
        const mockVenue = {
          _id: id,
          name: 'SBR Badminton',
          location: 'Satellite, Jodhpur Village',
          rating: { average: 4.5, count: 6 },
          images: [
            '/assets/images/venue1.jpg',
            '/assets/images/venue2.jpg',
            '/assets/images/venue3.jpg'
          ],
          operatingHours: '7:00AM - 11:00PM',
          address: '2nd Floor, Aagam Banquet Hall Opp. Akruti Heights, Satellite, Jodhpur Village, Ahmedabad, Gujarat - 380015',
          sports: ['Badminton', 'Table Tennis', 'Box Cricket'],
          amenities: ['Parking', 'Restroom', 'Refreshments', 'CCTV Surveillance', 'Centrally Air Conditioned Hall', 'Seating Arrangement', 'WiFi', 'Library'],
          about: [
            'Tournament Training Venue',
            'For more than 2 players Rs. 50 extra per person',
            'Equipment available on rent',
            '...'
          ],
          reviews: new Array(6).fill(0).map((_, i) => ({
            id: i + 1,
            name: 'Mitchell Admin',
            rating: 5,
            date: '10 June 2025, 5:30 PM',
            text: 'Nice turf, well maintained'
          }))
        };
        setVenue(mockVenue);
        setActiveSport(mockVenue.sports[0]);
      } catch (e) {
        console.error('Error loading venue', e);
      } finally {
        setLoading(false);
      }
    };
    fetchVenueDetails();
  }, [id]);

  const imageSrc = useMemo(() => venue?.images?.[imgIndex] || '', [venue, imgIndex]);

  if (loading) return <div>Loading venue details...</div>;
  if (!venue) return <div>Venue not found</div>;

  return (
    <div className="venue-page">
      <div className="venue-container">
        {/* Header */}
        <div className="venue-header">
          <div>
            <div className="venue-title">{venue.name}</div>
            <div className="venue-sub">
              <span>📍 {venue.location}</span>
              <span>⭐ {venue.rating.average} ({venue.rating.count})</span>
            </div>
          </div>
          <div>
            <button className="cta" onClick={() => navigate(`/book/${venue._id}`)}>Book This Venue</button>
          </div>
        </div>

        {/* Top Grid: Media + Info */}
        <div className="top-grid">
          <div className="media-box">
            {imageSrc ? (
              <img src={imageSrc} alt={venue.name} className="media-img" />
            ) : (
              <div>Images / Videos</div>
            )}
            <div className="carousel-nav">
              <button className="carousel-btn" onClick={() => setImgIndex((i) => (i - 1 + venue.images.length) % venue.images.length)}>{'<'}</button>
              <button className="carousel-btn" onClick={() => setImgIndex((i) => (i + 1) % venue.images.length)}>{'>'}</button>
            </div>
          </div>
          <div className="info-panel">
            <div className="info-card">
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Operating Hours</div>
              <div>{venue.operatingHours}</div>
            </div>
            <div className="info-card">
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Address</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{venue.address}</div>
            </div>
            <div className="info-card">
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Location Map</div>
              <div style={{ color: '#6b7280' }}>Map placeholder</div>
            </div>
          </div>
        </div>

        {/* Sports */}
        <div className="section">
          <div className="section-title">Sports Available <span style={{ color: '#6b7280', fontWeight: 400 }}>(Click on sports to view price chart)</span></div>
          <div className="sports-row">
            {venue.sports.map((s) => (
              <button key={s} className={`sport-tile ${activeSport === s ? 'active' : ''}`} onClick={() => setActiveSport(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div className="section">
          <div className="section-title">Amenities</div>
          <div className="amenities-grid">
            {venue.amenities.map((a) => (
              <div key={a} className="amenity"><span className="dot" /> {a}</div>
            ))}
          </div>
        </div>

        {/* About Venue */}
        <div className="section">
          <div className="section-title">About Venue</div>
          <ul className="about-list">
            {venue.about.map((line, idx) => (
              <li key={idx}>— {line}</li>
            ))}
          </ul>
        </div>

        {/* Reviews */}
        <div className="section">
          <div className="section-title">Player Reviews & Ratings</div>
          <div className="review-list">
            {venue.reviews.map((r) => (
              <div key={r.id} className="review-item">
                <div className="review-top">
                  <div className="review-name">{r.name} — {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                  <div>📅 {r.date}</div>
                </div>
                <div style={{ marginTop: 6 }}>{r.text}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <button className="load-more">[Load more reviews]</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueDetails;

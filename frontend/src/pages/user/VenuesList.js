import React, { useState } from 'react';
import './VenuList.css';

const mockVenues = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: 'SRB Badminton',
  location: 'Vaishnodevi Cir',
  rating: 4.3,
  reviews: 6,
  image: '', // Placeholder for now
  price: '₹ 250 per hour',
  amenities: ['Indoor', 'Badminton', 'Top Rated', 'Budget'],
}));

const VenuesList = () => {
  const [page, setPage] = useState(2);

  return (
    <div className="venues-list-layout">
      {/* Sidebar */}
      <aside className="venues-sidebar">
        <div className="sidebar-section">
          <label htmlFor="search-venue">Search by venue name</label>
          <input id="search-venue" type="text" placeholder="Search for venue" />
        </div>
        <div className="sidebar-section">
          <label>Filter by sport type</label>
          <select>
            <option>All sports</option>
            <option>Badminton</option>
            <option>Football</option>
            <option>Cricket</option>
          </select>
        </div>
        <div className="sidebar-section">
          <label>Price range (per hour)</label>
          <input type="range" min="0" max="5000" />
          <div className="price-range-labels">
            <span>₹ 0</span>
            <span>₹ 5,000</span>
          </div>
        </div>
        <div className="sidebar-section">
          <label>Choose Venue Type</label>
          <div>
            <input type="checkbox" id="indoor" />
            <label htmlFor="indoor">Indoor</label>
          </div>
          <div>
            <input type="checkbox" id="outdoor" />
            <label htmlFor="outdoor">Outdoor</label>
          </div>
        </div>
        <div className="sidebar-section">
          <label>Rating</label>
          <div><input type="checkbox" /> 5 stars & up</div>
          <div><input type="checkbox" /> 4 stars & up</div>
          <div><input type="checkbox" /> 3 stars & up</div>
          <div><input type="checkbox" /> 2 stars & up</div>
          <div><input type="checkbox" /> 1 star & up</div>
        </div>
        <button className="clear-filters-btn">Clear Filters</button>
      </aside>

      {/* Main Content */}
      <main className="venues-main">
        <h2 className="venues-title">
          Sports Venues in Ahmedabad: Discover and Book Nearby Venues
        </h2>
        <div className="venues-grid">
          {mockVenues.map((venue) => (
            <div key={venue.id} className="venue-card-outline">
              <div className="venue-image-placeholder">Image</div>
              <div className="venue-info-outline">
                <div className="venue-header-row">
                  <span className="venue-name">{venue.name}</span>
                  <span className="venue-rating-outline">⭐ {venue.rating} <span className="venue-reviews">({venue.reviews})</span></span>
                </div>
                <div className="venue-location-outline">♥ {venue.location}</div>
                <div className="venue-price-outline">{venue.price}</div>
                <div className="venue-amenities-outline">
                  {venue.amenities.map((tag, idx) => (
                    <span key={idx} className="venue-tag-outline">{tag}</span>
                  ))}
                </div>
                <button className="view-details-btn-outline">View Details</button>
              </div>
            </div>
          ))}
        </div>
        <div className="venues-pagination">
          <button className="pagination-btn-outline">{'<'}</button>
          <span className="pagination-page active">{page}</span>
          <span className="pagination-page">3</span>
          <span className="pagination-page">4</span>
          <span className="pagination-page">...</span>
          <span className="pagination-page">11</span>
          <button className="pagination-btn-outline">{'>'}</button>
        </div>
      </main>
    </div>
  );
};

export default VenuesList;
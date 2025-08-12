import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVenues } from '../../hooks/useVenues';
import SearchWithSuggestions from '../../components/common/SearchWithSuggestions';
import './VenuesList.css';

const VenuesList = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: '',
    sport: '',
    minPrice: 0,
    maxPrice: 5000,
    rating: 0
  });

  const {
    venues,
    loading,
    error,
    pagination,
    fetchVenues,
    searchVenues,
    getSearchSuggestions,
    updateFilters,
    clearFilters
  } = useVenues(filters);

  const handleFilterChange = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    updateFilters(updatedFilters);
  };

  const handleSearch = () => {
    searchVenues(filters);
  };

  const handleSuggestionSelect = (suggestion) => {
    if (suggestion.type === 'venue') {
      // Navigate directly to venue if a specific venue was selected
      navigate(`/venue/${suggestion.id}`);
    } else if (suggestion.type === 'location') {
      // Update search with the selected location and perform search
      const updatedFilters = { ...filters, search: suggestion.value || suggestion.text };
      setFilters(updatedFilters);
      searchVenues(updatedFilters);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchVenues({ ...filters, page: newPage });
    }
  };

  const formatLocation = (location) => {
    if (!location) return '';
    const parts = [location.address, location.city, location.state].filter(Boolean);
    return parts.join(', ');
  };

  const formatPrice = (venue) => {
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
      basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=300&h=200&fit=crop',
      table_tennis: 'https://images.unsplash.com/photo-1609710228159-0fa9bd7c0827?w=300&h=200&fit=crop'
    };
    return fallbackImages[venue.sports?.[0]] || 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=300&h=200&fit=crop';
  };

  const getSportIcon = (sport) => {
    const icons = {
      badminton: '🏸',
      football: '⚽',
      cricket: '🏏',
      tennis: '🎾',
      basketball: '🏀',
      table_tennis: '🏓',
      volleyball: '🏐'
    };
    return icons[sport] || '🏟️';
  };

  return (
    <div className="venues-list-layout">
      {/* Sidebar */}
      <aside className="venues-sidebar">
        <div className="sidebar-section">
          <label htmlFor="search-venue">Search by venue name or location</label>
          <SearchWithSuggestions
            value={filters.search}
            onChange={(value) => handleFilterChange({ search: value })}
            onSearch={handleSearch}
            onSuggestionSelect={handleSuggestionSelect}
            getSuggestions={getSearchSuggestions}
            placeholder="Search venues, areas, or cities..."
            className="venue-search"
          />
        </div>
        
        <div className="sidebar-section">
          <label>Filter by sport type</label>
          <select
            value={filters.sport}
            onChange={(e) => handleFilterChange({ sport: e.target.value })}
          >
            <option value="">All sports</option>
            <option value="badminton">Badminton</option>
            <option value="football">Football</option>
            <option value="cricket">Cricket</option>
            <option value="tennis">Tennis</option>
            <option value="basketball">Basketball</option>
            <option value="table_tennis">Table Tennis</option>
            <option value="volleyball">Volleyball</option>
          </select>
        </div>
        
        <div className="sidebar-section">
          <label>Price range (per hour)</label>
          <div className="price-inputs">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange({ minPrice: parseInt(e.target.value) || 0 })}
            />
            <span>-</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange({ maxPrice: parseInt(e.target.value) || 5000 })}
            />
          </div>
        </div>
        
        <div className="sidebar-section">
          <label>Minimum Rating</label>
          <select
            value={filters.rating}
            onChange={(e) => handleFilterChange({ rating: parseInt(e.target.value) })}
          >
            <option value="0">All ratings</option>
            <option value="5">5 stars & up</option>
            <option value="4">4 stars & up</option>
            <option value="3">3 stars & up</option>
            <option value="2">2 stars & up</option>
            <option value="1">1 star & up</option>
          </select>
        </div>
        
        <button
          className="clear-filters-btn"
          onClick={clearFilters}
        >
          Clear Filters
        </button>
      </aside>

      {/* Main Content */}
      <main className="venues-main">
        <h2 className="venues-title">
          Sports Venues: Discover and Book Nearby Venues
        </h2>
        
        {loading && (
          <div className="loading-state">
            <div>Loading venues...</div>
          </div>
        )}

        {error && (
          <div className="error-state">
            <div>{error}</div>
            <button onClick={() => fetchVenues(filters)} className="retry-btn">Retry</button>
          </div>
        )}

        <div className="venues-grid">
          {(!loading && !error && venues.length > 0) ? (
            venues.map((venue) => (
              <div key={venue._id} className="venue-card-outline">
                <div className="venue-image-placeholder">
                  <img src={getVenueImage(venue)} alt={venue.name} />
                </div>
                <div className="venue-info-outline">
                  <div className="venue-header-row">
                    <span className="venue-name">{venue.name}</span>
                    <span className="venue-rating-outline">
                      ⭐ {venue.rating?.average || venue.averageRating || 'N/A'}
                      <span className="venue-reviews">({venue.rating?.count || venue.totalReviews || 0})</span>
                    </span>
                  </div>
                  <div className="venue-location-outline">
                    📍 {formatLocation(venue.location)}
                  </div>
                  <div className="venue-price-outline">
                    {formatPrice(venue)}
                  </div>
                  <div className="venue-amenities-outline">
                    {venue.sports && venue.sports.map((sport, idx) => (
                      <span key={idx} className="venue-tag-outline">
                        {getSportIcon(sport)} {sport}
                      </span>
                    ))}
                    {venue.amenities && venue.amenities.slice(0, 2).map((amenity, idx) => (
                      <span key={`amenity-${idx}`} className="venue-tag-outline">{amenity}</span>
                    ))}
                  </div>
                  <button
                    className="view-details-btn-outline"
                    onClick={() => navigate(`/venue/${venue._id}`)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          ) : !loading && !error ? (
            <div className="no-venues-message">
              <p>No venues found matching your criteria.</p>
              <button
                onClick={clearFilters}
                className="clear-filters-btn"
              >
                Clear Filters
              </button>
            </div>
          ) : null}
        </div>
        
        {!loading && !error && venues.length > 0 && pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="page-btn"
            >
              Previous
            </button>
            <span className="page-info">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="page-btn"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default VenuesList;
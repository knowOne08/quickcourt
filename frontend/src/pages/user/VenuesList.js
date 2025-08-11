import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { venueService } from '../../services/venueService';
import './VenuList.css';

// (Removed erroneous inline styles injection that broke the module)

const VenuesList = () => {
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    sport: '',
    priceRange: [0, 5000],
    venueType: [],
    rating: 0
  });

  // Helpers to normalize backend data shapes (Extended JSON, etc.)
  const getId = (v) => v?._id?.$oid || v?._id || v?.id;
  const getNum = (val) => {
    if (val == null) return null;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const n = Number(val);
      return Number.isNaN(n) ? null : n;
    }
    if (typeof val === 'object') {
      if ('$numberDouble' in val) return Number(val.$numberDouble);
      if ('$numberInt' in val) return Number.parseInt(val.$numberInt, 10);
      if ('value' in val) return getNum(val.value);
    }
    return null;
  };
  const getImage = (venue) => {
    if (!Array.isArray(venue?.images) || venue.images.length === 0) return null;
    const first = venue.images[0];
    if (typeof first === 'string') return first;
    if (typeof first === 'object') return first.url || null;
    return null;
  };
  const formatLocation = (loc) => {
    if (!loc) return '';
    const parts = [loc.address, loc.city, loc.state, loc.pincode].filter(Boolean);
    return parts.join(', ');
  };


  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };



  const fetchVenues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Map frontend filters to backend query params
      const params = {
        page,
        minPrice: filters.priceRange?.[0] ?? 0,
        maxPrice: filters.priceRange?.[1] ?? 5000
      };
      if (filters.sport) params.sport = filters.sport;
      if (filters.rating) params.rating = filters.rating;
      if (filters.venueType?.length === 1) params.venueType = filters.venueType[0];

      const response = filters.search
        ? await venueService.searchVenues(filters.search, params)
        : await venueService.getAllVenues(params);

      if (!response?.data) throw new Error('No data received from server');
      const payload = response.data.data || {};

      // Support both shapes: data.venues + data.totalPages/currentPage
      // or data.venues + data.pagination.{currentPage,totalPages}
      const venuesList = Array.isArray(payload.venues) ? payload.venues : [];
      const p = payload.pagination || {};
      const currentPage = payload.currentPage || p.currentPage || page || 1;
      const totalPages = payload.totalPages || p.totalPages || 1;

      setVenues(venuesList);
      setTotalPages(Math.max(1, Number(totalPages)));
      setPage(Number(currentPage));

      if (
        venuesList.length === 0 &&
        !filters.search && !filters.sport && filters.rating === 0 && (filters.venueType?.length || 0) === 0
      ) {
        setError('No venues available at the moment.');
      }
    } catch (err) {
      console.error('Error fetching venues:', err);
      setVenues([]);
      setError(err?.response?.data?.message || err?.response?.data?.error || err.message || 'Failed to fetch venues');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  // Fetch venues when component mounts or filters/page change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVenues();
    }, 300); // Debounce API calls

    return () => clearTimeout(timer);
  }, [fetchVenues]);

  return (
    <div className="venues-list-layout">
      {/* Sidebar */}
      <aside className="venues-sidebar">
        <div className="sidebar-section">
          <label htmlFor="search-venue">Search by venue name</label>
          <input
            id="search-venue"
            type="text"
            placeholder="Search for venue"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
        <div className="sidebar-section">
          <label>Filter by sport type</label>
          <select
            value={filters.sport}
            onChange={(e) => setFilters(prev => ({ ...prev, sport: e.target.value }))}
          >
            <option value="">All sports</option>
            <option value="badminton">Badminton</option>
            <option value="football">Football</option>
            <option value="cricket">Cricket</option>
            <option value="tennis">Tennis</option>
          </select>
        </div>
        <div className="sidebar-section">
          <label>Price range (per hour)</label>
          <input
            type="range"
            min="0"
            max="5000"
            value={filters.priceRange[1]}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              priceRange: [prev.priceRange[0], parseInt(e.target.value)]
            }))}
          />
          <div className="price-range-labels">
            <span>₹ {filters.priceRange[0]}</span>
            <span>₹ {filters.priceRange[1]}</span>
          </div>
        </div>
        <div className="sidebar-section">
          <label>Choose Venue Type</label>
          <div>
            <input
              type="checkbox"
              id="indoor"
              checked={filters.venueType.includes('indoor')}
              onChange={(e) => {
                const newTypes = e.target.checked
                  ? [...filters.venueType, 'indoor']
                  : filters.venueType.filter(t => t !== 'indoor');
                setFilters(prev => ({ ...prev, venueType: newTypes }));
              }}
            />
            <label htmlFor="indoor">Indoor</label>
          </div>
          <div>
            <input
              type="checkbox"
              id="outdoor"
              checked={filters.venueType.includes('outdoor')}
              onChange={(e) => {
                const newTypes = e.target.checked
                  ? [...filters.venueType, 'outdoor']
                  : filters.venueType.filter(t => t !== 'outdoor');
                setFilters(prev => ({ ...prev, venueType: newTypes }));
              }}
            />
            <label htmlFor="outdoor">Outdoor</label>
          </div>
        </div>
        <div className="sidebar-section">
          <label>Minimum Rating</label>
          <select
            value={filters.rating}
            onChange={(e) => setFilters(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
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
          onClick={() => setFilters({
            search: '',
            sport: '',
            priceRange: [0, 5000],
            venueType: [],
            rating: 0
          })}
        >
          Clear Filters
        </button>
      </aside>

      {/* Main Content */}
      <main className="venues-main">
        <h2 className="venues-title">
          Sports Venues in Ahmedabad: Discover and Book Nearby Venues
        </h2>
        {loading && (
          <div className="loading-state">
            <div>Loading venues...</div>
          </div>
        )}

        {error && (
          <div className="error-state">
            <div>{error}</div>
            <button onClick={fetchVenues} className="retry-btn">Retry</button>
          </div>
        )}

        <div className="venues-grid">
          {(!loading && !error && Array.isArray(venues)) ? (
            venues.length === 0 ? (
              <div className="no-venues-message">
                <p>No venues found matching your criteria.</p>
                {(filters.search || filters.sport || filters.rating > 0 || filters.venueType.length > 0) && (
                  <button
                    onClick={() => {
                      setFilters({
                        search: '',
                        sport: '',
                        priceRange: [0, 5000],
                        venueType: [],
                        rating: 0
                      });
                    }}
                    className="clear-filters-btn"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              venues.map((venue) => (
                <div key={getId(venue)} className="venue-card-outline">
                  <div className="venue-image-placeholder">
                    {getImage(venue) ? (
                      <img src={getImage(venue)} alt={venue.name} />
                    ) : (
                      "No Image"
                    )}
                  </div>
                  <div className="venue-info-outline">
                    <div className="venue-header-row">
                      <span className="venue-name">{venue.name}</span>
                      <span className="venue-rating-outline">
                        ⭐ {venue.rating?.average || 'N/A'}
                        <span className="venue-reviews">({venue.rating?.count || 0})</span>
                      </span>
                    </div>
                    <div className="venue-id-outline">ID: {venue._id || venue.id}</div>
                    <div className="venue-location-outline">📍 {formatLocation(venue.location)}</div>
                    <div className="venue-price-outline">₹ {venue.pricing?.hourly ?? venue.pricePerHour ?? 0} per hour</div>
                    <div className="venue-amenities-outline">
                      {venue.sports?.map((sport, idx) => (
                        <span key={idx} className="venue-tag-outline">{sport}</span>
                      ))}
                      {venue.amenities?.map((amenity, idx) => (
                        <span key={`amenity-${idx}`} className="venue-tag-outline">{amenity}</span>
                      ))}
                    </div>
                    <button
                      className="view-details-btn-outline"
                      onClick={() => navigate(`/venue/${getId(venue)}`)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))
            )
          ) : (
            <div className="no-venues-message">
              <p>No venues found matching your criteria.</p>
              <button
                onClick={() => {
                  setFilters({
                    search: '',
                    sport: '',
                    priceRange: [0, 5000],
                    venueType: [],
                    rating: 0
                  });
                }}
                className="clear-filters-btn"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
        {!loading && !error && venues.length > 0 && (
          <div className="pagination">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="page-btn"
            >
              Previous
            </button>
            <span className="page-info">Page {page} of {totalPages}</span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
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
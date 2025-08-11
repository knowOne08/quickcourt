// NoVenuesMessage component
const NoVenuesMessage = ({ onClearFilters }) => (
    <div className="no-venues-message">
        <p>No venues found matching your criteria.</p>
        <button onClick={onClearFilters} className="clear-filters-btn">
            Clear All Filters
        </button>
    </div>
);

// VenueCard component
const VenueCard = ({ venue, onViewDetails }) => (
    <div className="venue-card-outline">
        <div className="venue-image-placeholder">
            {venue.images && venue.images.length > 0 ? (
                <img src={venue.images[0]} alt={venue.name} />
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
            <div className="venue-location-outline">📍 {venue.location}</div>
            <div className="venue-price-outline">₹ {venue.pricing?.basePrice || 0} per hour</div>
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
                onClick={() => onViewDetails(venue._id)}
            >
                View Details
            </button>
        </div>
    </div>
);

export { NoVenuesMessage, VenueCard };

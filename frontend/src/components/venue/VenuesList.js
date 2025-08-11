import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../common/LoadingSpinner';
import { NoVenuesMessage, VenueCard } from './VenueComponents';
import { venueService } from '../../services/venueService';
import './VenuesList.css';

const VenuesList = ({ searchQuery, filters, title = "Sports Venues" }) => {
    const [venues, setVenues] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const navigate = useNavigate();

    const handlePageChange = useCallback((newPage) => {
        setPage(newPage);
    }, []);

    useEffect(() => {
        const fetchVenues = async () => {
            setIsLoading(true);
            try {
                const response = await venueService.getVenues({
                    page,
                    search: searchQuery,
                    ...filters
                });

                setVenues(response.data);
                setTotalPages(response.totalPages);
                setError(null);
            } catch (err) {
                setError(err.message);
                setVenues([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchVenues();
    }, [searchQuery, filters, page]);

    const handleViewDetails = (venueId) => {
        navigate(`/venue/${venueId}`);
    };

    const handleClearFilters = () => {
        if (filters && typeof filters.onClear === 'function') {
            filters.onClear();
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return <LoadingSpinner />;
        }

        if (error) {
            return <div className="error-message">Error: {error}</div>;
        }

        if (!venues || venues.length === 0) {
            return <NoVenuesMessage onClearFilters={handleClearFilters} />;
        }

        return (
            <div className="venues-grid">
                {venues.map(venue => (
                    <VenueCard
                        key={venue._id}
                        venue={venue}
                        onViewDetails={handleViewDetails}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="venues-container">
            {title && <h2 className="venues-title">{title}</h2>}
            {renderContent()}
            {!isLoading && !error && venues.length > 0 && (
                <div className="pagination">
                    <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        className="page-btn"
                    >
                        Previous
                    </button>
                    <span className="page-info">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages}
                        className="page-btn"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default VenuesList;

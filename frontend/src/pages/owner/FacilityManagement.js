// frontend/src/pages/owner/FacilityManagement.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ownerService } from '../../services/ownerService';
import VenueModal from '../../components/venue/VenueModal';
import '../../styles/facility-management.css';

const FacilityManagement = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [error, setError] = useState('');
  const [debugMode, setDebugMode] = useState(false);
  const [isAuthError, setIsAuthError] = useState(false);

  useEffect(() => {
    // Wait for auth loading to complete
    if (!authLoading) {
      if (!isAuthenticated) {
        setError('Please log in to access this page.');
        setIsAuthError(true);
        setLoading(false);
      } else if (user?.role !== 'facility_owner' && user?.role !== 'owner') {
        setError('Access denied. This page is only for facility owners.');
        setIsAuthError(false);
        setLoading(false);
      } else {
        fetchVenues();
      }
    }
  }, [authLoading, isAuthenticated, user]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      setError('');
      setIsAuthError(false);
      console.log('Fetching venues...');
      const response = await ownerService.getVenues();
      console.log('Response:', response);
      
      // Handle different response structures
      const venuesData = response.data?.data?.venues || response.data?.venues || response.data || [];
      console.log('Venues data:', venuesData);
      
      setVenues(Array.isArray(venuesData) ? venuesData : []);
    } catch (error) {
      console.error('Error fetching venues:', error);
      
      // More detailed error handling
      if (error.response) {
        // Server responded with error status
        const statusCode = error.response.status;
        const errorMessage = error.response.data?.message || error.response.data?.error || 'Server error';
        
        if (statusCode === 401 || errorMessage.includes('not logged in')) {
          setError('Authentication required. Please log in as a facility owner to access this page.');
          setIsAuthError(true);
        } else if (statusCode === 403) {
          setError('You do not have permission to access venues. Please ensure you are logged in as a facility owner.');
          setIsAuthError(true);
        } else if (statusCode === 404) {
          setError('Venues endpoint not found. Please contact support.');
        } else {
          setError(`Error ${statusCode}: ${errorMessage}`);
        }
      } else if (error.request) {
        // Network error
        setError('Unable to connect to the server. Please check your internet connection.');
      } else {
        // Other error
        setError('An unexpected error occurred. Please try again.');
      }
      
      // Fallback to mock data for testing
      if (debugMode) {
        console.log('Using mock data for testing...');
        setVenues([
          {
            _id: 'mock-1',
            name: 'Elite Sports Complex',
            description: 'Premium sports facility with modern amenities',
            location: {
              address: '123 Sports Street',
              city: 'Ahmedabad',
              state: 'Gujarat',
              pincode: '380001'
            },
            sports: ['badminton', 'tennis'],
            venueType: 'indoor',
            status: 'approved',
            courts: [{}, {}],
            pricing: { hourly: 500 },
            rating: { average: 4.5, count: 25 },
            amenities: ['parking', 'changing_room']
          }
        ]);
        setError('');
      }
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      console.log('Testing API connection...');
      const response = await ownerService.testConnection();
      console.log('Connection test successful:', response);
      alert('API connection successful! Check console for details.');
    } catch (error) {
      console.error('Connection test failed:', error);
      alert(`Connection test failed: ${error.message}`);
    }
  };

  const handleCreateVenue = () => {
    setSelectedVenue(null);
    setShowModal(true);
  };

  const handleEditVenue = (venue) => {
    setSelectedVenue(venue);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedVenue(null);
  };

  const handleVenueSuccess = () => {
    setShowModal(false);
    setSelectedVenue(null);
    fetchVenues(); // Refresh the list
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'pending': 'status-pending',
      'approved': 'status-approved', 
      'rejected': 'status-rejected',
      'suspended': 'status-suspended'
    };
    return <span className={`status-badge ${statusClasses[status]}`}>{status}</span>;
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading venues...</p>
    </div>
  );

  if (error) return (
    <div className="error-container">
      <p className="error-message">{error}</p>
      <div className="error-actions">
        {isAuthError && (
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/login')}
          >
            Go to Login
          </button>
        )}
        <button className="btn btn-primary" onClick={fetchVenues}>
          Retry
        </button>
        <button 
          className="btn btn-outline" 
          onClick={() => {
            setDebugMode(!debugMode);
            fetchVenues();
          }}
        >
          {debugMode ? 'Disable' : 'Enable'} Mock Data
        </button>
        <button className="btn btn-secondary" onClick={testConnection}>
          Test Connection
        </button>
      </div>
      {debugMode && (
        <div className="debug-info">
          <h4>Debug Information:</h4>
          <p>API URL: {process.env.REACT_APP_API_URL || 'http://localhost:4000/api'}</p>
          <p>Token: {localStorage.getItem('token') ? 'Present' : 'Missing'}</p>
          <p>Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
          <p>User Role: {user?.role || 'No role'}</p>
          <p>Auth Loading: {authLoading ? 'Yes' : 'No'}</p>
          <div className="debug-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => window.open('/admin/venues', '_blank')}
            >
              Open Admin Panel
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="facility-management-page">
      <div className="facility-container">
        <div className="page-header">
          <h1>Venue Management</h1>
          <p>Manage your sports venues and facilities</p>
        </div>
        
        <div className="facility-actions">
          <button 
            className="btn btn-primary add-venue-btn"
            onClick={handleCreateVenue}
          >
            <span className="btn-icon">+</span>
            Add New Venue
          </button>
        </div>
        
        {venues.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏟️</div>
            <h3>No venues yet</h3>
            <p>Start by adding your first venue to begin managing bookings</p>
            <button 
              className="btn btn-primary"
              onClick={handleCreateVenue}
            >
              Add Your First Venue
            </button>
          </div>
        ) : (
          <div className="venues-grid">
            {venues.map(venue => (
              <div key={venue._id} className="venue-card">
                <div className="venue-image">
                  {venue.images && venue.images.length > 0 ? (
                    <img src={venue.images[0].url} alt={venue.name} />
                  ) : (
                    <div className="no-image">📷</div>
                  )}
                </div>
                
                <div className="venue-content">
                  <div className="venue-header">
                    <h3>{venue.name}</h3>
                    {getStatusBadge(venue.status)}
                  </div>
                  
                  <div className="venue-details">
                    <p className="venue-location">
                      📍 {venue.location?.city}, {venue.location?.state}
                    </p>
                    <p className="venue-sports">
                      🏃 {venue.sports?.join(', ')}
                    </p>
                    <p className="venue-type">
                      🏢 {venue.venueType}
                    </p>
                    <p className="venue-courts">
                      🎾 {venue.courts?.length || 0} courts
                    </p>
                    <p className="venue-price">
                      💰 ₹{venue.pricing?.hourly}/hour
                    </p>
                    {venue.rating?.average > 0 && (
                      <p className="venue-rating">
                        ⭐ {venue.rating.average} ({venue.rating.count} reviews)
                      </p>
                    )}
                  </div>
                  
                  <div className="venue-actions">
                    <button 
                      className="btn btn-outline"
                      onClick={() => handleEditVenue(venue)}
                    >
                      Edit
                    </button>
                    <button className="btn btn-secondary">
                      View Bookings
                    </button>
                    <button className="btn btn-success">
                      Manage Courts
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {showModal && (
        <VenueModal
          venue={selectedVenue}
          onClose={handleModalClose}
          onSuccess={handleVenueSuccess}
        />
      )}
    </div>
  );
};

export default FacilityManagement;

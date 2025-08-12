// frontend/src/pages/admin/VenueApproval.js
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import '../../styles/venue-approval.css';

const VenueApproval = () => {
  const { user } = useAuth();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchVenues();
    }
  }, [filter, user]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAllVenues({ status: filter });
      setVenues(response.data.data.venues || []);
    } catch (error) {
      console.error('Error fetching venues:', error);
      setError('Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (venueId) => {
    try {
      await adminService.approveVenue(venueId, 'Admin approved');
      setVenues(venues.filter(v => v._id !== venueId));
      alert('Venue approved successfully!');
    } catch (error) {
      console.error('Error approving venue:', error);
      alert('Failed to approve venue');
    }
  };

  const handleReject = async (venueId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      await adminService.rejectVenue(venueId, reason);
      setVenues(venues.filter(v => v._id !== venueId));
      alert('Venue rejected successfully!');
    } catch (error) {
      console.error('Error rejecting venue:', error);
      alert('Failed to reject venue');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="admin-access-denied">
        <h2>Access Denied</h2>
        <p>You need admin privileges to access this page.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading venues...</p>
      </div>
    );
  }

  return (
    <div className="venue-approval-page">
      <div className="page-header">
        <h1>Venue Management</h1>
        <p>Review and approve venues submitted by facility owners</p>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label htmlFor="status-filter">Filter by Status:</label>
          <select 
            id="status-filter"
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="">All Venues</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={fetchVenues}>Retry</button>
        </div>
      )}

      {venues.length === 0 ? (
        <div className="empty-state">
          <h3>No {filter} venues found</h3>
          <p>All venues in this category have been processed.</p>
        </div>
      ) : (
        <div className="venues-list">
          {venues.map(venue => (
            <div key={venue._id} className="venue-approval-card">
              <div className="venue-info">
                <div className="venue-header">
                  <h3>{venue.name}</h3>
                  <span className={`status-badge status-${venue.status}`}>
                    {venue.status}
                  </span>
                </div>
                
                <div className="venue-details">
                  <p><strong>Owner:</strong> {venue.owner?.name || 'N/A'}</p>
                  <p><strong>Location:</strong> {venue.location?.city}, {venue.location?.state}</p>
                  <p><strong>Sports:</strong> {venue.sports?.join(', ')}</p>
                  <p><strong>Type:</strong> {venue.venueType}</p>
                  <p><strong>Price:</strong> ₹{venue.pricing?.hourly}/hour</p>
                  <p><strong>Submitted:</strong> {new Date(venue.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="venue-description">
                  <h4>Description:</h4>
                  <p>{venue.description}</p>
                </div>

                {venue.images && venue.images.length > 0 && (
                  <div className="venue-images">
                    <h4>Images:</h4>
                    <div className="images-grid">
                      {venue.images.slice(0, 3).map((image, index) => (
                        <img 
                          key={index} 
                          src={`http://localhost:4000${image.url}`} 
                          alt={`Venue ${index + 1}`}
                          style={{ width: '100px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {venue.status === 'rejected' && venue.rejectionReason && (
                  <div className="rejection-reason">
                    <h4>Rejection Reason:</h4>
                    <p>{venue.rejectionReason}</p>
                  </div>
                )}
              </div>

              {venue.status === 'pending' && (
                <div className="approval-actions">
                  <button 
                    className="btn btn-success"
                    onClick={() => handleApprove(venue._id)}
                  >
                    Approve
                  </button>
                  <button 
                    className="btn btn-error"
                    onClick={() => handleReject(venue._id)}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VenueApproval;

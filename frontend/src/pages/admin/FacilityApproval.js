// frontend/src/pages/admin/FacilityApproval.js
import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import './FacilityApproval.css';

const FacilityApproval = () => {
  const [pendingFacilities, setPendingFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approvalComment, setApprovalComment] = useState('');

  useEffect(() => {
    fetchPendingFacilities();
  }, []);

  const fetchPendingFacilities = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPendingFacilities();
      setPendingFacilities(response.data);
    } catch (error) {
      console.error('Error fetching pending facilities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (facilityId) => {
    try {
      await adminService.approveFacility(facilityId, {
        status: 'approved',
        comment: approvalComment
      });
      
      // Remove from pending list
      setPendingFacilities(prev => 
        prev.filter(facility => facility._id !== facilityId)
      );
      setSelectedFacility(null);
      setApprovalComment('');
      
      alert('Facility approved successfully!');
    } catch (error) {
      console.error('Error approving facility:', error);
      alert('Error approving facility');
    }
  };

  const handleReject = async (facilityId) => {
    if (!approvalComment.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      await adminService.approveFacility(facilityId, {
        status: 'rejected',
        comment: approvalComment
      });
      
      // Remove from pending list
      setPendingFacilities(prev => 
        prev.filter(facility => facility._id !== facilityId)
      );
      setSelectedFacility(null);
      setApprovalComment('');
      
      alert('Facility rejected');
    } catch (error) {
      console.error('Error rejecting facility:', error);
      alert('Error rejecting facility');
    }
  };

  if (loading) {
    return <div className="approval-loading">Loading pending facilities...</div>;
  }

  return (
    <div className="facility-approval">
      <div className="approval-header">
        <h1>Facility Approval</h1>
        <p>Review and approve pending facility registrations</p>
      </div>

      <div className="approval-content">
        <div className="facilities-list">
          <h3>Pending Facilities ({pendingFacilities.length})</h3>
          
          {pendingFacilities.length === 0 ? (
            <div className="no-facilities">
              <p>No pending facilities for approval</p>
            </div>
          ) : (
            <div className="facilities-grid">
              {pendingFacilities.map(facility => (
                <div 
                  key={facility._id}
                  className={`facility-card ${selectedFacility?._id === facility._id ? 'selected' : ''}`}
                  onClick={() => setSelectedFacility(facility)}
                >
                  <div className="facility-image">
                    <img 
                      src={facility.images[0] || '/assets/images/default-venue.jpg'} 
                      alt={facility.name}
                    />
                  </div>
                  <div className="facility-info">
                    <h4>{facility.name}</h4>
                    <p>{facility.location}</p>
                    <div className="facility-sports">
                      {facility.sports.map(sport => (
                        <span key={sport} className="sport-tag">{sport}</span>
                      ))}
                    </div>
                    <p className="facility-owner">
                      Owner: {facility.owner.fullName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedFacility && (
          <div className="facility-details">
            <h3>Facility Details</h3>
            
            <div className="details-content">
              <div className="detail-section">
                <h4>Basic Information</h4>
                <p><strong>Name:</strong> {selectedFacility.name}</p>
                <p><strong>Location:</strong> {selectedFacility.location}</p>
                <p><strong>Type:</strong> {selectedFacility.venueType}</p>
                <p><strong>Description:</strong> {selectedFacility.description}</p>
              </div>

              <div className="detail-section">
                <h4>Owner Details</h4>
                <p><strong>Name:</strong> {selectedFacility.owner.fullName}</p>
                <p><strong>Email:</strong> {selectedFacility.owner.email}</p>
                <p><strong>Phone:</strong> {selectedFacility.owner.phone}</p>
              </div>

              <div className="detail-section">
                <h4>Sports & Amenities</h4>
                <div className="sports-list">
                  {selectedFacility.sports.map(sport => (
                    <span key={sport} className="sport-badge">{sport}</span>
                  ))}
                </div>
                <div className="amenities-list">
                  {selectedFacility.amenities.map(amenity => (
                    <span key={amenity} className="amenity-badge">{amenity}</span>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h4>Photos</h4>
                <div className="facility-gallery">
                  {selectedFacility.images.map((image, index) => (
                    <img key={index} src={image} alt={`${selectedFacility.name} ${index + 1}`} />
                  ))}
                </div>
              </div>
            </div>

            <div className="approval-actions">
              <div className="comment-section">
                <label htmlFor="approval-comment">Comments (optional for approval, required for rejection):</label>
                <textarea
                  id="approval-comment"
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder="Add comments about this facility..."
                  rows="3"
                />
              </div>
              
              <div className="action-buttons">
                <button 
                  className="btn btn-success"
                  onClick={() => handleApprove(selectedFacility._id)}
                >
                  Approve Facility
                </button>
                <button 
                  className="btn btn-error"
                  onClick={() => handleReject(selectedFacility._id)}
                >
                  Reject Facility
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacilityApproval;
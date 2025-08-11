// frontend/src/pages/owner/FacilityManagement.js
import React, { useState, useEffect } from 'react';
import { ownerService } from '../../services/ownerService';

const FacilityManagement = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      // Mock data for now
      const mockFacilities = [
        {
          _id: '1',
          name: 'Elite Sports Complex',
          location: 'Ahmedabad',
          status: 'active',
          courts: 4
        }
      ];
      setFacilities(mockFacilities);
    } catch (error) {
      console.error('Error fetching facilities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading facilities...</div>;

  return (
    <div className="facility-management-page">
      <div className="facility-container">
        <h1>Facility Management</h1>
        
        <div className="facility-actions">
          <button className="add-facility-btn">Add New Facility</button>
        </div>
        
        <div className="facilities-list">
          {facilities.map(facility => (
            <div key={facility._id} className="facility-item">
              <h3>{facility.name}</h3>
              <p>Location: {facility.location}</p>
              <p>Status: {facility.status}</p>
              <p>Courts: {facility.courts}</p>
              
              <div className="facility-actions">
                <button>Edit</button>
                <button>View Bookings</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FacilityManagement;

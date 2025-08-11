// frontend/src/pages/user/Profile.js
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle profile update
    setEditing(false);
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <h1>My Profile</h1>
        
        {editing ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            
            <div className="form-actions">
              <button type="submit">Save Changes</button>
              <button type="button" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className="profile-info">
            <p><strong>Name:</strong> {user?.fullName}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Phone:</strong> {user?.phone || 'Not provided'}</p>
            <p><strong>Role:</strong> {user?.role}</p>
            
            <button onClick={() => setEditing(true)}>Edit Profile</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;

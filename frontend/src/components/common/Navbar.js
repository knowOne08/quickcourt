// frontend/src/components/common/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <h2>QuickCourt</h2>
        </Link>

        <div className="navbar-menu">
          {isAuthenticated ? (
            <div className="navbar-user">
              <span>Welcome, {user?.name}</span>

              {user?.role === 'admin' && (
                <Link to="/admin/dashboard" className="navbar-link">Admin</Link>
              )}

              {user?.role === 'facility_owner' && (
                <Link to="/owner/dashboard" className="navbar-link">Dashboard</Link>
              )}

              {user?.role === 'user' && (
                <Link to="/my-bookings" className="navbar-link">My Bookings</Link>
              )}

              <Link to="/profile" className="navbar-link">Profile</Link>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </div>
          ) : (
            <div className="navbar-auth">
              <Link to="/login" className="navbar-link">Login</Link>
              <Link to="/signup" className="navbar-link signup-link">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
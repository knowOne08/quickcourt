// frontend/src/components/common/Navbar.js
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully!', {
      style: { borderRadius: '10px', background: '#333', color: '#fff' }
    });
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm transition-all duration-300">
      <div className="max-w-[1400px] mx-auto px-6 h-20 flex justify-between items-center">
        <Link to="/" className="text-2xl font-extrabold text-gray-900 tracking-tight font-outfit hover:text-primary transition-colors">
          QuickCourt
        </Link>

        <div className="flex items-center">
          {isAuthenticated ? (
            <div className="flex items-center gap-6">
              <span className="text-gray-600 font-medium hidden md:block">Welcome, <strong className="text-primary">{user?.name}</strong></span>

              {user?.role === 'admin' && (
                <Link to="/admin/dashboard" className="text-gray-600 font-semibold hover:text-primary transition-colors">Admin Panel</Link>
              )}

              {user?.role === 'facility_owner' ? (
                <Link to="/owner/dashboard" className="text-gray-600 font-semibold hover:text-primary transition-colors">Owner Dashboard</Link>
              ) : (
                <div className="hidden md:flex gap-6">
                  <Link to="/venues" className="text-gray-600 font-semibold hover:text-primary transition-colors">Book Venues</Link>
                  {user?.role !== 'admin' && (
                    <>
                      <Link to="/find-teams" className="text-gray-600 font-semibold hover:text-primary transition-colors">Teams</Link>
                      <Link to="/find-players" className="text-gray-600 font-semibold hover:text-primary transition-colors">Players</Link>
                    </>
                  )}
                  <Link to="/my-bookings" className="text-gray-600 font-semibold hover:text-primary transition-colors">My Bookings</Link>
                </div>
              )}

              <Link to="/profile" className="text-gray-600 font-semibold hover:text-primary transition-colors">Profile</Link>
              <button 
                onClick={handleLogout} 
                className="bg-transparent text-red-500 border border-red-500 hover:bg-red-500 hover:text-white px-5 py-2 rounded-full font-bold transition-all duration-300 shadow-sm hover:shadow-red-500/30"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-gray-600 font-semibold hover:text-primary transition-colors">Login</Link>
              <Link to="/signup" className="bg-primary text-white hover:bg-primary-hover px-6 py-2.5 rounded-full font-bold transition-all duration-300 shadow-md hover:shadow-primary/40 hover:-translate-y-0.5">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
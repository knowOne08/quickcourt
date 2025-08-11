// frontend/src/components/common/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, isAuthenticated, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access if requiredRole is specified
  if (requiredRole && user?.role !== requiredRole) {
    // Redirect based on user role
    switch (user?.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'facility_owner':
        return <Navigate to="/owner/dashboard" replace />;
      case 'user':
      default:
        return <Navigate to="/" replace />;
    }
  }

  // User is authenticated and has required role
  return children;
};

export default ProtectedRoute;

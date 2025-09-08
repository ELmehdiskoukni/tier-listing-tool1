import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requiredRole) {
    if (requiredRole === 'Admin' && user?.role !== 'Admin') {
      // Non-admin users trying to access admin routes get redirected to board
      return <Navigate to="/board" replace />;
    }
    
    if (requiredRole === 'Member' && !['Admin', 'Member'].includes(user?.role)) {
      // Invalid role users get redirected to login
      return <Navigate to="/login" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * ProtectedRoute component to protect routes that require authentication
 * In development mode, all routes are accessible
 * In production, unauthenticated users are redirected to login page
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const location = useLocation();
  
  // In development, always render children (bypass authentication)
  // Check if we're using our development user
  const isDevelopmentUser = currentUser?.id === 'dev-user';
  
  if (!isAuthenticated && !isDevelopmentUser) {
    // Redirect to login page with a return URL
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(location.pathname)}`} replace />;
  }
  
  return children;
};

export default ProtectedRoute;

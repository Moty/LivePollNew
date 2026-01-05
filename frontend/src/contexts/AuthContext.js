import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';

// Create the auth context
const AuthContext = createContext();

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Check if dev auth bypass is allowed (only in development with explicit flag)
const isDevAuthBypassAllowed = () => {
  return process.env.NODE_ENV === 'development' &&
         process.env.REACT_APP_ALLOW_DEV_AUTH_BYPASS === 'true';
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Set auth header for all axios requests
  const setAuthHeader = useCallback((token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, []);

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to get stored user
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('auth_token');

        if (storedUser && storedToken) {
          const user = JSON.parse(storedUser);
          setAuthHeader(storedToken);

          // Verify token is still valid by calling /api/auth/me
          try {
            const response = await axios.get(`${API_URL}/auth/me`);
            if (response.data.user) {
              setCurrentUser({ ...response.data.user, token: storedToken });
            } else {
              // Token invalid, clear storage
              localStorage.removeItem('user');
              localStorage.removeItem('auth_token');
              setAuthHeader(null);
            }
          } catch (err) {
            // Token verification failed
            console.warn('Token verification failed:', err.message);
            localStorage.removeItem('user');
            localStorage.removeItem('auth_token');
            setAuthHeader(null);

            // If dev bypass is allowed, create a dev user
            if (isDevAuthBypassAllowed()) {
              console.warn('Development mode: Using bypass authentication');
              const devUser = {
                id: 'dev-user',
                name: 'Development User',
                email: 'dev@example.com',
                role: 'user'
              };
              setCurrentUser(devUser);
            }
          }
        } else if (isDevAuthBypassAllowed()) {
          // No stored auth but dev bypass allowed
          console.warn('Development mode: Using bypass authentication');
          const devUser = {
            id: 'dev-user',
            name: 'Development User',
            email: 'dev@example.com',
            role: 'user'
          };
          setCurrentUser(devUser);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [setAuthHeader]);

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);

      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      const { user, token } = response.data;

      // Store user and token
      setCurrentUser({ ...user, token });
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('auth_token', token);
      setAuthHeader(token);

      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message ||
                           err.response?.data?.error ||
                           'Login failed. Please check your credentials.';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout endpoint to invalidate session server-side
      await axios.post(`${API_URL}/auth/logout`);
    } catch (err) {
      // Log but don't prevent logout on error
      console.warn('Logout API call failed:', err.message);
    }

    setCurrentUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    setAuthHeader(null);
    setError(null);
  };

  // Register function
  const register = async (name, email, password) => {
    try {
      setError(null);

      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password
      });

      const { user, token } = response.data;

      // Store user and token
      setCurrentUser({ ...user, token });
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('auth_token', token);
      setAuthHeader(token);

      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message ||
                           err.response?.data?.error ||
                           'Registration failed. Please try again.';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      const response = await axios.post(`${API_URL}/auth/refresh`);
      const { token } = response.data;

      localStorage.setItem('auth_token', token);
      setAuthHeader(token);
      setCurrentUser(prev => ({ ...prev, token }));

      return { success: true };
    } catch (err) {
      console.error('Token refresh failed:', err.message);
      // If refresh fails, log user out
      await logout();
      return { success: false };
    }
  };

  // Clear error
  const clearError = () => setError(null);

  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
    register,
    refreshToken,
    clearError,
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

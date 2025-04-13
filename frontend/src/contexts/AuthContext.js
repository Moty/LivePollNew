import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// Create the auth context
const AuthContext = createContext();

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Check if user is already logged in (from localStorage) or create a default user in development
  useEffect(() => {
    // In development mode, always create a default user
    const defaultUser = {
      id: 'dev-user',
      name: 'Development User',
      email: 'dev@example.com',
      token: 'dev-token',
    };
    
    // Set current user to default in development or try to get from localStorage
    setCurrentUser(defaultUser);
    
    // Set axios default auth header
    axios.defaults.headers.common['Authorization'] = `Bearer ${defaultUser.token}`;
    
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      // In a production app, this would be a real API call
      // For demo purposes, we'll simulate successful login
      const user = {
        id: '123456',
        name: 'Demo User',
        email: email,
        token: 'dummy-auth-token-would-be-jwt-in-production',
      };
      
      // Set current user and store in localStorage
      setCurrentUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set axios default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'An unknown error occurred'
      };
    }
  };

  // Logout function
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  };

  // Register function (simplified for demo)
  const register = async (name, email, password) => {
    try {
      // In production, this would call an API
      const user = {
        id: '123456',
        name: name,
        email: email,
        token: 'dummy-auth-token-would-be-jwt-in-production',
      };
      
      // Set current user
      setCurrentUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set axios default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${user.token}`;
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'An unknown error occurred'
      };
    }
  };

  const value = {
    currentUser,
    login,
    logout,
    register,
    isAuthenticated: !!currentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

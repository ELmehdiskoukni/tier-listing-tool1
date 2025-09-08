import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    // Check if user is already logged in on app start
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
        // Set axios default header
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } catch (error) {
        // Clear invalid stored data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      
      // First verify the user credentials
      const user = await apiClient.verifyUser(email, password);
      
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Generate a simple token (in production, this should come from backend)
      const authToken = btoa(`${user.userId}:${Date.now()}`);
      
      // Store in localStorage
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set axios default header
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      
      setUser(user);
      setToken(authToken);
      
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Login failed. Please check your credentials.' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
  };

  const isAuthenticated = () => {
    return !!user && !!token;
  };

  const isAdmin = () => {
    return user?.role === 'Admin';
  };

  const isMember = () => {
    return user?.role === 'Member';
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isMember
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

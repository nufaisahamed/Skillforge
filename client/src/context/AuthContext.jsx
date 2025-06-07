// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import axiosInstance from '../axios/axiosInstance'; // Import the configured axios instance

// Create the AuthContext
const AuthContext = createContext();

// Create a custom hook to use the AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};

// AuthProvider component to wrap your application
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Stores logged-in user data (id, name, email, role)
  const [token, setToken] = useState(localStorage.getItem('token')); // Stores JWT
  const [loading, setLoading] = useState(true); // To indicate if auth state is being initialized

  // Effect to load user and token from localStorage on app start
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          // Use axiosInstance for profile fetch (interceptor handles token)
          const response = await axiosInstance.get('/auth/profile');
          setUser(response.data); // Set user from profile data
        } catch (err) {
          console.error('Failed to load user profile with token:', err);
          localStorage.removeItem('token'); // Clear invalid token
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false); // Auth loading is complete
    };
    loadUser();
  }, [token]); // Re-run if token changes (e.g., after login/logout)


  // Login function
  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      const { token: receivedToken, ...userData } = response.data; // Destructure token and other user data

      localStorage.setItem('token', receivedToken); // Store token in local storage
      setToken(receivedToken); // Update token state
      setUser(userData); // Update user state

      return true; // Indicate success
    } catch (error) {
      console.error('Login failed:', error.response?.data?.message || error.message);
      return false; // Indicate failure
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token'); // Remove token from local storage
    setToken(null);
    setUser(null);
    // Axios interceptor automatically removes Authorization header if token is null
  };

  // Check if the user is an admin
  const isAdmin = user && user.role === 'admin';

  // Context value to be provided to children components
  const authContextValue = {
    user,
    token,
    loading,
    login,
    logout,
    isAdmin,
  };

  // Render children once authentication state is loaded
  return (
    <AuthContext.Provider value={authContextValue}>
      {!loading && children} {/* Render children only after auth state is determined */}
    </AuthContext.Provider>
  );
};

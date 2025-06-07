// src/components/Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx'; // Import useAuth hook - Path from components/ to context/ is correct
import axiosInstance from '../axios/axiosInstance.js'; // Corrected: Added .js extension - Path from components/ to axios/ is correct

const Login = ({ onLoginSuccess, onSwitchToRegister }) => {
  const { login } = useAuth(); // Get the login function from AuthContext
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const success = await login(formData.email, formData.password);

    if (success) {
      onLoginSuccess(); // Callback to parent (App.js) to switch view
    } else {
      setError('Invalid email or password. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 font-inter">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Login</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              required disabled={loading} />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              required disabled={loading} />
          </div>
          <button type="submit"
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 font-semibold text-lg"
            disabled={loading}>
            {loading ? 'Logging In...' : 'Login'}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600">
          Don't have an account?{' '}
          <button type="button" onClick={onSwitchToRegister} className="text-blue-600 hover:underline font-medium focus:outline-none">
            Register here
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;

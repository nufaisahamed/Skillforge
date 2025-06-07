import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import axiosInstance from '../axios/axiosInstance.js';

const Register = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    phone: '',
    bio: '',
    profileImage: '',
  });

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth/register', formData);
      const { email, password } = formData;
      const loginSuccess = await login(email, password);

      if (loginSuccess) {
        setMessage('Registration successful! You are now logged in.');
        onRegisterSuccess();
      } else {
        setError('Registered but login failed. Try manually.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
      console.error('Registration error:', err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 font-inter">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-xl">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Create Account</h2>

        {message && (
          <div className="bg-green-100 text-green-800 border border-green-300 p-3 rounded mb-4 text-center">{message}</div>
        )}
        {error && (
          <div className="bg-red-100 text-red-800 border border-red-300 p-3 rounded mb-4 text-center">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange}
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required disabled={loading} />

          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange}
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required disabled={loading} />

          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange}
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required disabled={loading} />

          {/* <select name="role" value={formData.role} onChange={handleChange}
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select> */}

          <input type="text" name="phone" placeholder="Phone (optional)" value={formData.phone} onChange={handleChange}
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={loading} />

          <input type="text" name="bio" placeholder="Short Bio (optional)" value={formData.bio} onChange={handleChange}
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={loading} />

          <input type="text" name="profileImage" placeholder="Profile Image URL (optional)" value={formData.profileImage} onChange={handleChange}
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={loading} />

          <button type="submit" disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md transition duration-300">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600">
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} className="text-blue-600 hover:underline font-medium">Login</button>
        </p>
      </div>
    </div>
  );
};

export default Register;

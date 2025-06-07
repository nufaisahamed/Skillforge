// src/axios/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://skillforge-ftjf.onrender.com/api', // Your backend API base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;

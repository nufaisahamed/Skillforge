// course-platform-frontend/src/pages/InstructorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../axios/axiosInstance.js'; // Ensure path is correct
import { useAuth } from '../context/AuthContext.jsx'; // Ensure path is correct

const InstructorDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Redirect if not an instructor or admin
    if (!authLoading && !user) { // If auth is ready and no user, redirect to login
      alert('Please log in to view the instructor dashboard.');
      navigate('/login');
      return;
    }
    if (!authLoading && user && user.role !== 'instructor' && user.role !== 'admin') {
      alert('You are not authorized to view the instructor dashboard.');
      navigate('/');
      return;
    }

    const fetchInstructorCourses = async () => {
      // Only proceed if user data is available (meaning, protect and authorize checks pass)
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        // Fetch courses specifically for the logged-in instructor/admin
        const response = await axiosInstance.get('/courses/my-taught-courses');
        setCourses(response.data);
      } catch (err) {
        // --- IMPROVED ERROR LOGGING ---
        console.error('Error fetching instructor courses:', err);
        let errorMessage = 'Failed to load your courses. Please try again.';

        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Backend Response Data:', err.response.data);
          console.error('Backend Response Status:', err.response.status);
          console.error('Backend Response Headers:', err.response.headers);
          errorMessage = err.response.data.message || `Server error (Status: ${err.response.status}).`;
          if (err.response.status === 401 || err.response.status === 403) {
            errorMessage = "Authentication/Authorization failed. Please re-login or check your role.";
          }
        } else if (err.request) {
          // The request was made but no response was received
          console.error('No response received from backend:', err.request);
          errorMessage = "Network error: Could not connect to the backend server. Is it running?";
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Axios request setup error:', err.message);
          errorMessage = `Client error: ${err.message}`;
        }
        setError(errorMessage);
        // --- END IMPROVED ERROR LOGGING ---
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if user is defined (meaning auth is loaded and user is determined)
    if (user) {
      fetchInstructorCourses();
    }
  }, [user, authLoading, navigate]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 font-inter">
        <p className="text-gray-700 text-lg">Loading instructor dashboard...</p>
      </div>
    );
  }

  // Double-check authorization after loading
  if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-100 font-inter p-4">
          <p className="text-red-700 text-lg mb-4 text-center">Access Denied: You are not authorized to view this page.</p>
          <button onClick={() => navigate('/')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
            Go to Home
          </button>
        </div>
      );
  }

  // Handle deleting a course directly from the dashboard
  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course and all its lessons? This action cannot be undone.')) {
      try {
        await axiosInstance.delete(`/courses/${courseId}`);
        alert('Course deleted successfully!');
        // Update the list of courses after deletion
        setCourses(courses.filter(course => course._id !== courseId));
      } catch (err) {
        alert(`Failed to delete course: ${err.response?.data?.message || err.message}`);
        console.error('Error deleting course:', err.response ? err.response.data : err);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto my-8 p-6 bg-white rounded-lg shadow-xl">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
        {user.role === 'admin' ? 'Admin Course Management' : 'Instructor Dashboard'}
      </h1>

      {courses.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xl text-gray-600 mb-4">You are not currently instructing any courses.</p>
          <p className="text-gray-500 text-md">Start by adding a new course!</p>
          <Link to="/" className="mt-4 inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200">
            Browse Courses (or Add New)
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course._id} className="bg-gray-50 rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col">
              <img
                src={course.imageUrl}
                alt={course.title}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/400x200/E0E0E0/666666?text=Image+Not+Available';
                }}
              />
              <div className="p-5 flex flex-col flex-grow">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">{course.title}</h2>
                <p className="text-gray-600 text-sm mb-4 flex-grow">{course.description.substring(0, 100)}...</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-green-700">${course.price}</span>
                  <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {course.category}
                  </span>
                </div>
                <div className="flex flex-col space-y-2 mt-auto">
                  <Link
                    to={`/courses/${course._id}`}
                    className="w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                  >
                    View & Manage Course
                  </Link>
                  <div className="flex space-x-2">
                    <Link
                      to={`/courses/${course._id}`}
                      className="flex-1 text-center bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors duration-200 font-medium"
                    >
                      Edit Details
                    </Link>
                    <button
                      onClick={() => handleDeleteCourse(course._id)}
                      className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium"
                    >
                      Delete Course
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InstructorDashboard;

// course-platform-frontend/src/components/MyCourses.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../axios/axiosInstance.js'; // Ensure path is correct: ../axios/axiosInstance.js
import { useAuth } from '../context/AuthContext.jsx';   // Ensure path is correct: ../context/AuthContext.jsx

const MyCourses = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Redirect if not logged in after auth loading is complete
    if (!authLoading && !user) {
      alert('Please log in to view your enrolled courses.');
      navigate('/login');
      return;
    }

    // Fetch enrolled courses only if user is logged in
    const fetchEnrolledCourses = async () => {
      if (!user) return; // Ensure user object is available

      try {
        setLoadingCourses(true);
        setError(null);
        // This endpoint should return an array of course objects the user is enrolled in
        const response = await axiosInstance.get('/enrollments/my-courses');
        setEnrolledCourses(response.data);
      } catch (err) {
        setError(`Failed to fetch enrolled courses: ${err.response?.data?.message || err.message}`);
        console.error('Error fetching enrolled courses:', err.response ? err.response.data : err);
      } finally {
        setLoadingCourses(false);
      }
    };

    // Only fetch if authentication is ready and user is logged in
    if (user) {
      fetchEnrolledCourses();
    }
  }, [user, authLoading, navigate]); // Depend on user and authLoading to re-run when auth state changes

  if (authLoading || loadingCourses) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 font-inter">
        <p className="text-gray-700 text-lg">Loading your courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-100 font-inter p-4">
        <p className="text-red-700 text-lg mb-4 text-center">Error: {error}</p>
        <button onClick={() => navigate('/')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
          Go to Home
        </button>
      </div>
    );
  }

  if (!user) { // This case should theoretically be handled by the useEffect redirect, but good for explicit safety
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 font-inter p-4">
        <p className="text-gray-700 text-lg mb-4 text-center">You need to be logged in to view your enrolled courses.</p>
        <button onClick={() => navigate('/login')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto my-8 p-4">
      <h2 className="text-4xl font-extrabold text-gray-800 mb-8 text-center">My Enrolled Courses</h2>

      {enrolledCourses.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <p className="text-xl text-gray-600 mb-4">You are not currently enrolled in any courses.</p>
          <Link to="/" className="bg-purple-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-purple-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 font-semibold text-lg">
            Explore Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map((course) => (
            <div key={course._id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col">
              <Link to={`/courses/${course._id}`} className="block">
                <div className="relative w-full h-48 bg-gray-200">
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/400x250/E0E0E0/666666?text=Image+Error';
                    }}
                  />
                  <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                    {course.category}
                  </span>
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 flex-grow line-clamp-3">{course.description}</p>
                  <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
                    <span className="text-lg font-bold text-green-600">${course.price}</span>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">Enrolled</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourses;

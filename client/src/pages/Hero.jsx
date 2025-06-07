// course-platform-frontend/src/App.js
import React, { useState, useEffect } from 'react';
import axiosInstance from '../axios/axiosInstance.js'; // Corrected: Added .js extension
import { useAuth } from '../context/AuthContext.jsx'; // Import useAuth hook

// Import new authentication components
import Register from '../components/Register.jsx';
import Login from '../components/Login.jsx';
import { Link } from 'react-router-dom';

// Main App component for the course learning platform
function App() {
  const { user, loading: authLoading, login, logout, isAdmin } = useAuth(); // Get auth state and functions
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State to manage current view: 'home', 'register', 'login'
  const [currentView, setCurrentView] = useState('home');

  // Function to fetch courses from backend API
  const fetchCourses = async () => {
    try {
      setLoading(true); // Set loading to true before fetching
      setError(null);   // Clear any previous errors

      // Use axiosInstance for GET request to courses
      const response = await axiosInstance.get('/courses');

      setCourses(response.data); // Axios automatically parses JSON into response.data
    } catch (err) {
      setError(`Failed to fetch courses. Please ensure your backend server is running at http://localhost:5000. Error: ${err.message}`);
      console.error('Error fetching courses:', err.response ? err.response.data : err);
    } finally {
      setLoading(false); // Always set loading to false after fetch attempt
    }
  };

  // Effect hook to fetch courses when the component mounts or when view changes to home
  useEffect(() => {
    // Only fetch courses if not currently showing auth forms
    if (currentView === 'home') {
      fetchCourses();
    }
  }, [currentView]); // Re-fetch when view changes to home

  // Show a general loading state if auth is still initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 font-inter">
        <p className="text-gray-700 text-lg">Initializing application...</p>
      </div>
    );
  }

  // Render content based on currentView
  const renderContent = () => {
    switch (currentView) {
      case 'register':
        return (
          <Register
            onRegisterSuccess={() => setCurrentView('home')} // On success, go to home
            onSwitchToLogin={() => setCurrentView('login')} // Button to switch to login
          />
        );
      case 'login':
        return (
          <Login
            onLoginSuccess={() => setCurrentView('home')} // On success, go to home
            onSwitchToRegister={() => setCurrentView('register')} // Button to switch to register
          />
        );
      case 'home':
      default:
        // Main application view
        return (
          <>
            {/* Only show AddCourseForm if user is an admin and logged in */}
            {user && isAdmin && <AddCourseForm onCourseAdded={fetchCourses} />}

            <h2 className="text-4xl font-extrabold text-gray-800 mb-8 text-center">Explore Our Courses</h2>

            {loading ? (
              <p className="text-center text-gray-700 text-lg">Loading courses...</p>
            ) : error ? (
              <p className="text-center text-red-700 text-lg">Error: {error}</p>
            ) : courses.length === 0 ? (
              <p className="text-center text-gray-600 text-xl">No courses found. Add some using the form above (if you are an admin)!</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {courses.map((course) => (
                  <CourseCard key={course._id} course={course} />
                ))}
              </div>
            )}
          </>
        );
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 font-inter flex flex-col">
      

      {/* Main Content Area - Render based on currentView */}
      <main className="container mx-auto p-4 flex-grow">
        {renderContent()}
      </main>

      \
    </div>
  );
}

// CourseCard Component (remains the same as before)
const CourseCard = ({ course }) => {
  return (
    <Link to={`/courses/${course._id}`} className="block">
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col">
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
        <p className="text-sm text-gray-600 mb-3 flex-grow">{course.description}</p>
        <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
          <span className="text-lg font-bold text-green-600">${course.price}</span>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
            Enroll Now
          </button>
        </div>
      </div>
    </div>
    </Link>
  );
};

// AddCourseForm Component (remains the same as before, now conditionally rendered)
const AddCourseForm = ({ onCourseAdded }) => {
  const [formData, setFormData] = useState({
    title: '', description: '', instructor: '', price: '', imageUrl: '', category: '',
  });
  const [submitMessage, setSubmitMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMessage(null);

    try {
      const response = await axiosInstance.post('/courses', {
        ...formData,
        price: parseFloat(formData.price)
      });

      setSubmitMessage({ type: 'success', text: 'Course added successfully!' });
      setFormData({ title: '', description: '', instructor: '', price: '', imageUrl: '', category: '' });
      onCourseAdded(response.data);
    } catch (error) {
      setSubmitMessage({ type: 'error', text: `Error: ${error.response?.data?.message || error.message}` });
      console.error('Error adding course:', error.response ? error.response.data : error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Add a New Course</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
          <input type="text" id="title" name="title" value={formData.title} onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" required />
        </div>
        <div>
          <label htmlFor="instructor" className="block text-sm font-medium text-gray-700">Instructor</label>
          <input type="text" id="instructor" name="instructor" value={formData.instructor} onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" required />
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price ($)</label>
          <input type="number" id="price" name="price" value={formData.price} onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" min="0" step="0.01" required />
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
          <select id="category" name="category" value={formData.category} onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" required>
            <option value="">Select Category</option>
            <option value="Web Development">Web Development</option>
            <option value="Web Design">Web Design</option>
            <option value="Backend Development">Backend Development</option>
            <option value="Programming">Programming</option>
            <option value="Design">Design</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Data Science">Data Science</option>
            <option value="Mobile Development">Mobile Development</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">Image URL (Optional)</label>
          <input type="url" id="imageUrl" name="imageUrl" value={formData.imageUrl} onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows="3"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" required></textarea>
        </div>
        <div className="md:col-span-2 flex justify-center mt-4">
          <button type="submit"
            className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 font-semibold text-lg">
            Add Course
          </button>
        </div>
        {submitMessage && (
          <p className={`md:col-span-2 text-center mt-4 ${submitMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {submitMessage.text}
          </p>
        )}
      </form>
    </div>
  );
};

export default App;

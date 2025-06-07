// src/pages/StorybooksPage.jsx
import React, { useState, useEffect } from 'react';
import axiosInstance from '../axios/axiosInstance.js';
import { useAuth } from '../context/AuthContext.jsx';

const StorybooksPage = () => {
  const [storybooks, setStorybooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStorybook, setNewStorybook] = useState({
    title: '',
    description: '',
    pdfUrl: '',   // State to hold the PDF URL (string)
    imageUrl: '', // State to hold the image URL (string)
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formMessage, setFormMessage] = useState(null);

  const { user, loading: authLoading } = useAuth();
  const isAdmin = user && user.role === 'admin';

  // Function to fetch all storybooks
  const fetchStorybooks = async () => {
    setLoading(true);
    setError(null);
    try {
      // The backend now returns objects directly with pdfUrl and imageUrl fields
      const response = await axiosInstance.get('/storybooks');
      setStorybooks(response.data);
    } catch (err) {
      console.error('Error fetching storybooks:', err.response?.data?.message || err.message);
      // If the user is not authenticated (e.g., 401 Unauthorized), set a specific error
      if (err.response && err.response.status === 401) {
        setError('You must be logged in to view storybooks.');
      } else {
        setError('Failed to load storybooks. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch storybooks on component mount
    // Only fetch if authLoading is complete to prevent race conditions with token
    if (!authLoading) {
      fetchStorybooks();
    }
  }, [authLoading]); // Depend on authLoading to re-run after authentication state is known

  const handleAddFormChange = (e) => {
    const { name, value } = e.target;
    setNewStorybook((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddStorybookSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormMessage(null);

    // Basic validation
    if (!newStorybook.title || !newStorybook.pdfUrl) {
      setFormMessage({ type: 'error', text: 'Title and PDF URL are required.' });
      setFormLoading(false);
      return;
    }

    // Basic URL format validation for PDF and Image (if provided)
    try {
      new URL(newStorybook.pdfUrl); // Validate PDF URL
      if (newStorybook.imageUrl) {
        new URL(newStorybook.imageUrl); // Validate image URL if provided
      }
    } catch (_) {
      setFormMessage({ type: 'error', text: 'Please enter valid URLs for PDF and Image (if provided).' });
      setFormLoading(false);
      return;
    }

    try {
      // Send data as JSON object, not FormData, as we are using URLs
      const response = await axiosInstance.post('/storybooks', newStorybook);
      setFormMessage({ type: 'success', text: response.data.message || 'Storybook added successfully!' });
      // Clear form after submission
      setNewStorybook({ title: '', description: '', pdfUrl: '', imageUrl: '' });
      setShowAddForm(false); // Hide the form
      fetchStorybooks(); // Refresh the list of storybooks
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add storybook.';
      setFormMessage({ type: 'error', text: msg });
      console.error('Error adding storybook:', err.response ? err.response.data : err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteStorybook = async (storybookId) => {
    // Using window.confirm for simplicity, consider a custom modal for better UX
    if (window.confirm('Are you sure you want to delete this storybook? This action cannot be undone.')) {
      try {
        await axiosInstance.delete(`/storybooks/${storybookId}`);
        alert('Storybook deleted successfully!'); // Consider a custom modal
        fetchStorybooks(); // Refresh the list
      } catch (err) {
        alert(`Failed to delete storybook: ${err.response?.data?.message || err.message}`); // Consider a custom modal
        console.error('Error deleting storybook:', err.response ? err.response.data : err);
      }
    }
  };

  // Display loading state
  if (loading || authLoading) {
    return (
      <div className="text-center text-lg text-gray-700 mt-8">Loading storybooks...</div>
    );
  }

  // Display error state (e.g., "You must be logged in")
  if (error) {
    return (
      <div className="text-center text-red-600 text-xl mt-8 p-4 bg-red-100 rounded-lg shadow-md">
        <p className="font-semibold mb-2">Error loading Storybooks:</p>
        <p>{error}</p>
        {!user && (
            <p className="mt-4 text-gray-700">Please <Link to="/login" className="text-blue-600 hover:underline font-bold">log in</Link> to access this feature.</p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto my-8 p-6 bg-white rounded-lg shadow-xl">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Storybooks Library</h1>

      {/* Admin: Add New Storybook Button */}
      {isAdmin && (
        <div className="mb-6 text-center">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-purple-700 transition-colors duration-200 font-semibold"
          >
            {showAddForm ? 'Cancel Add Storybook' : 'Add New Storybook'}
          </button>
        </div>
      )}

      {/* Admin: Add New Storybook Form */}
      {isAdmin && showAddForm && (
        <div className="bg-gray-50 p-6 rounded-lg shadow-inner mb-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Add New Storybook</h3>
          {formMessage && (
            <div className={`px-4 py-3 rounded-md mb-4 text-center ${formMessage.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}>
              {formMessage.text}
            </div>
          )}
          <form onSubmit={handleAddStorybookSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="new-storybook-title" className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                id="new-storybook-title"
                name="title"
                value={newStorybook.title}
                onChange={handleAddFormChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={formLoading}
              />
            </div>
            <div>
              <label htmlFor="new-storybook-pdfurl" className="block text-sm font-medium text-gray-700">PDF URL</label>
              <input
                type="url"
                id="new-storybook-pdfurl"
                name="pdfUrl"
                value={newStorybook.pdfUrl}
                onChange={handleAddFormChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., https://example.com/mystory.pdf"
                required
                disabled={formLoading}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="new-storybook-imageurl" className="block text-sm font-medium text-gray-700">Cover Image URL (Optional)</label>
              <input
                type="url"
                id="new-storybook-imageurl"
                name="imageUrl"
                value={newStorybook.imageUrl}
                onChange={handleAddFormChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., https://example.com/cover.jpg"
                disabled={formLoading}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="new-storybook-description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
              <textarea
                id="new-storybook-description"
                name="description"
                value={newStorybook.description}
                onChange={handleAddFormChange}
                rows="3"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={formLoading}
              ></textarea>
            </div>
            <div className="md:col-span-2 text-center mt-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200 font-semibold"
                disabled={formLoading}
              >
                {formLoading ? 'Adding...' : 'Add Storybook'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Storybooks List */}
      {storybooks.length === 0 ? (
        <p className="text-center text-gray-600 text-lg">No storybooks available yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {storybooks.map((storybook) => (
            <div key={storybook._id} className="bg-gray-50 p-5 rounded-lg shadow-sm border border-gray-200 flex flex-col">
              {storybook.imageUrl && ( // Display image if URL is available
                <img
                  src={storybook.imageUrl} // Use the provided image URL directly
                  alt={storybook.title}
                  className="w-full h-48 object-cover rounded-md mb-4"
                  onError={(e) => { // Fallback for broken images
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/400x200/E0E0E0/666666?text=No+Image';
                  }}
                />
              )}
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">{storybook.title}</h2>
              {storybook.description && (
                <p className="text-gray-600 text-sm mb-4 flex-grow">{storybook.description}</p>
              )}
              <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-200">
                <a
                  href={storybook.pdfUrl} // Use the provided PDF URL directly
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download PDF
                </a>
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteStorybook(storybook._id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StorybooksPage;

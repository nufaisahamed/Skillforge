// course-platform-frontend/src/components/EditCourseForm.jsx
import React, { useState, useEffect } from 'react';
import axiosInstance from '../axios/axiosInstance.js'; // Ensure path is correct: ../axios/axiosInstance.js

const EditCourseForm = ({ course, onCourseUpdated, onCancel }) => {
  // Initialize form data with the existing course details
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructor: '',
    price: '',
    imageUrl: '',
    category: '',
  });
  const [submitMessage, setSubmitMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Populate form fields when the 'course' prop changes
  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
        instructor: course.instructor || '',
        price: course.price !== undefined ? course.price.toString() : '', // Convert number to string for input
        imageUrl: course.imageUrl || '',
        category: course.category || '',
      });
    }
  }, [course]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMessage(null);
    setLoading(true);

    try {
      // Send PUT request to update the course
      const response = await axiosInstance.put(`/courses/${course._id}`, {
        ...formData,
        price: parseFloat(formData.price), // Convert price back to number
      });

      setSubmitMessage({ type: 'success', text: 'Course updated successfully!' });
      // Call the callback to refresh parent component's data
      onCourseUpdated(response.data);
    } catch (error) {
      setSubmitMessage({ type: 'error', text: `Error updating course: ${error.response?.data?.message || error.message}` });
      console.error('Error updating course:', error.response ? error.response.data : error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-8 border border-blue-200">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Edit Course: {course?.title}</h3>

      {submitMessage && (
        <div className={`px-4 py-3 rounded-md mb-4 text-center ${submitMessage.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}>
          {submitMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700">Title</label>
          <input type="text" id="edit-title" name="title" value={formData.title} onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" required disabled={loading} />
        </div>
        <div>
          <label htmlFor="edit-instructor" className="block text-sm font-medium text-gray-700">Instructor</label>
          <input type="text" id="edit-instructor" name="instructor" value={formData.instructor} onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" required disabled={loading} />
        </div>
        <div>
          <label htmlFor="edit-price" className="block text-sm font-medium text-gray-700">Price ($)</label>
          <input type="number" id="edit-price" name="price" value={formData.price} onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" min="0" step="0.01" required disabled={loading} />
        </div>
        <div>
          <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700">Category</label>
          <select id="edit-category" name="category" value={formData.category} onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" required disabled={loading}>
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
          <label htmlFor="edit-imageUrl" className="block text-sm font-medium text-gray-700">Image URL (Optional)</label>
          <input type="url" id="edit-imageUrl" name="imageUrl" value={formData.imageUrl} onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" disabled={loading} />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea id="edit-description" name="description" value={formData.description} onChange={handleChange} rows="3"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500" required disabled={loading}></textarea>
        </div>
        <div className="md:col-span-2 flex justify-center space-x-4 mt-4">
          <button type="submit"
            className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 font-semibold text-lg"
            disabled={loading}>
            {loading ? 'Updating...' : 'Update Course'}
          </button>
          <button type="button" onClick={onCancel}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 font-semibold text-lg"
            disabled={loading}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCourseForm;

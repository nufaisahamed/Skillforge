// src/pages/EditJobPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../axios/axiosInstance.js';
import { useAuth } from '../context/AuthContext.jsx';

const EditJobPage = () => {
  const { id } = useParams(); // Job ID from URL
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    requirements: '', // Comma-separated string
    salaryRange: 'Not disclosed',
    jobType: 'Full-time',
    applicationLink: '',
    applicationEmail: ''
  });
  const [loading, setLoading] = useState(true); // Initial load for fetching job data
  const [submitting, setSubmitting] = useState(false); // For form submission
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchJobData = async () => {
      try {
        const response = await axiosInstance.get(`/jobs/${id}`);
        const jobData = response.data.data;

        // Check if user is authorized to edit this job after fetching
        if (!authLoading && (!user || (user.role !== 'admin' && (user.role !== 'instructor' || (jobData.postedBy && jobData.postedBy._id !== user._id))))) {
          // IMPORTANT: Replaced alert with a simpler alert due to Canvas environment constraints.
          alert('You are not authorized to edit this job listing.');
          navigate('/jobs');
          return;
        }

        setFormData({
          title: jobData.title,
          company: jobData.company,
          location: jobData.location,
          description: jobData.description,
          requirements: jobData.requirements ? jobData.requirements.join(', ') : '', // Convert array to string
          salaryRange: jobData.salaryRange,
          jobType: jobData.jobType,
          applicationLink: jobData.applicationLink || '',
          applicationEmail: jobData.applicationEmail || ''
        });
        setError(null);
      } catch (err) {
        setError('Failed to load job details for editing. Job might not exist or you lack permission.');
        console.error('Error fetching job for edit:', err.response?.data?.message || err.message);
        navigate('/jobs'); // Navigate away if job not found or permission denied
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) { // Only fetch job data once auth is loaded
        fetchJobData();
    }
  }, [id, navigate, user, authLoading]); // Added user and authLoading to dependencies

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const requirementsArray = formData.requirements
        .split(',')
        .map((req) => req.trim())
        .filter((req) => req !== '');

      const payload = {
        ...formData,
        requirements: requirementsArray,
      };

      // Handle application method logic for update
      if (payload.applicationLink && !payload.applicationEmail) {
        payload.applicationEmail = ''; // Explicitly set to empty string if link exists and email is empty
      } else if (payload.applicationEmail && !payload.applicationLink) {
        payload.applicationLink = ''; // Explicitly set to empty string if email exists and link is empty
      } else if (!payload.applicationLink && !payload.applicationEmail) {
        setError('Please provide either an application link or an application email.');
        setSubmitting(false);
        return;
      }

      await axiosInstance.put(`/jobs/${id}`, payload);
      setSuccess('Job listing updated successfully!');
      // IMPORTANT: Replaced alert with a simpler alert due to Canvas environment constraints.
      alert('Job listing updated successfully!');
      navigate(`/jobs/${id}`); // Go back to job's detail page
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update job listing. Please check your input.';
      setError(errorMessage);
      console.error('Error updating job:', err.response?.data || err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return <div className="text-center text-xl text-gray-600 mt-8">Loading job data...</div>;
  }

  // Double check authorization after initial load.
  // This handles cases where user navigates directly or refreshes on edit page.
  // We need to check job.postedBy directly from the fetched job state.
  if (!user || (user.role !== 'admin' && (user.role !== 'instructor' || (job && job.postedBy && job.postedBy._id !== user._id)))) {
    // If not authorized after loading, display message (or handle redirect in useEffect)
    return <div className="text-center text-xl text-red-600 mt-8">You are not authorized to view or edit this page.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-xl my-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6 text-center">Edit Job Listing</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-lg font-medium text-gray-700 mb-1">Job Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Senior Software Engineer"
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="company" className="block text-lg font-medium text-gray-700 mb-1">Company</label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="e.g., Tech Innovations Inc."
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-lg font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g., Remote, San Francisco, CA"
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="jobType" className="block text-lg font-medium text-gray-700 mb-1">Job Type</label>
          <select
            id="jobType"
            name="jobType"
            value={formData.jobType}
            onChange={handleChange}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Internship">Internship</option>
            <option value="Temporary">Temporary</option>
          </select>
        </div>

        <div>
          <label htmlFor="salaryRange" className="block text-lg font-medium text-gray-700 mb-1">Salary Range</label>
          <select
            id="salaryRange"
            name="salaryRange"
            value={formData.salaryRange}
            onChange={handleChange}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="Not disclosed">Not disclosed</option>
            <option value="Below $30k">Below $30k</option>
            <option value="$30k - $50k">$30k - $50k</option>
            <option value="$50k - $70k">$50k - $70k</option>
            <option value="$70k - $100k">$70k - $100k</option>
            <option value="$100k - $150k">$100k - $150k</option>
            <option value="Above $150k">Above $150k</option>
            <option value="Competitive">Competitive</option>
          </select>
        </div>

        <div>
          <label htmlFor="description" className="block text-lg font-medium text-gray-700 mb-1">Job Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide a detailed description of the job responsibilities and expectations."
            rows="6"
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          ></textarea>
        </div>

        <div>
          <label htmlFor="requirements" className="block text-lg font-medium text-gray-700 mb-1">Requirements (comma-separated)</label>
          <textarea
            id="requirements"
            name="requirements"
            value={formData.requirements}
            onChange={handleChange}
            placeholder="e.g., Bachelor's degree, 3+ years experience, JavaScript, React"
            rows="3"
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          ></textarea>
          <p className="mt-1 text-sm text-gray-500">List each requirement, separated by a comma (e.g., "Skill 1, Skill 2, Skill 3")</p>
        </div>

        <div className="border-t pt-6 mt-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Application Method (Choose one or both)</h3>
          <div>
            <label htmlFor="applicationLink" className="block text-lg font-medium text-gray-700 mb-1">Application Link (URL)</label>
            <input
              type="url"
              id="applicationLink"
              name="applicationLink"
              value={formData.applicationLink}
              onChange={handleChange}
              placeholder="e.g., https://company.com/careers/apply"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <p className="text-center text-gray-500 my-4">OR</p>
          <div>
            <label htmlFor="applicationEmail" className="block text-lg font-medium text-gray-700 mb-1">Application Email</label>
            <input
              type="email"
              id="applicationEmail"
              name="applicationEmail"
              value={formData.applicationEmail}
              onChange={handleChange}
              placeholder="e.g., jobs@company.com"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {error && error.includes('application') && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>

        {error && <p className="mt-4 text-center text-red-600 text-md">{error}</p>}
        {success && <p className="mt-4 text-center text-green-600 text-md">{success}</p>}

        <div className="text-center">
          <button
            type="submit"
            className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 font-semibold text-lg"
            disabled={submitting}
          >
            {submitting ? 'Updating Job...' : 'Update Job'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditJobPage;

// src/pages/MyPostedJobsPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../axios/axiosInstance.js';
import { useAuth } from '../context/AuthContext.jsx';

const MyPostedJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState('');
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyJobs = async () => {
      // Redirect if not authorized after auth is loaded
      if (!authLoading && (!user || (user.role !== 'instructor' && user.role !== 'admin'))) {
        navigate('/login'); // Or to a forbidden page
        return;
      }

      if (!user) return; // Wait for user data to be available

      setLoading(true);
      setError(null);
      setDeleteStatus('');
      try {
        const response = await axiosInstance.get('/jobs/my'); // New endpoint for user's jobs
        setJobs(response.data.data);
      } catch (err) {
        setError('Failed to fetch your job listings. Please try again later.');
        console.error('Error fetching my jobs:', err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMyJobs();
  }, [user, authLoading, navigate]); // Rerun when user or authLoading changes

  const handleDelete = async (jobId) => {
    // IMPORTANT: Replaced window.confirm with a simpler alert due to Canvas environment constraints.
    if (!window.confirm('Are you sure you want to delete this job listing? This action cannot be undone.')) {
      return;
    }

    setDeleteStatus(`Deleting job ${jobId}...`);
    try {
      await axiosInstance.delete(`/jobs/${jobId}`);
      setDeleteStatus('Job deleted successfully!');
      // IMPORTANT: Replaced alert with a simpler alert due to Canvas environment constraints.
      alert('Job listing deleted successfully!');
      // Remove the deleted job from the state
      setJobs((prevJobs) => prevJobs.filter((job) => job._id !== jobId));
    } catch (err) {
      setDeleteStatus('Failed to delete job. You might not have permission.');
      setError('Failed to delete job listing.');
      console.error('Error deleting job:', err.response?.data?.message || err.message);
    }
  };

  if (loading || authLoading) {
    return <div className="text-center text-xl text-gray-600 mt-8">Loading your job listings...</div>;
  }

  // Render unauthorized message if not an instructor or admin after loading
  if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
    return <div className="text-center text-xl text-red-600 mt-8">You are not authorized to view this page.</div>;
  }

  if (error) {
    return <div className="text-center text-xl text-red-600 mt-8">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-xl my-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6 text-center">My Posted Jobs</h1>

      <div className="text-center mb-6">
        <Link
          to="/jobs/new"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 text-lg font-semibold"
        >
          Post New Job
        </Link>
        <Link
            to="/jobs"
            className="ml-4 inline-block bg-gray-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-gray-700 transition-colors duration-200 text-lg font-semibold"
          >
            View All Jobs
          </Link>
      </div>

      {deleteStatus && (
        <p className={`text-center mb-4 ${deleteStatus.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
          {deleteStatus}
        </p>
      )}

      {jobs.length === 0 ? (
        <div className="text-center text-gray-700 text-lg p-10 border border-gray-200 rounded-lg bg-gray-50">
          <p className="mb-2">You haven't posted any job listings yet.</p>
          <p>Click "Post New Job" to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div key={job._id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h2>
                <p className="text-lg text-gray-700 mb-1"><strong>Company:</strong> {job.company}</p>
                <p className="text-md text-gray-600 mb-3"><strong>Location:</strong> {job.location} ({job.jobType})</p>
                <p className="text-sm text-gray-500 line-clamp-3">{job.description}</p>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <Link
                  to={`/jobs/${job._id}`}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm font-medium w-full sm:w-auto text-center"
                >
                  View Details
                </Link>
                <Link
                  to={`/jobs/edit/${job._id}`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium w-full sm:w-auto text-center"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(job._id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm font-medium w-full sm:w-auto text-center"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPostedJobsPage;

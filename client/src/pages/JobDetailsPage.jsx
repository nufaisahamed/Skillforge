// src/pages/JobDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../axios/axiosInstance.js';
import { useAuth } from '../context/AuthContext.jsx';

const JobDetailsPage = () => {
  const { id } = useParams(); // Job ID from URL
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState(''); // For delete messages

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await axiosInstance.get(`/jobs/${id}`);
        setJob(response.data.data);
      } catch (err) {
        setError('Failed to fetch job details. It might not exist or an error occurred.');
        console.error('Error fetching job:', err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  const handleDelete = async () => {
    // IMPORTANT: Replaced window.confirm with a simpler alert due to Canvas environment constraints.
    // In a real application, you would use a custom modal for confirmation.
    if (!window.confirm('Are you sure you want to delete this job listing? This action cannot be undone.')) {
      return;
    }

    setDeleteStatus('Deleting...');
    try {
      await axiosInstance.delete(`/jobs/${id}`);
      setDeleteStatus('Job deleted successfully!');
      // IMPORTANT: Replaced alert with a simpler alert due to Canvas environment constraints.
      // In a real application, you would use a custom modal for feedback.
      alert('Job listing deleted successfully!');
      navigate('/jobs'); // Redirect to jobs list after deletion
    } catch (err) {
      setDeleteStatus('Failed to delete job. You might not have permission.');
      setError('Failed to delete job listing.');
      console.error('Error deleting job:', err.response?.data?.message || err.message);
    }
  };

  if (loading || authLoading) {
    return <div className="text-center text-xl text-gray-600 mt-8">Loading job details...</div>;
  }

  if (error) {
    return <div className="text-center text-xl text-red-600 mt-8">{error}</div>;
  }

  if (!job) {
    return <div className="text-center text-xl text-gray-600 mt-8">Job listing not found.</div>;
  }

  const isJobOwner = user && job.postedBy && job.postedBy._id === user._id;
  const isAdmin = user && user.role === 'admin';
  const canManageJob = isJobOwner || isAdmin;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-xl my-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{job.title}</h1>
      <p className="text-xl text-gray-700 mb-2"><strong>Company:</strong> {job.company}</p>
      <p className="text-lg text-gray-600 mb-4"><strong>Location:</strong> {job.location} &bull; {job.jobType}</p>
      <p className="text-md text-gray-600 mb-6"><strong>Salary Range:</strong> {job.salaryRange}</p>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Job Description</h2>
        <p className="text-gray-700 leading-relaxed">{job.description}</p>
      </div>

      {job.requirements && job.requirements.length > 0 && (
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Requirements</h2>
          <ul className="list-disc list-inside text-gray-700">
            {job.requirements.map((req, index) => (
              <li key={index}>{req}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">How to Apply</h2>
        {job.applicationLink && (
          <a
            href={job.applicationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200 text-lg font-semibold mr-4"
          >
            Apply Online
          </a>
        )}
        {job.applicationEmail && (
          <a
            href={`mailto:${job.applicationEmail}`}
            className="inline-block bg-teal-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-teal-700 transition-colors duration-200 text-lg font-semibold"
          >
            Email Application
          </a>
        )}
        {!job.applicationLink && !job.applicationEmail && (
          <p className="text-gray-600">No application method provided.</p>
        )}
      </div>

      <p className="text-sm text-gray-500 mt-4">
        Posted by: {job.postedBy ? `${job.postedBy.firstName} ${job.postedBy.lastName}` : 'N/A'} on {new Date(job.postedAt).toLocaleDateString()}
      </p>

      <div className="mt-8 flex justify-between items-center">
        <Link
          to="/jobs"
          className="bg-gray-300 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors duration-200 font-semibold"
        >
          Back to Jobs List
        </Link>

        {canManageJob && (
          <div className="flex space-x-4">
            <Link
              to={`/jobs/edit/${job._id}`}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 font-semibold"
            >
              Edit Job
            </Link>
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-red-700 transition-colors duration-200 font-semibold"
            >
              Delete Job
            </button>
          </div>
        )}
      </div>
      {deleteStatus && <p className="text-center text-sm mt-4 text-red-600">{deleteStatus}</p>}
    </div>
  );
};

export default JobDetailsPage;

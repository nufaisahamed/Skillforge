// src/pages/JobsListPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../axios/axiosInstance.js';
import { useAuth } from '../context/AuthContext.jsx';

const JobsListPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // State for search and filters
  const [keyword, setKeyword] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [salaryRangeFilter, setSalaryRangeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 9; // Number of jobs per page

  // Options for filter dropdowns
  const jobTypeOptions = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'];
  const salaryRangeOptions = ['Not disclosed', 'Below $30k', '$30k - $50k', '$50k - $70k', '$70k - $100k', '$100k - $150k', 'Above $150k', 'Competitive'];

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      try {
        // Construct query parameters
        const queryParams = new URLSearchParams();
        if (keyword) queryParams.append('keyword', keyword);
        if (locationFilter) queryParams.append('location', locationFilter);
        if (jobTypeFilter) queryParams.append('jobType', jobTypeFilter);
        if (salaryRangeFilter) queryParams.append('salaryRange', salaryRangeFilter);
        queryParams.append('page', currentPage);
        queryParams.append('limit', jobsPerPage);

        const response = await axiosInstance.get(`/jobs?${queryParams.toString()}`);
        setJobs(response.data.data);
        setTotalJobs(response.data.total);
        setTotalPages(Math.ceil(response.data.total / jobsPerPage));
      } catch (err) {
        setError('Failed to fetch job listings. Please try again later.');
        console.error('Error fetching jobs:', err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [keyword, locationFilter, jobTypeFilter, salaryRangeFilter, currentPage, jobsPerPage]);


  // Handle pagination clicks
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle filter application
  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page when applying new filters
    // Filters are already tied to state, useEffect will re-run fetchJobs
  };

  // Handle clearing all filters
  const handleClearFilters = () => {
    setKeyword('');
    setLocationFilter('');
    setJobTypeFilter('');
    setSalaryRangeFilter('');
    setCurrentPage(1); // Reset to first page
  };


  if (loading || authLoading) {
    return <div className="text-center text-xl text-gray-600 mt-8">Loading job listings...</div>;
  }

  if (error) {
    return <div className="text-center text-xl text-red-600 mt-8">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-xl my-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-6 text-center">Job Board</h1>

      {user && (user.role === 'instructor' || user.role === 'admin') && (
        <div className="text-center mb-6">
          <Link
            to="/jobs/new"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 text-lg font-semibold"
          >
            Post New Job
          </Link>
          <Link
            to="/jobs/my"
            className="ml-4 inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-200 text-lg font-semibold"
          >
            My Posted Jobs
          </Link>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow-inner">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Find Your Next Opportunity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Keyword Search */}
          <div>
            <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-1">Keyword</label>
            <input
              type="text"
              id="keyword"
              placeholder="e.g., Engineer, Design, Remote"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Location Filter (can be text input or a select of common locations) */}
          <div>
            <label htmlFor="locationFilter" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              id="locationFilter"
              placeholder="e.g., New York, Remote"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Job Type Filter */}
          <div>
            <label htmlFor="jobTypeFilter" className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
            <select
              id="jobTypeFilter"
              value={jobTypeFilter}
              onChange={(e) => setJobTypeFilter(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              {jobTypeOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* Salary Range Filter */}
          <div>
            <label htmlFor="salaryRangeFilter" className="block text-sm font-medium text-gray-700 mb-1">Salary Range</label>
            <select
              id="salaryRangeFilter"
              value={salaryRangeFilter}
              onChange={(e) => setSalaryRangeFilter(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Any Salary</option>
              {salaryRangeOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={handleApplyFilters}
            className="bg-green-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200 text-md font-semibold"
          >
            Apply Filters
          </button>
          <button
            onClick={handleClearFilters}
            className="bg-gray-300 text-gray-800 px-6 py-2 rounded-lg shadow-md hover:bg-gray-400 transition-colors duration-200 text-md font-semibold"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {totalJobs === 0 && (keyword || locationFilter || jobTypeFilter || salaryRangeFilter) ? (
        <div className="text-center text-gray-700 text-lg p-10 border border-gray-200 rounded-lg bg-gray-50">
          <p className="mb-2">No job listings found matching your criteria.</p>
          <button onClick={handleClearFilters} className="text-blue-600 hover:underline">Clear all filters</button>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center text-gray-700 text-lg p-10 border border-gray-200 rounded-lg bg-gray-50">
          <p className="mb-2">No job listings found at the moment.</p>
          {user && (user.role === 'instructor' || user.role === 'admin') && (
            <p>Be the first to post a job!</p>
          )}
        </div>
      ) : (
        <>
          <p className="text-lg text-gray-700 mb-4 text-center">Showing {jobs.length} of {totalJobs} jobs.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div key={job._id} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h2>
                  <p className="text-lg text-gray-700 mb-1"><strong>Company:</strong> {job.company}</p>
                  <p className="text-md text-gray-600 mb-3"><strong>Location:</strong> {job.location} ({job.jobType})</p>
                  <p className="text-sm text-gray-500 line-clamp-3">{job.description}</p>
                </div>
                <div className="mt-4 flex flex-col sm:flex-row justify-between items-center">
                  <Link
                    to={`/jobs/${job._id}`}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200 text-sm font-medium w-full sm:w-auto text-center mb-2 sm:mb-0"
                  >
                    View Details
                  </Link>
                  {(user && (user.role === 'admin' || (user.role === 'instructor' && job.postedBy && job.postedBy._id === user._id))) && (
                    <Link
                      to={`/jobs/edit/${job._id}`}
                      className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors duration-200 text-sm font-medium w-full sm:w-auto text-center"
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors duration-200"
              >
                Previous
              </button>
              <span className="text-lg text-gray-700">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors duration-200"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JobsListPage;

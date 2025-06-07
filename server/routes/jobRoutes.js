// course-platform-backend/routes/jobRoutes.js
const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Get all job listings with search, filter, and pagination
// @route   GET /api/jobs
// @access  Public
router.get('/', async (req, res) => {
  console.log('--- Hitting /api/jobs (ALL JOBS) route ---');
  try {
    let query;

    const reqQuery = { ...req.query };
    const removeFields = ['select', 'sort', 'page', 'limit', 'keyword'];
    removeFields.forEach(param => delete reqQuery[param]);

    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    query = Job.find(JSON.parse(queryStr)).populate('postedBy', 'firstName lastName');

    if (req.query.keyword) {
      const keyword = req.query.keyword;
      query = query.find({
        $or: [
          { title: { $regex: keyword, $options: 'i' } },
          { description: { $regex: keyword, $options: 'i' } },
          { company: { $regex: keyword, $options: 'i' } },
          { location: { $regex: keyword, $options: 'i' } },
        ]
      });
    }

    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-postedAt');
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Job.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    const jobs = await query;

    const pagination = {};
    if (endIndex < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json({
      success: true,
      count: jobs.length,
      total: total,
      pagination,
      data: jobs
    });
  } catch (error) {
    console.error('Error in /api/jobs route:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching jobs' });
  }
});

// @desc    Get jobs posted by the authenticated user
// @route   GET /api/jobs/my
// @access  Private (Instructor or Admin only)
// IMPORTANT: This more specific route MUST come BEFORE the general /:id route
router.get('/my', protect, authorize(['instructor', 'admin']), async (req, res) => {
  console.log('--- Hitting /api/jobs/my route (CORRECTLY MATCHED) ---'); // Updated log message
  console.log('Authenticated User (req.user):', req.user ? { id: req.user.id, role: req.user.role } : 'NOT AVAILABLE');

  if (!req.user) {
    console.log('ERROR: req.user is not defined after protect middleware.');
    return res.status(401).json({ success: false, message: 'Authentication required to view your jobs.' });
  }
  if (!['instructor', 'admin'].includes(req.user.role)) {
    console.log(`ERROR: User role ${req.user.role} is not authorized for /jobs/my.`);
    return res.status(403).json({ success: false, message: 'You are not authorized to view this page.' });
  }

  try {
    console.log('Attempting to find jobs for postedBy ID:', req.user.id);
    const jobs = await Job.find({ postedBy: req.user.id }).populate('postedBy', 'firstName lastName');
    console.log(`Query successful. Found ${jobs.length} jobs for user ID ${req.user.id}.`);

    res.status(200).json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    console.error('Error in /api/jobs/my route (database query):', error); // Specific error message
    res.status(500).json({ success: false, message: 'Server Error fetching your jobs' });
  }
});

// @desc    Get single job listing
// @route   GET /api/jobs/:id
// @access  Public
// This general route should come AFTER more specific routes like /my
router.get('/:id', async (req, res) => {
  console.log(`--- Hitting /api/jobs/${req.params.id} route ---`);
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'firstName lastName');
    if (!job) {
      console.log(`Job with ID ${req.params.id} not found.`);
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    console.log('Job found:', job.title);
    res.status(200).json({ success: true, data: job });
  } catch (error) {
    console.error(`Error in /api/jobs/${req.params.id} route:`, error);
    res.status(500).json({ success: false, message: 'Server Error fetching job' });
  }
});


// @desc    Create new job listing
// @route   POST /api/jobs
// @access  Private (Instructor or Admin only)
router.post('/', protect, authorize(['instructor', 'admin']), async (req, res) => {
  console.log('--- Hitting /api/jobs (POST) route ---');
  try {
    req.body.postedBy = req.user.id;
    console.log('Creating job with data:', req.body);
    const job = await Job.create(req.body);
    console.log('Job created:', job._id);
    res.status(201).json({ success: true, data: job });
  } catch (error) {
    console.error('Error in /api/jobs (POST) route:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server Error creating job' });
  }
});

// @desc    Update job listing
// @route   PUT /api/jobs/:id
// @access  Private (Owner or Admin only)
router.put('/:id', protect, authorize(['instructor', 'admin']), async (req, res) => {
  console.log(`--- Hitting /api/jobs/${req.params.id} (PUT) route ---`);
  try {
    let job = await Job.findById(req.params.id);
    if (!job) {
      console.log(`Job with ID ${req.params.id} not found for update.`);
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      console.log(`User ${req.user.id} not authorized to update job ${req.params.id}. Posted by: ${job.postedBy}`);
      return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to update this job` });
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    console.log('Job updated:', job._id);
    res.status(200).json({ success: true, data: job });
  } catch (error) {
    console.error(`Error in /api/jobs/${req.params.id} (PUT) route:`, error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server Error updating job' });
  }
});

// @desc    Delete job listing
// @route   DELETE /api/jobs/:id
// @access  Private (Owner or Admin only)
router.delete('/:id', protect, authorize(['instructor', 'admin']), async (req, res) => {
  console.log(`--- Hitting /api/jobs/${req.params.id} (DELETE) route ---`);
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      console.log(`Job with ID ${req.params.id} not found for deletion.`);
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      console.log(`User ${req.user.id} not authorized to delete job ${req.params.id}. Posted by: ${job.postedBy}`);
      return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to delete this job` });
    }

    await job.deleteOne();
    console.log('Job deleted:', req.params.id);
    res.status(200).json({ success: true, message: 'Job removed successfully' });
  } catch (error) {
    console.error(`Error in /api/jobs/${req.params.id} (DELETE) route:`, error);
    res.status(500).json({ success: false, message: 'Server Error deleting job' });
  }
});

module.exports = router;

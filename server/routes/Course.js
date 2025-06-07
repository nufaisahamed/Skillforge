// course-platform-backend/routes/courses.js
const express = require('express');
const router = express.Router();
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController');
const { protect, authorize } = require('../Middleware/authMiddleware'); // NEW: Import middleware

// Routes that handle all courses
// GET: Publicly accessible
// POST: Protected, only accessible by 'admin'
router.route('/')
  .get(getCourses)
  .post(protect, authorize('admin'), createCourse); // Added protect and authorize middleware

// Routes that handle a single course by ID
// GET: Publicly accessible
// PUT/DELETE: Protected, only accessible by 'admin'
router.route('/:id')
  .get(getCourseById)
  .put(protect, authorize('admin'), updateCourse)    // Added protect and authorize middleware
  .delete(protect, authorize('admin'), deleteCourse); // Added protect and authorize middleware

  

module.exports = router;
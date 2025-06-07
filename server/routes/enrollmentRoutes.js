// course-platform-backend/routes/enrollmentRoutes.js
const express = require('express');
const router = express.Router();
const Course = require('../models/Course'); // Needed to verify course existence
const User = require('../models/UserModels');     // Needed to manage user enrollments
const { protect, authorize } = require('../../server/Middleware/authMiddleware.js');

// @desc    Enroll a user in a course
// @route   POST /api/enrollments/:userId/:courseId
// @access  Private (Student only)
router.post('/:userId/:courseId', protect, authorize(['student']), async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    // Ensure the logged-in user is the one specified in the URL or is an admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to enroll this user in a course' });
    }

    const user = await User.findById(userId);
    const course = await Course.findById(courseId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if already enrolled - Convert existing ObjectIds to string for comparison
    if (user.enrolledCourses.map(id => id.toString()).includes(courseId)) {
      return res.status(400).json({ message: 'User is already enrolled in this course' });
    }

    user.enrolledCourses.push(courseId);
    await user.save();

    res.status(200).json({ message: 'Successfully enrolled in course', user });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid User or Course ID format' });
    }
    res.status(500).json({ message: 'Server Error enrolling user' });
  }
});

// @desc    Unenroll a user from a course
// @route   DELETE /api/enrollments/:userId/:courseId
// @access  Private (Student only)
router.delete('/:userId/:courseId', protect, authorize(['student']), async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to unenroll this user from a course' });
    }

    const user = await User.findById(userId);
    const course = await Course.findById(courseId); // Verify course exists

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Filter out the course to unenroll - Convert existing ObjectIds to string for comparison
    user.enrolledCourses = user.enrolledCourses.filter(
      (id) => id.toString() !== courseId
    );
    await user.save();

    res.status(200).json({ message: 'Successfully unenrolled from course', user });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid User or Course ID format' });
    }
    res.status(500).json({ message: 'Server Error unenrolling user' });
  }
});

// @desc    Get courses enrolled by the logged-in user (My Courses)
// @route   GET /api/enrollments/my-courses
// @access  Private (Authenticated users)
router.get('/my-courses', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('enrolledCourses');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user.enrolledCourses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching enrolled courses' });
  }
});

// @desc    Check if a user is enrolled in a specific course
// @route   GET /api/enrollments/check/:userId/:courseId
// @access  Private (Authenticated user, or admin checking for another user)
router.get('/check/:userId/:courseId', protect, async (req, res) => {
  try {
    const { userId, courseId } = req.params;

    // A user can check their own enrollment, or an admin can check anyone's
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to check enrollment for this user' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Convert enrolledCourses ObjectIds to strings for accurate comparison with courseId string
    const isEnrolled = user.enrolledCourses.map(id => id.toString()).includes(courseId);
    res.status(200).json({ isEnrolled });
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid User or Course ID format' });
    }
    res.status(500).json({ message: 'Server Error checking enrollment status' });
  }
});

module.exports = router;

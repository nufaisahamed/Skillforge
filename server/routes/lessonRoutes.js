// course-platform-backend/routes/lessonRoutes.js
const express = require('express');
const router = express.Router();
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
// Corrected User model import path (assuming file is User.js)
const User = require('../models/UserModels');
// Corrected authMiddleware import path (assuming folder is 'middleware' lowercase)
const { protect, authorize } = require('../../server/Middleware/authMiddleware.js');

// @desc    Get all lessons for a specific course
// @route   GET /api/courses/:courseId/lessons
// @access  Public (but content might be restricted to enrolled users later)
router.get('/courses/:courseId/lessons', async (req, res) => {
  try {
    const lessons = await Lesson.find({ course: req.params.courseId }).sort('order');
    res.status(200).json(lessons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching lessons' });
  }
});

// @desc    Get a single lesson by ID
// @route   GET /api/lessons/:id
// @access  Private (Only enrolled students, instructor, or admin can view content)
router.get('/lessons/:id', protect, async (req, res) => { // Added 'protect' middleware
  try {
    const lesson = await Lesson.findById(req.params.id).populate('course'); // Populate course to check instructor/enrollment
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // Check authorization:
    // 1. Is the requesting user the instructor of the course?
    // 2. Is the requesting user an admin?
    // 3. Is the requesting user enrolled in the course?
    const isInstructor = req.user.id === lesson.course.instructor.toString();
    const isAdmin = req.user.role === 'admin';

    let isEnrolled = false;
    if (req.user.role === 'student') {
      const user = await User.findById(req.user.id);
      if (user && user.enrolledCourses.includes(lesson.course._id)) {
        isEnrolled = true;
      }
    }

    if (!isInstructor && !isAdmin && !isEnrolled) {
      return res.status(403).json({ message: 'Not authorized to view this lesson content. Please enroll in the course.' });
    }

    res.status(200).json(lesson);
  } catch (error) {
    console.error(error);
    // Handle cases where req.user might be undefined due to failed auth in protect middleware
    // This catch block will only run if an error occurs *after* protect, or if protect *failed to return* and passed an undefined req.user
    if (error.message.includes("Cannot read properties of undefined (reading 'toString')") || error.message.includes("Cannot read properties of undefined (reading 'id')")) {
        return res.status(401).json({ message: 'Authentication required or invalid user data.' });
    }
    res.status(500).json({ message: 'Server Error fetching lesson' });
  }
});

// @desc    Create a new lesson for a specific course
// @route   POST /api/courses/:courseId/lessons
// @access  Private (Instructor only, and must be the instructor of the course)
router.post('/courses/:courseId/lessons', protect, authorize(['instructor', 'admin']), async (req, res) => {
  // NEW: Include imageUrl and externalUrl in destructuring
  const { title, description, videoUrl, content, imageUrl, externalUrl, order } = req.body;
  const courseId = req.params.courseId;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Ensure only the course instructor or an admin can add lessons
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to add lessons to this course' });
    }

    const lesson = await Lesson.create({
      title,
      description,
      videoUrl,
      content,
      imageUrl, // Include imageUrl
      externalUrl, // Include externalUrl
      order: order || 0, // Default to 0 if not provided
      course: courseId,
      instructor: req.user.id, // The ID of the user creating the lesson
    });

    res.status(201).json({ message: 'Lesson created successfully', lesson });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server Error creating lesson' });
  }
});

// @desc    Update a lesson
// @route   PUT /api/lessons/:id
// @access  Private (Instructor only, and must be the instructor of the lesson/course)
router.put('/lessons/:id', protect, authorize(['instructor', 'admin']), async (req, res) => {
  // NEW: Include imageUrl and externalUrl in destructuring
  const { title, description, videoUrl, content, imageUrl, externalUrl, order } = req.body;

  try {
    let lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // Ensure only the lesson's instructor or an admin can update it
    if (lesson.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this lesson' });
    }

    lesson.title = title || lesson.title;
    lesson.description = description || lesson.description;
    lesson.videoUrl = videoUrl || lesson.videoUrl;
    lesson.content = content || lesson.content;
    lesson.imageUrl = imageUrl || lesson.imageUrl; // Update imageUrl
    lesson.externalUrl = externalUrl || lesson.externalUrl; // Update externalUrl
    lesson.order = order !== undefined ? order : lesson.order;

    await lesson.save();

    res.status(200).json({ message: 'Lesson updated successfully', lesson });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server Error updating lesson' });
  }
});

// @desc    Delete a lesson
// @route   DELETE /api/lessons/:id
// @access  Private (Instructor only, and must be the instructor of the lesson/course)
router.delete('/lessons/:id', protect, authorize(['instructor', 'admin']), async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // Ensure only the lesson's instructor or an admin can delete it
    if (lesson.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this lesson' });
    }

    await lesson.deleteOne();

    res.status(200).json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error deleting lesson' });
  }
});

module.exports = router;

// course-platform-backend/routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { protect, authorize } = require('../Middleware/authMiddleware'); // Ensure correct path
const Lesson = require('../models/Lesson');
const UserProgress = require('../models/UserProgress');
const User = require('../models/UserModels')

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching courses' });
  }
});

// @desc    Get courses taught by the logged-in instructor
// @route   GET /api/courses/my-taught-courses
// @access  Private (Instructor/Admin only)
router.get('/my-taught-courses', protect, authorize(['instructor', 'admin']), async (req, res) => {
  try {
    // Find courses where the instructor field matches the logged-in user's ID
    const courses = await Course.find({ instructor: req.user.id });
    res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching instructor courses' });
  }
});


// @desc    Get single course by ID
// @route   GET /api/courses/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.status(200).json(course);
  } catch (error) {
    console.error(error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid Course ID format' });
    }
    res.status(500).json({ message: 'Server Error fetching course' });
  }
});

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private (Instructor/Admin only)
router.post('/', protect, authorize(['instructor', 'admin']), async (req, res) => {
  const { title, description, category, price, imageUrl } = req.body;

  try {
    const course = await Course.create({
      title,
      description,
      category,
      price,
      imageUrl,
      instructor: req.user.id, // Assign the logged-in user as the instructor
    });
    res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server Error creating course' });
  }
});

// @desc    Update a course
// @route   PUT /api/courses/:id
// @access  Private (Instructor/Admin only, must be course instructor)
router.put('/:id', protect, authorize(['instructor', 'admin']), async (req, res) => {
  const { title, description, category, price, imageUrl } = req.body;

  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Ensure only the instructor of the course or an admin can update it
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }

    course.title = title || course.title;
    course.description = description || course.description;
    course.category = category || course.category;
    course.price = price || course.price;
    course.imageUrl = imageUrl || course.imageUrl;

    await course.save();

    res.status(200).json({ message: 'Course updated successfully', course });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server Error updating course' });
  }
});

// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Private (Instructor/Admin only, must be course instructor)
router.delete('/:id', protect, authorize(['instructor', 'admin']), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      // If the course is not found, return 404
      return res.status(404).json({ message: 'Course not found' });
    }

    // Ensure only the instructor of the course or an admin can delete it
    if (course.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    }

    // --- Start: Delete associated data (Crucial for data integrity) ---
    // 1. Delete all lessons associated with this course
    await Lesson.deleteMany({ course: course._id });
    console.log(`[Backend] Deleted lessons for course ${course._id}`);

    // 2. Delete all user progress records for this course
    await UserProgress.deleteMany({ course: course._id });
    console.log(`[Backend] Deleted user progress for course ${course._id}`);

    // 3. Remove this course from all users' enrolledCourses arrays
    // Find all users who have this course in their enrolledCourses
    const usersToUpdate = await User.find({ enrolledCourses: course._id });

    // Update each user to pull the course from their enrolledCourses array
    for (const user of usersToUpdate) {
        user.enrolledCourses = user.enrolledCourses.filter(
            (enrolledCourseId) => enrolledCourseId.toString() !== course._id.toString()
        );
        await user.save();
    }
    console.log(`[Backend] Removed course from enrolledCourses for ${usersToUpdate.length} users.`);
    // --- End: Delete associated data ---

    // Finally, delete the course itself
    await course.deleteOne(); // Use deleteOne() for Mongoose 6+ to delete the document

    res.status(200).json({ message: 'Course removed successfully' });
  } catch (error) {
    console.error('[Backend Error - Delete Course]:', error); // More specific logging for debugging
    // Handle invalid MongoDB ID format
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid Course ID format' });
    }
    res.status(500).json({ message: 'Server Error deleting course' });
  }
});

module.exports = router;

// course-platform-backend/controllers/enrollmentController.js
const User = require('../models/UserModels'); // Import User model
const Course = require('../models/Course'); // Import Course model

// @desc    Enroll a user in a course
// @route   POST /api/enrollments
// @access  Private (User must be logged in)
const enrollInCourse = async (req, res) => {
  const { courseId } = req.body; // Expect courseId from the request body
  const userId = req.user._id; // Get user ID from authenticated request (req.user is set by auth middleware)

  try {
    // 1. Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // 3. Check if user is already enrolled
    // Convert ObjectId to string for comparison
    const isAlreadyEnrolled = user.enrolledCourses.some(
      (enrolledCourseId) => enrolledCourseId.toString() === courseId
    );

    if (isAlreadyEnrolled) {
      return res.status(400).json({ message: 'User is already enrolled in this course' });
    }

    // 4. Enroll the user (add courseId to user's enrolledCourses array)
    user.enrolledCourses.push(course._id);
    await user.save(); // Save the updated user document

    res.status(200).json({
      message: 'Successfully enrolled in course',
      enrolledCourse: {
        _id: course._id,
        title: course.title,
      },
      userEnrolledCourses: user.enrolledCourses, // Optionally return updated enrolled courses
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    // Handle invalid ObjectId format
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid Course ID format' });
    }
    res.status(500).json({ message: 'Server error during enrollment' });
  }
};

// @desc    Get courses enrolled by the authenticated user
// @route   GET /api/enrollments/my-courses
// @access  Private (User must be logged in)
const getMyEnrolledCourses = async (req, res) => {
  const userId = req.user._id; // Get user ID from authenticated request

  try {
    const user = await User.findById(userId).populate('enrolledCourses'); // Populate the course details
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user.enrolledCourses);
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({ message: 'Server error fetching enrolled courses' });
  }
};


module.exports = {
  enrollInCourse,
  getMyEnrolledCourses,
};

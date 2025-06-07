// course-platform-backend/routes/progressRoutes.js
const express = require('express');
const router = express.Router();
const UserProgress = require('../models/UserProgress');
const Course = require('../models/Course'); // Needed to get course info for lesson
const Lesson = require('../models/Lesson'); // Needed to check if lesson exists
const User = require('../models/UserModels');     // Import User model
const { protect, authorize } = require('../../server/Middleware/authMiddleware.js');

// @desc    Mark a lesson as complete for the logged-in user
// @route   POST /api/progress/complete-lesson/:lessonId
// @access  Private (Student only)
router.post('/complete-lesson/:lessonId', protect, authorize(['student']), async (req, res) => {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id; // ID of the logged-in user

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // Optional: Add a check here to ensure the student is enrolled in the course
    // before allowing them to complete a lesson.
    // For now, we'll assume they are if they can access the lesson page.
    const courseId = lesson.course; // Get the course ID from the lesson

    let userProgress = await UserProgress.findOneAndUpdate(
      { user: userId, lesson: lessonId },
      {
        course: courseId,
        completed: true,
        completionDate: new Date(),
      },
      {
        upsert: true, // Create if it doesn't exist
        new: true,    // Return the updated document
      }
    );

    res.status(200).json({ message: 'Lesson marked as complete', userProgress });
  } catch (error) {
    console.error('Error marking lesson complete:', error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid User or Course ID format' });
    }
    res.status(500).json({ message: 'Server Error marking lesson complete' });
  }
});

// @desc    Get a user's progress for a specific course
// @route   GET /api/progress/course/:courseId
// @access  Private (Student/Instructor/Admin)
router.get('/course/:courseId', protect, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // --- DEBUGGING LOGS START ---
    console.log(`[ProgressRoutes] Attempting to fetch progress for User ID: ${userId} and Course ID: ${courseId}`);
    // --- DEBUGGING LOGS END ---

    // First, ensure the requesting user is either the course instructor, an admin, or an enrolled student.
    const course = await Course.findById(courseId);
    if (!course) {
        // --- DEBUGGING LOGS START ---
        console.log(`[ProgressRoutes] Course not found for ID: ${courseId}`);
        // --- DEBUGGING LOGS END ---
        return res.status(404).json({ message: 'Course not found' });
    }

    const isInstructor = req.user.id === course.instructor.toString();
    const isAdmin = req.user.role === 'admin';

    let isEnrolled = false;
    if (req.user.role === 'student') {
        const user = await User.findById(req.user.id);
        // --- DEBUGGING LOGS START ---
        console.log(`[ProgressRoutes] Checking enrollment for student. User found: ${!!user}, Course ID: ${courseId}`);
        // --- DEBUGGING LOGS END ---
        // Convert enrolledCourses ObjectIds to strings for accurate comparison with courseId string
        if (user && user.enrolledCourses.map(id => id.toString()).includes(courseId)) {
            isEnrolled = true;
        }
    }

    if (!isInstructor && !isAdmin && !isEnrolled) {
        // --- DEBUGGING LOGS START ---
        console.log(`[ProgressRoutes] User not authorized. Is Instructor: ${isInstructor}, Is Admin: ${isAdmin}, Is Enrolled: ${isEnrolled}`);
        // --- DEBUGGING LOGS END ---
        return res.status(403).json({ message: 'Not authorized to view progress for this course.' });
    }

    // Get all lessons for the given course
    const lessonsInCourse = await Lesson.find({ course: courseId }).select('_id');
    const lessonIds = lessonsInCourse.map(lesson => lesson._id);

    // Get the user's progress for these lessons
    // Ensure that lessonIds is not empty before querying, or $in will fail
    const userProgress = lessonIds.length > 0
      ? await UserProgress.find({
          user: userId,
          lesson: { $in: lessonIds },
        }).select('lesson completed')
      : []; // Return empty array if no lessons

    // Structure the response to easily tell if a lesson is completed
    const progressMap = userProgress.reduce((acc, progress) => {
      acc[progress.lesson.toString()] = progress.completed;
      return acc;
    }, {});

    // --- DEBUGGING LOGS START ---
    console.log(`[ProgressRoutes] Successfully fetched progress. Total lessons: ${lessonsInCourse.length}, Completed: ${userProgress.filter(p => p.completed).length}`);
    // --- DEBUGGING LOGS END ---
    res.status(200).json({
      totalLessons: lessonsInCourse.length,
      completedLessons: userProgress.filter(p => p.completed).length,
      progress: progressMap,
    });
  } catch (error) {
    console.error('Error fetching course progress:', error); // Log the full error object
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({ message: 'Invalid Course ID or User ID format' });
    }
    // Generic 500 for other unexpected errors
    res.status(500).json({ message: 'Server Error fetching course progress' });
  }
});

module.exports = router;

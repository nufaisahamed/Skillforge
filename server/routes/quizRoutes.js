// course-platform-backend/routes/quizRoutes.js
const express = require('express');
const router = express.Router();
// Ensure correct paths and export names for middleware and controllers
const { protect, authorize } = require('../../server/Middleware/authMiddleware.js'); // Explicit .js extension
const {
  createQuiz,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
} = require('../controllers/quizController.js'); // Explicit .js extension

// Routes for Quiz management (instructor/admin only)
router.route('/')
  .post(protect, authorize(['instructor', 'admin']), createQuiz); // Create a new quiz

router.route('/:id')
  .get(protect, getQuizById) // Get a specific quiz (protected for enrolled students/instructor/admin)
  .put(protect, authorize(['instructor', 'admin']), updateQuiz) // Update a quiz
  .delete(protect, authorize(['instructor', 'admin']), deleteQuiz); // Delete a quiz

// Route for students to submit a quiz
router.route('/:id/submit')
  .post(protect, authorize(['student']), submitQuiz); // Submit quiz answers

module.exports = router;

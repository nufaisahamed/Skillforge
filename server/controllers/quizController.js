// course-platform-backend/controllers/quizController.js
const Quiz = require('../models/Quiz');
const Lesson = require('../models/Lesson'); // To link quizzes to lessons
const User = require('../models/UserModels'); // Required for checking enrollment/user role
const UserProgress = require('../models/UserProgress'); // To record quiz completion/score

// @desc    Create a new quiz
// @route   POST /api/quizzes
// @access  Private (Instructor/Admin only)
const createQuiz = async (req, res) => {
  // Changed from lessonId to lesson
  const { lesson: lessonId, title, description, questions } = req.body; // Destructure 'lesson' as lessonId for internal use
  const userId = req.user.id; // From protect middleware

  try {
    // 1. Check if the lesson exists
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    // 2. Authorization: Ensure the user is the instructor of the lesson or an admin
    if (lesson.instructor.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to create a quiz for this lesson.' });
    }

    // 3. Check if a quiz already exists for this lesson
    // Changed from lessonId to lesson
    const existingQuiz = await Quiz.findOne({ lesson: lessonId });
    if (existingQuiz) {
      return res.status(400).json({ message: 'A quiz already exists for this lesson. Please edit the existing one.' });
    }

    // 4. Create the quiz
    const quiz = await Quiz.create({
      lesson: lessonId, // Changed from lessonId to lesson
      title,
      description,
      questions,
    });

    // 5. Update the lesson to link to this new quiz
    lesson.quiz = quiz._id; // Add the quiz ID to the lesson
    await lesson.save();

    res.status(201).json({ message: 'Quiz created successfully', quiz });
  } catch (error) {
    console.error('Error creating quiz:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server Error creating quiz' });
  }
};

// @desc    Get a quiz by ID
// @route   GET /api/quizzes/:id
// @access  Private (Only enrolled students, instructor, or admin can view)
const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate({
      path: 'lesson', // Changed from lessonId to lesson
      populate: { path: 'course' } // Populate the course from the lesson
    });

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Authorization logic (similar to lesson content access)
    const userId = req.user.id;
    const userRole = req.user.role;

    // IMPORTANT: Check if lesson exists after populate. If it's null,
    // it means the referenced Lesson document does not exist.
    if (!quiz.lesson) { // Changed from lessonId to lesson
      console.error(`[getQuizById] Associated Lesson not found for quiz ID: ${req.params.id}. The lesson reference might be broken.`);
      return res.status(404).json({ message: 'Associated lesson for this quiz not found. It may have been deleted.' });
    }

    // Now, with lesson confirmed to exist, check if the course within it is populated
    if (!quiz.lesson.course) { // Changed from lessonId.course to lesson.course
      console.error(`[getQuizById] Course not populated within lesson for quiz ID: ${req.params.id}. Lesson ID: ${quiz.lesson._id}`); // Changed
      return res.status(500).json({ message: 'Internal server error: Course data for associated lesson is missing.' });
    }

    const courseId = quiz.lesson.course._id.toString(); // Changed from lessonId.course._id to lesson.course._id

    const isInstructor = quiz.lesson.instructor.toString() === userId; // Changed from lessonId.instructor to lesson.instructor
    const isAdmin = userRole === 'admin';

    let isEnrolled = false;
    if (userRole === 'student') {
      const user = await User.findById(userId);
      if (user && user.enrolledCourses.includes(courseId)) {
        isEnrolled = true;
      }
    }

    if (!isInstructor && !isAdmin && !isEnrolled) {
      return res.status(403).json({ message: 'Not authorized to view this quiz. Please enroll in the course.' });
    }

    // For students, remove the correct answers before sending
    if (userRole === 'student' && !isInstructor && !isAdmin) {
      const quizForStudent = { ...quiz.toObject() }; // Create a plain JS object copy
      quizForStudent.questions = quizForStudent.questions.map(q => {
        const { correctAnswer, ...rest } = q; // Destructure to exclude correctAnswer
        return rest;
      });
      return res.status(200).json(quizForStudent);
    }

    res.status(200).json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid Quiz ID format' });
    }
    res.status(500).json({ message: 'Server Error fetching quiz' });
  }
};


// @desc    Update a quiz
// @route   PUT /api/quizzes/:id
// @access  Private (Instructor/Admin only)
const updateQuiz = async (req, res) => {
  const { title, description, questions } = req.body;
  const quizId = req.params.id;
  const userId = req.user.id; // From protect middleware

  try {
    let quiz = await Quiz.findById(quizId).populate('lesson'); // Changed from lessonId to lesson

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Authorization: Ensure the user is the instructor of the associated lesson or an admin
    if (quiz.lesson.instructor.toString() !== userId && req.user.role !== 'admin') { // Changed
      return res.status(403).json({ message: 'Not authorized to update this quiz.' });
    }

    // Update fields
    quiz.title = title !== undefined ? title : quiz.title;
    quiz.description = description !== undefined ? description : quiz.description;
    quiz.questions = questions !== undefined ? questions : quiz.questions;

    await quiz.save();
    res.status(200).json({ message: 'Quiz updated successfully', quiz });
  } catch (error) {
    console.error('Error updating quiz:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid Quiz ID format' });
    }
    res.status(500).json({ message: 'Server Error updating quiz' });
  }
};

// @desc    Delete a quiz
// @route   DELETE /api/quizzes/:id
// @access  Private (Instructor/Admin only)
const deleteQuiz = async (req, res) => {
  const quizId = req.params.id;
  const userId = req.user.id; // From protect middleware

  try {
    const quiz = await Quiz.findById(quizId).populate('lesson'); // Changed from lessonId to lesson

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Authorization: Ensure the user is the instructor of the associated lesson or an admin
    if (quiz.lesson.instructor.toString() !== userId && req.user.role !== 'admin') { // Changed
      return res.status(403).json({ message: 'Not authorized to delete this quiz.' });
    }

    // Remove the quiz reference from the lesson
    const lesson = await Lesson.findById(quiz.lesson._id); // Changed from lessonId._id to lesson._id
    if (lesson) {
      lesson.quiz = undefined; // Remove the reference
      await lesson.save();
    }

    await quiz.deleteOne();
    res.status(200).json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid Quiz ID format' });
    }
    res.status(500).json({ message: 'Server Error deleting quiz' });
  }
};

// @desc    Submit a quiz and get results
// @route   POST /api/quizzes/:id/submit
// @access  Private (Student only)
const submitQuiz = async (req, res) => {
  const { id: quizId } = req.params; // Get quiz ID from URL
  const { answers } = req.body; // Array of { questionId, selectedOption }
  const userId = req.user.id; // ID of the logged-in user (student)

  try {
    console.log(`[submitQuiz] Attempting to submit quiz for Quiz ID: ${quizId}, User ID: ${userId}`);
    console.log(`[submitQuiz] Received answers:`, JSON.stringify(answers, null, 2));

    // Crucial: Populate lesson and then populate 'course' within lesson
    const quiz = await Quiz.findById(quizId).populate({
      path: 'lesson', // Changed from lessonId to lesson
      populate: { path: 'course' } // This ensures quiz.lesson.course is a populated Course object
    });
    if (!quiz) {
      console.log(`[submitQuiz] Quiz with ID ${quizId} not found.`);
      return res.status(404).json({ message: 'Quiz not found' });
    }
    console.log(`[submitQuiz] Found quiz: ${quiz.title}`);
    console.log(`[submitQuiz] Associated lesson: ${quiz.lesson?._id}, course: ${quiz.lesson?.course?._id}`); // Changed


    // Authorization: Ensure it's a student submitting and they are enrolled in the course
    if (req.user.role !== 'student') {
      console.log(`[submitQuiz] User role ${req.user.role} not allowed to submit quiz.`);
      return res.status(403).json({ message: 'Only students can submit quizzes.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log(`[submitQuiz] User with ID ${userId} not found.`);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log(`[submitQuiz] Found user: ${user.name}`);

    // Check if the student is enrolled in the course associated with the quiz
    // Ensure quiz.lesson.course is populated correctly from above
    if (!quiz.lesson || !quiz.lesson.course) { // Changed
      console.error('[submitQuiz] Quiz lesson or course not populated during submission check. Quiz object:', quiz);
      return res.status(500).json({ message: 'Internal server error: Course information missing for quiz.' });
    }
    const isEnrolled = user.enrolledCourses.includes(quiz.lesson.course._id.toString()); // Changed
    if (!isEnrolled) {
      console.log(`[submitQuiz] User not enrolled in course ${quiz.lesson.course._id}`); // Changed
      return res.status(403).json({ message: 'You must be enrolled in this course to submit this quiz.' });
    }
    console.log(`[submitQuiz] User is enrolled.`);

    let correctCount = 0;
    const totalQuestions = quiz.questions.length;
    const results = [];

    quiz.questions.forEach(q => {
      const userAnswer = answers.find(a => a.questionId === q._id.toString());
      const selectedOption = userAnswer ? userAnswer.selectedOption : null;
      const isCorrect = selectedOption && selectedOption === q.correctAnswer;
      if (isCorrect) {
        correctCount++;
      }
      results.push({
        questionId: q._id,
        questionText: q.questionText,
        selectedOption: selectedOption,
        correctAnswer: q.correctAnswer,
        isCorrect,
      });
    });
    console.log(`[submitQuiz] Quiz graded. Correct: ${correctCount}/${totalQuestions}`);

    // Handle case where there are no questions to prevent division by zero
    const score = (totalQuestions === 0) ? 0 : (correctCount / totalQuestions) * 100;
    console.log(`[submitQuiz] Calculated score: ${score.toFixed(2)}`);

    // Record quiz attempt/completion in UserProgress
    console.log(`[submitQuiz] Attempting to update UserProgress for user: ${userId}, lesson: ${quiz.lesson._id}, course: ${quiz.lesson.course._id}`); // Changed
    let userProgress = await UserProgress.findOneAndUpdate(
      { user: userId, lesson: quiz.lesson._id }, // Changed
      {
        course: quiz.lesson.course._id, // Changed
        completed: true, // Mark lesson as completed upon quiz submission
        completionDate: new Date(),
        // Potentially add `quizScore: score` to UserProgress schema if you want to store scores per lesson
      },
      { upsert: true, new: true } // Create if not exists, return updated document
    );
    console.log(`[submitQuiz] UserProgress updated:`, userProgress);

    res.status(200).json({
      message: 'Quiz submitted successfully',
      score: parseFloat(score.toFixed(2)), // Format score to 2 decimal places
      correctCount,
      totalQuestions,
      results,
      userProgress // Optionally return the updated progress
    });

  } catch (error) {
    console.error('FATAL ERROR in submitQuiz:', error); // Log the full error object for debugging
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid Quiz ID or Question ID format.' });
    }
    // Generic 500 for other unexpected errors, relying on the detailed console.error above
    res.status(500).json({ message: 'Server Error submitting quiz' });
  }
};


module.exports = {
  createQuiz,
  getQuizById,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
};

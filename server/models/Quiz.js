// course-platform-backend/models/Quiz.js
const mongoose = require('mongoose');

const QuizQuestionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
  },
  options: {
    type: [String], // Array of strings for options
    required: [true, 'Options are required'],
    validate: {
      validator: function(v) {
        return v.length >= 2; // Ensure at least two options
      },
      message: props => `A question must have at least 2 options, but has ${props.value.length}`
    }
  },
  correctAnswer: {
    type: String,
    required: [true, 'Correct answer is required'],
    validate: {
      validator: function(value) {
        // The correct answer must be one of the provided options
        return this.options.includes(value);
      },
      message: props => `Correct answer "${props.value}" is not one of the provided options.`
    }
  }
});

const QuizSchema = new mongoose.Schema({
  // Changed field name from 'lessonId' to 'lesson' to match your database
  lesson: {
    type: mongoose.Schema.ObjectId,
    ref: 'Lesson', // The name of the model to which it refers
    required: [true, 'Quiz must be associated with a lesson'],
    unique: true // Ensures only one quiz per lesson
  },
  title: {
    type: String,
    required: [true, 'Quiz title is required'],
    trim: true,
    maxlength: [100, 'Quiz title cannot be more than 100 characters'],
  },
  description: {
    type: String,
    trim: true,
  },
  questions: {
    type: [QuizQuestionSchema], // Array of embedded QuizQuestionSchema
    required: [true, 'Quiz must have questions'],
    validate: {
      validator: function(v) {
        return v.length > 0; // Ensure at least one question
      },
      message: 'A quiz must have at least one question.'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Quiz', QuizSchema);

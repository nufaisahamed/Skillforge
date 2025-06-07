// course-platform-backend/models/UserProgress.js
const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true,
  },
  lesson: {
    type: mongoose.Schema.ObjectId,
    ref: 'Lesson',
    required: true,
    unique: true, // A user has progress for a given lesson only once
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completionDate: {
    type: Date,
  },
  // You might want to add a field like `quizScore` here if you want to store it
  quizScore: {
    type: Number,
    min: 0,
    max: 100,
  },
  quizAttempted: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('UserProgress', UserProgressSchema);

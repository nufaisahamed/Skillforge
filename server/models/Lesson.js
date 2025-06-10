// course-platform-backend/models/Lesson.js
const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please add a lesson title'],
    trim: true,
    maxlength: [100, 'Title can not be more than 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please add a lesson description'],
    maxlength: [500, 'Description can not be more than 500 characters'],
  },
  videoUrl: {
    type: String,
    match: [/^$|^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/, 'Please use a valid URL for video'],
    trim: true,
  },
  imageUrl: {
    type: String,
    match: [/^$|^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/, 'Please use a valid URL for image'],
    trim: true,
  },
  content: {
    type: String,
    maxlength: [5000, 'Lesson content can not be more than 5000 characters'],
    trim: true,
  },
  externalUrl: {
    type: String,
    match: [/^$|^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/, 'Please use a valid URL for external page'],
    trim: true,
  },
  order: {
    type: Number,
    required: [true, 'Please add a lesson order'],
    min: 0,
    default: 0,
  },
  instructor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  // NEW: Reference to a Quiz
  quiz: {
    type: mongoose.Schema.ObjectId,
    ref: 'Quiz',
    default: null, // A lesson doesn't necessarily have a quiz
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Lesson', LessonSchema);

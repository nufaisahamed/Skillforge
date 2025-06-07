// models/Course.js
const mongoose = require('mongoose');

const CourseSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title for the course'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description for the course'],
    },
    instructor: {
      type: String,
      required: [true, 'Please add an instructor name'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please add a price for the course'],
      min: 0,
    },
    imageUrl: {
      type: String,
      default: 'https://via.placeholder.com/400x250', // Default image if none provided
    },
    category: {
      type: String,
      required: [true, 'Please add a category for the course'],
      enum: ['Web Development', 'Web Design', 'Backend Development', 'Programming', 'Design', 'Computer Science', 'Data Science', 'Mobile Development'], // Example categories
    },
    // You can add more fields like:
    // lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    // ratings: { type: Number, default: 0 },
    // numReviews: { type: Number, default: 0 },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

module.exports = mongoose.model('Course', CourseSchema);
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
      type: String, // Assuming instructor name is stored as a String
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
    ratings: { // NEW FIELD: Average rating for the course
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: val => Math.round(val * 10) / 10 // Store to 1 decimal place
    },
    numReviews: { // NEW FIELD: Number of reviews received
      type: Number,
      default: 0,
      min: 0
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

module.exports = mongoose.model('Course', CourseSchema);

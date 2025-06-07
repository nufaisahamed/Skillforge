// course-platform-backend/models/Storybook.js
const mongoose = require('mongoose');

const StorybookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Storybook title is required'],
    trim: true,
    maxlength: [200, 'Storybook title cannot be more than 200 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Storybook description cannot be more than 500 characters'],
  },
  pdfUrl: { // Reverted to pdfUrl (stores the URL to the PDF)
    type: String,
    required: [true, 'PDF URL is required'],
    trim: true,
    // Basic URL validation
    match: [
      /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/,
      'Please use a valid URL for the PDF',
    ],
  },
  imageUrl: { // NEW: Field for image URL (stores the URL to the image)
    type: String,
    trim: true,
    // Optional: Add URL validation for image if always required, but for now allow null
    match: [
      /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/,
      'Please use a valid URL for the image',
    ],
  },
  uploadedBy: { // Reference to the user who uploaded this (should be an admin)
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Storybook', StorybookSchema);

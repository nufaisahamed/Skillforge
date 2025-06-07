// course-platform-backend/routes/storybookRoutes.js
const express = require('express');
const router = express.Router();
const Storybook = require('../models/Storybook');
const { protect, authorize } = require('../../server/Middleware/authMiddleware.js');
// Removed multer and fs imports as they are no longer needed for URL-based management

// @desc    Get all storybooks
// @route   GET /api/storybooks
// @access  Private (Now protected, only logged-in users can see)
router.get('/', protect, async (req, res) => { // 'protect' middleware ensures user is logged in
  try {
    const storybooks = await Storybook.find().sort('-createdAt'); // Sort by newest first
    // No need to construct URLs; they are directly stored in pdfUrl and imageUrl
    res.status(200).json(storybooks);
  } catch (error) {
    console.error('Error fetching storybooks:', error);
    res.status(500).json({ message: 'Server Error fetching storybooks' });
  }
});

// @desc    Create a new storybook (URL-based)
// @route   POST /api/storybooks
// @access  Private (Admin only)
router.post('/', protect, authorize(['admin']), async (req, res) => {
  // Destructure title, description, pdfUrl, and imageUrl directly from request body
  const { title, description, pdfUrl, imageUrl } = req.body;

  try {
    const storybook = await Storybook.create({
      title,
      description,
      pdfUrl,   // Save the provided PDF URL
      imageUrl, // Save the provided Image URL
      uploadedBy: req.user.id, // Assign the logged-in admin as the uploader
    });
    res.status(201).json({ message: 'Storybook created successfully', storybook });
  } catch (error) {
    console.error('Error creating storybook:', error);
    if (error.name === 'ValidationError') {
      // Mongoose validation error (e.g., invalid URL format, missing required field)
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server Error creating storybook' });
  }
});

// @desc    Delete a storybook (no file deletion from server needed)
// @route   DELETE /api/storybooks/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize(['admin']), async (req, res) => {
  try {
    const storybook = await Storybook.findById(req.params.id);

    if (!storybook) {
      return res.status(404).json({ message: 'Storybook not found' });
    }

    // No need to delete files from the filesystem as we are storing URLs
    await storybook.deleteOne();

    res.status(200).json({ message: 'Storybook deleted successfully' });
  } catch (error) {
    console.error('Error deleting storybook:', error);
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid Storybook ID format' });
    }
    res.status(500).json({ message: 'Server Error deleting storybook' });
  }
});

module.exports = router;

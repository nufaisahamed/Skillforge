// course-platform-backend/routes/auth.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile } = require('../controllers/UserController');
const { protect } = require('../../server/Middleware/authMiddleware.js'); 

// Define authentication routes
router.post('/register', registerUser); // POST /api/auth/register
router.post('/login', loginUser);       // POST /api/auth/login

// The getUserProfile route will be protected,
// so we'll add the 'protect' middleware here once it's created.
// For now, it's commented out or left without protection.
router.get('/profile', protect, getUserProfile);

module.exports = router;
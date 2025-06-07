// course-platform-backend/controllers/authController.js
const User = require('../models/UserModels'); // Import the User model
const generateToken = require('../utils/generateToken'); // Import the token generator

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  console.log("Request Body:", req.body);

  const { name, email, password, role, phone, bio, profileImage } = req.body;

  // 1. Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  try {
    // 2. Create new user with additional fields
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      phone,
      bio,
      profileImage,
    });

    // 3. Respond with user data and token
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        bio: user.bio,
        profileImage: user.profileImage,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  // 1. Check if user exists by email
  const user = await User.findOne({ email });

  // 2. Check if user exists AND password matches
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      bio: user.bio,
      profileImage: user.profileImage,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' }); // 401 Unauthorized
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private (requires authentication)
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      bio: user.bio,
      profileImage: user.profileImage,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
};

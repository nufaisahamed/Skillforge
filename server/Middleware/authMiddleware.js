// course-platform-backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/UserModels'); // Ensure path is correct: ../models/User.js

// Protect routes: Ensures a valid JWT token is present and attaches user info to req.user
exports.protect = async (req, res, next) => {
  let token;

  // Check for Bearer token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Optional: Check for token in cookies if you implemented cookie-based auth
  // else if (req.cookies.token) {
  //   token = req.cookies.token
  // }

  // If no token is found, deny access
  if (!token) {
    return res.status(401).json({ message: 'Not authorized to access this route: No token provided' });
  }

  try {
    // Verify the token using the JWT secret from environment variables
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user associated with the token ID and exclude the password field
    req.user = await User.findById(decoded.id).select('-password');

    // If the user no longer exists in the DB (e.g., deleted account), deny access
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized to access this route: User not found from token' });
    }

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    // Log the detailed error for debugging purposes on the server
    console.error('Token verification error:', error);
    // Return a generic authorization failure message to the client
    return res.status(401).json({ message: 'Not authorized to access this route: Token invalid or expired' });
  }
};

// Authorize roles: Restricts access based on user role
exports.authorize = (roles = []) => { // Accepts an array of allowed roles (e.g., ['admin', 'instructor'])
  // Ensure roles is always an array for consistent processing
  if (!Array.isArray(roles)) {
    roles = [roles]; // Convert single role string to an array
  }

  return (req, res, next) => {
    // This middleware assumes 'protect' has already run and attached `req.user`
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized to access this route: No user attached to request' });
    }

    // Convert the user's role and allowed roles to lowercase for case-insensitive comparison
    const userRoleLower = req.user.role ? req.user.role.toLowerCase() : '';
    const allowedRolesLower = roles.map(r => r.toLowerCase());

    // Check if the user's role is NOT found in the list of allowed roles
    if (!allowedRolesLower.includes(userRoleLower)) {
      // If unauthorized, return a 403 Forbidden status
      return res.status(403).json({
        message: `User role '${req.user.role}' is not authorized to access this route. Allowed roles: ${roles.join(', ')}`,
      });
    }
    next(); // If authorized, proceed to the next middleware or route handler
  };
};

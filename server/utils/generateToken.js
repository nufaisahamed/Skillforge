const jwt = require('jsonwebtoken');
require('dotenv').config(); // Ensure dotenv is loaded for JWT_SECRET

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h', // Token expires in 1 hour
  });
};

module.exports = generateToken;
// config/db.js
const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are deprecated in newer Mongoose versions but common to see in older examples.
      // Mongoose 6+ handles them by default. You can remove them if using Mongoose 6+.
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;
// course-platform-backend/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/AuthRoutes');
const courseRoutes = require('./routes/courseRoutes'); // Ensure correct filename (courseRoutes.js)
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const lessonRoutes = require('./routes/lessonRoutes');
const progressRoutes = require('./routes/ProgressRoutes'); // NEW: Import progress routes
const quizRoutes = require('./routes/quizRoutes'); // NEW: Import progress routes
const storybookRoutes = require('./routes/storybookRoutes')
dotenv.config({ path: './config/config.env' }); // Assuming your .env file is in config/

connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "https://skillforge-five.vercel.app/", // your frontend URL
    credentials: true, // this allows cookies to be sent/received
  })
);

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api', lessonRoutes); // Mount lesson routes directly under /api
app.use('/api/progress', progressRoutes); // NEW: Mount progress routes
app.use('/api/quizzes', quizRoutes); // NEW: Mount quiz routes
app.use('/api/storybooks', storybookRoutes); // NEW: Mount storybook routes
app.use('/api/jobs', require('./routes/jobRoutes'));

// Basic route for the home page
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`)
);

// Handle unhandled promise rejections to prevent crashing
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// course-platform-backend/models/Job.js
const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a job title'],
    trim: true,
    maxlength: [100, 'Job title cannot be more than 100 characters']
  },
  company: {
    type: String,
    required: [true, 'Please add a company name'],
    trim: true,
    maxlength: [100, 'Company name cannot be more than 100 characters']
  },
  location: {
    type: String,
    required: [true, 'Please add a location (e.g., city, remote)'],
    trim: true,
    maxlength: [100, 'Location cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a job description'],
    minlength: [50, 'Job description must be at least 50 characters']
  },
  requirements: {
    type: [String], // Array of strings for skills/requirements
    default: []
  },
  salaryRange: {
    type: String,
    enum: ['Not disclosed', 'Below $30k', '$30k - $50k', '$50k - $70k', '$70k - $100k', '$100k - $150k', 'Above $150k', 'Competitive'],
    default: 'Not disclosed'
  },
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary'],
    default: 'Full-time'
  },
  applicationLink: {
    type: String, // URL for online application
    match: [
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
      'Please use a valid URL with HTTP or HTTPS'
    ],
    required: function() { return !this.applicationEmail; } // Required if applicationEmail is not present
  },
  applicationEmail: {
    type: String,
    match: [
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      'Please add a valid email address'
    ],
    required: function() { return !this.applicationLink; } // Required if applicationLink is not present
  },
  postedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  postedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Job', JobSchema);

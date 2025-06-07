// controllers/courseController.js
const Course = require("../models/Course"); // Import your Course model

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
const getCourses = async (req, res) => {
  try {
    const courses = await Course.find({}); // Find all courses
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get single course by ID
// @route   GET /api/courses/:id
// @access  Public
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id); // Find course by ID from URL params

    if (!course) {
      // If no course found witnh that ID
      return res.status(404).json({ message: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    console.error(error);
    // Check if the error is due to an invalid MongoDB ID format
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid Course ID format" });
    }
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Create a new course
// @route   POST /api/courses
// @access  Public (for now, will be protected later)
const createCourse = async (req, res) => {
  try {
    const { title, description, instructor, price, imageUrl, category } =
      req.body;

    if (!title || !description || !instructor || !price || !category) {
      return res
        .status(400)
        .json({ message: "Please enter all required fields" });
    }

    const course = new Course({
      title,
      description,
      instructor,
      price,
      imageUrl,
      category,
    });

    const createdCourse = await course.save();
    res.status(201).json(createdCourse); // 201 Created
  } catch (error) {
    console.error(error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update a course by ID
// @route   PUT /api/courses/:id
// @access  Public (for now, will be protected later)
const updateCourse = async (req, res) => {
  try {
    console.log("BODY RECEIVED:", req.body);

    const { title, description, instructor, price, imageUrl, category } = req.body;

    let course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    course.title = title || course.title;
    course.description = description || course.description;
    course.instructor = instructor || course.instructor;
    course.price = price || course.price;
    course.imageUrl = imageUrl || course.imageUrl;
    course.category = category || course.category;

    const updatedCourse = await course.save();
    res.json(updatedCourse);
  } catch (error) {
    console.error(error);
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid Course ID format" });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server Error" });
  }
};


// @desc    Delete a course by ID
// @route   DELETE /api/courses/:id
// @access  Public (for now, will be protected later)
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    await Course.deleteOne({ _id: req.params.id }); // Use deleteOne with query or findByIdAndDelete
    // Alternatively for Mongoose < 6: await course.remove();

    res.json({ message: "Course removed" });
  } catch (error) {
    console.error(error);
    if (error.kind === "ObjectId") {
      return res.status(400).json({ message: "Invalid Course ID format" });
    }
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  getCourses,
  getCourseById, // Export new function
  createCourse,
  updateCourse, // Export new function
  deleteCourse, // Export new function
};

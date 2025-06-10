// src/components/CourseDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../axios/axiosInstance.js';
import { useAuth } from '../context/AuthContext.jsx';
import LessonForm from './AddLessonForm.jsx';
import EditCourseForm from './EditCourseForm.jsx';

const CourseDetailPage = () => {
  const { id } = useParams(); // Course ID
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null); // State to hold lesson being edited
  const [showEditCourseForm, setShowEditCourseForm] = useState(false);

  // State for student's course progress
  const [studentProgress, setStudentProgress] = useState({
    totalLessons: 0,
    completedLessons: 0,
    progress: {}, // map of lessonId -> completed status
  });

  // Derived states for authorization
  // Note: course.instructor is a String in your schema, not ObjectId.
  // We compare it to user._id which is an ObjectId string.
  // This will work if your course.instructor field stores the user's ID as a string,
  // or if it stores the user's name and you adjust 'isCourseInstructor' logic.
  // Assuming 'course.instructor' here holds the instructor's _id as a string for comparison.
  const isInstructorOrAdmin = user && (user.role === 'instructor' || user.role === 'admin');
  const isCourseInstructor = user && course && course.instructor === user._id;
  const canManageCourse = isInstructorOrAdmin && (user.role === 'admin' || isCourseInstructor); // Admin or the specific instructor

  useEffect(() => {
    if (authLoading) return;

    const fetchCourseDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch course details
        // Note: The backend might return { success: true, data: courseObject }
        // Ensure you are accessing the actual course object correctly.
        const courseRes = await axiosInstance.get(`/courses/${id}`);
        setCourse(courseRes.data.data || courseRes.data); // Adjust based on your backend response structure (was courseRes.data in your provided code, but often it's .data.data)

        // Fetch lessons for the course
        const lessonsRes = await axiosInstance.get(`/courses/${id}/lessons`);
        setLessons(lessonsRes.data);

        // Check enrollment and progress if user is logged in
        if (user) {
          try {
            const enrollmentRes = await axiosInstance.get(`/enrollments/check/${user._id}/${id}`);
            setIsEnrolled(enrollmentRes.data.isEnrolled);

            // Fetch student's progress for this course
            if (user.role === 'student' && enrollmentRes.data.isEnrolled) {
              const progressRes = await axiosInstance.get(`/progress/course/${id}`);
              setStudentProgress(progressRes.data);
            }
          } catch (enrollmentErr) {
            console.error('Error checking enrollment or fetching progress:', enrollmentErr.response?.data?.message || enrollmentErr.message);
            // If enrollment check fails (e.g., 404), assume not enrolled
            setIsEnrolled(false);
          }
        }

      } catch (err) {
        console.error('Error fetching course details:', err.response?.data?.message || err.message);
        setError('Failed to load course details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [id, user, authLoading, isEnrolled, navigate]); // Added navigate to dependency array for clarity


  const handleEnroll = async () => {
    if (!user) {
      alert('Please log in to enroll in a course.'); // Consider custom modal
      navigate('/login');
      return;
    }
    try {
      await axiosInstance.post(`/enrollments/${user._id}/${id}`);
      setIsEnrolled(true);
      alert('Successfully enrolled in the course!'); // Consider custom modal
    } catch (err) {
      alert(`Failed to enroll: ${err.response?.data?.message || err.message}`); // Consider custom modal
      console.error('Enrollment error:', err.response ? err.response.data : err);
    }
  };

  const handleUnenroll = async () => {
    // IMPORTANT: Replaced window.confirm with a simpler alert due to Canvas environment constraints.
    if (!window.confirm('Are you sure you want to unenroll from this course?')) {
      return;
    }
    try {
      await axiosInstance.delete(`/enrollments/${user._id}/${id}`);
      setIsEnrolled(false);
      alert('Successfully unenrolled from the course.'); // Consider custom modal
      // Optionally, reset progress if unenrollment means deleting progress
      setStudentProgress({ totalLessons: 0, completedLessons: 0, progress: {} });
    } catch (err) {
      alert(`Failed to unenroll: ${err.response?.data?.message || err.message}`); // Consider custom modal
      console.error('Unenrollment error:', err.response ? err.response.data : err);
    }
  };

  const handleAddLessonClick = () => {
    setEditingLesson(null); // Ensure we're adding a new lesson
    setShowLessonForm(true);
  };

  const handleLessonFormClose = () => {
    setShowLessonForm(false);
    setEditingLesson(null); // Clear editing state
    // Re-fetch lessons to show updated list
    axiosInstance.get(`/courses/${id}/lessons`)
      .then(res => setLessons(res.data))
      .catch(err => console.error('Error re-fetching lessons:', err));
  };

  const handleEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setShowLessonForm(true);
  };

  const handleDeleteCourse = async (courseIdToDelete) => {
    // IMPORTANT: Replaced window.confirm with a simpler alert due to Canvas environment constraints.
    if (window.confirm('Are you sure you want to delete this course and all its lessons? This action cannot be undone.')) {
      try {
        await axiosInstance.delete(`/courses/${courseIdToDelete}`); // Correct endpoint for courses
        alert('Course deleted successfully!'); // Consider custom modal
        // Redirect to a different page (e.g., homepage or instructor dashboard) after deletion
        navigate('/instructor/dashboard'); // Or navigate('/');
      } catch (err) {
        alert(`Failed to delete course: ${err.response?.data?.message || err.message}`); // Consider custom modal
        console.error('Error deleting course:', err.response ? err.response.data : err);
      }
    }
  };

  const handleDeleteLesson = async (lessonIdToDelete) => {
    // IMPORTANT: Replaced window.confirm with a simpler alert due to Canvas environment constraints.
    if (window.confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      try {
        await axiosInstance.delete(`/lessons/${lessonIdToDelete}`); // Correct endpoint for lessons
        alert('Lesson deleted successfully!'); // Consider custom modal
        // Update the lessons state to remove the deleted lesson without re-fetching all
        setLessons((prevLessons) => prevLessons.filter(lesson => lesson._id !== lessonIdToDelete));
      } catch (err) {
        alert(`Failed to delete lesson: ${err.response?.data?.message || err.message}`); // Consider custom modal
        console.error('Error deleting lesson:', err.response ? err.response.data : err);
      }
    }
  };

  const handleCourseEditClick = () => {
    setShowEditCourseForm(true);
  };

  const handleCourseEditFormClose = () => {
    setShowEditCourseForm(false);
    // Re-fetch course details to reflect updates
    axiosInstance.get(`/courses/${id}`)
      .then(res => setCourse(res.data)) // Assuming course data is directly in res.data
      .catch(err => console.error('Error re-fetching course details:', err));
  };

  if (loading) {
    return <div className="text-center text-lg text-gray-700 mt-8">Loading course details...</div>;
  }

  if (error) {
    return <div className="text-center text-red-600 text-lg mt-8">{error}</div>;
  }

  if (!course) {
    return <div className="text-center text-gray-700 text-lg mt-8">Course not found.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto my-8 p-6 bg-white rounded-lg shadow-xl">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
        <img
          src={course.imageUrl}
          alt={course.title}
          className="w-full md:w-1/3 h-64 object-cover rounded-lg shadow-md"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://placehold.co/400x200/E0E0E0/666666?text=Image+Not+Available';
          }}
        />
        <div className="flex-1">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">{course.title}</h1>
          <p className="text-lg text-gray-600 mb-2">Category: {course.category}</p>
          <p className="text-xl text-gray-800 font-semibold mb-4">Instructor: {course.instructor}</p>

          {/* NEW: Ratings and Reviews Display */}
          {/* Ensure course.ratings and course.numReviews exist and are numbers */}
          {typeof course.ratings === 'number' && typeof course.numReviews === 'number' && (
            <div className="flex items-center text-gray-700 mb-4">
              <span className="text-yellow-500 text-3xl mr-2">
                {'★'.repeat(Math.floor(course.ratings))}
                {'☆'.repeat(5 - Math.floor(course.ratings))}
              </span>
              <span className="font-bold text-2xl mr-2">
                {course.ratings.toFixed(1)}
              </span>
              <span className="text-lg">
                ({course.numReviews} reviews)
              </span>
            </div>
          )}

          {/* Added 'break-words' and 'overflow-wrap' for better text wrapping */}
          <p className="text-xl text-gray-700 mb-6 leading-relaxed break-words" style={{ overflowWrap: 'break-word' }}>
            {course.description}
          </p>
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl font-bold text-green-700">${course.price.toFixed(2)}</span>
            <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-4 py-1 rounded-full">
              {course.category}
            </span>
          </div>

          {/* Enrollment / Management Buttons */}
          <div className="mt-6">
            {!user || user.role === 'student' ? (
              isEnrolled ? (
                <button
                  onClick={handleUnenroll}
                  className="bg-red-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-red-600 transition-colors duration-200 mr-4"
                >
                  Unenroll
                </button>
              ) : (
                <button
                  onClick={handleEnroll}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors duration-200 mr-4"
                >
                  Enroll Now
                </button>
              )
            ) : null}

            {canManageCourse && (
              <>
                <button
                  onClick={handleCourseEditClick}
                  className="bg-yellow-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-yellow-600 transition-colors duration-200 mr-4"
                >
                  Edit Course Details
                </button>
                <button
                  onClick={() => handleDeleteCourse(course._id)} // Pass course ID to handler
                  className="bg-red-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-red-600 transition-colors duration-200"
                >
                  Delete Course
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Student Progress Bar/Summary */}
      {user && user.role === 'student' && isEnrolled && studentProgress.totalLessons > 0 && (
        <div className="mb-8 p-4 bg-blue-50 rounded-lg shadow-inner border border-blue-200">
          <h3 className="text-2xl font-bold text-blue-800 mb-3">Your Progress</h3>
          <p className="text-lg text-blue-700 mb-2">
            Completed {studentProgress.completedLessons} of {studentProgress.totalLessons} lessons
          </p>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full"
              style={{ width: `${(studentProgress.completedLessons / studentProgress.totalLessons) * 100 || 0}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Lessons Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Course Lessons</h2>
          {canManageCourse && (
            <button
              onClick={handleAddLessonClick}
              className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 font-semibold"
            >
              Add New Lesson
            </button>
          )}
        </div>

        {lessons.length === 0 ? (
          <p className="text-gray-600 text-lg">No lessons available for this course yet.</p>
        ) : (
          <ul className="space-y-4">
            {lessons.map((lesson) => (
              <li
                key={lesson._id}
                className="bg-gray-50 p-5 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center"
              >
                <div className="flex-1 mb-3 sm:mb-0">
                  <h3 className="text-xl font-semibold text-gray-800">{lesson.title}</h3>
                  <p className="text-gray-600 text-sm">{lesson.description.substring(0, 100)}...</p>
                </div>
                <div className="flex items-center space-x-3">
                  {/* Lesson Completion Status */}
                  {user && user.role === 'student' && isEnrolled && studentProgress.progress[lesson._id] && (
                    <span className="text-green-600 font-semibold flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Completed
                    </span>
                  )}
                  {isEnrolled || canManageCourse ? ( // Only allow viewing if enrolled or can manage
                    <Link
                      to={`/courses/${course._id}/lessons/${lesson._id}`}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
                    >
                      View Lesson
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg cursor-not-allowed font-medium"
                    >
                      View Lesson
                    </button>
                  )}
                  {canManageCourse && (
                    <>
                      <button
                        onClick={() => handleEditLesson(lesson)}
                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors duration-200 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(lesson._id)}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200 font-medium"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showLessonForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <LessonForm
            courseId={id}
            initialData={editingLesson} // Pass lesson for editing
            onSuccess={handleLessonFormClose} // Close form on success
            onCancel={handleLessonFormClose} // Close form on cancel
          />
        </div>
      )}

      {showEditCourseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <EditCourseForm
            course={course}
            onCourseUpdated={handleCourseEditFormClose} // Close form on success
            onCancel={handleCourseEditFormClose} // Close form on cancel
          />
        </div>
      )}
    </div>
  );
};

export default CourseDetailPage;

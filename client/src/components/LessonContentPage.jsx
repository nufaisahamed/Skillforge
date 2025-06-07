// src/components/LessonContentPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../axios/axiosInstance.js';
import { useAuth } from '../context/AuthContext.jsx'; // Ensure path is correct

const LessonContentPage = () => {
  const { courseId, lessonId } = useParams(); // Get both courseId and lessonId from URL
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [lesson, setLesson] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({}); // Stores selected answers for the quiz
  const [quizResults, setQuizResults] = useState(null); // Stores results after quiz submission
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false); // Track if lesson is completed

  const isInstructorOrAdmin = user && (user.role === 'instructor' || user.role === 'admin');

  useEffect(() => {
    // Redirect if not authenticated after auth loading is complete
    if (!authLoading && !user) {
      alert('Please log in to view lesson content.');
      navigate('/login');
      return;
    }

    const fetchLessonAndQuiz = async () => {
      if (!lessonId || !user) { // Ensure lessonId and user are available
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch lesson details (backend handles authorization for content viewing)
        const lessonResponse = await axiosInstance.get(`/lessons/${lessonId}`);
        setLesson(lessonResponse.data);

        // Check if lesson is completed by the user
        // This relies on the progress route we created earlier
        if (user.role === 'student') {
          const progressRes = await axiosInstance.get(`/progress/course/${courseId}`);
          if (progressRes.data.progress[lessonId]) {
            setIsLessonCompleted(progressRes.data.progress[lessonId]);
          }
        }

        // If the lesson has a quiz, fetch it
        if (lessonResponse.data.quiz) {
          const quizResponse = await axiosInstance.get(`/quizzes/${lessonResponse.data.quiz}`);
          setQuiz(quizResponse.data);
          // Initialize userAnswers state for all questions in the quiz
          const initialAnswers = {};
          quizResponse.data.questions.forEach(q => {
            initialAnswers[q._id] = ''; // Initialize with empty string
          });
          setUserAnswers(initialAnswers);
        } else {
          setQuiz(null); // No quiz for this lesson
        }

      } catch (err) {
        if (err.response) {
          if (err.response.status === 404) {
            setError('Lesson or associated quiz not found.');
          } else if (err.response.status === 403) {
            setError(`Unauthorized: ${err.response.data.message || 'You are not authorized to view this lesson.'}`);
          } else {
            setError(`Failed to fetch lesson: ${err.response.data.message || err.message}`);
          }
        } else {
          setError(`Network error or client error: ${err.message}`);
        }
        console.error('Error fetching lesson/quiz:', err.response ? err.response.data : err);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if authentication is ready and user is logged in
    if (user) {
      fetchLessonAndQuiz();
    }
  }, [lessonId, courseId, user, authLoading, navigate]);

  const handleOptionChange = (questionId, option) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;

    // Convert userAnswers object to the array format expected by the backend
    const answersArray = Object.keys(userAnswers).map(questionId => ({
      questionId,
      selectedOption: userAnswers[questionId],
    }));

    try {
      setLoading(true);
      setQuizResults(null); // Clear previous results
      const response = await axiosInstance.post(`/quizzes/${quiz._id}/submit`, { answers: answersArray });
      setQuizResults(response.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.message || 'Failed to submit quiz. Please try again.';
      setError(msg);
      console.error('Quiz submission error:', err.response ? err.response.data : err);
    }
  };

  const handleMarkAsComplete = async () => {
    // Optional: Add logic to require quiz completion before marking lesson complete
    if (quiz && !quizResults) {
      alert('Please complete the quiz before marking the lesson as complete.');
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.post(`/progress/complete-lesson/${lessonId}`);
      setIsLessonCompleted(true);
      alert(response.data.message || 'Lesson marked as complete!');
      setLoading(false);
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.message || 'Failed to mark lesson as complete.';
      setError(msg);
      console.error('Error marking lesson complete:', err.response ? err.response.data : err);
    }
  };


  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 font-inter">
        <p className="text-gray-700 text-lg">Loading lesson content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-100 font-inter p-4">
        <p className="text-red-700 text-lg mb-4 text-center">Error: {error}</p>
        <button onClick={() => navigate(`/courses/${courseId}`)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 mt-4">
          Go back to Course
        </button>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 font-inter p-4">
        <p className="text-gray-700 text-lg mb-4 text-center">Lesson content not found.</p>
        <button onClick={() => navigate(`/courses/${courseId}`)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 mt-4">
          Go back to Course
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-8 p-6 bg-white rounded-lg shadow-xl">
      <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">
        {lesson.order}. {lesson.title}
      </h1>
      <p className="text-gray-700 text-lg mb-6 text-center">{lesson.description}</p>

      {/* Lesson Content: Video, Image, External URL, Text */}
      {lesson.videoUrl && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Video Lecture</h2>
          <div className="relative" style={{ paddingBottom: '56.25%', height: 0 }}>
            <iframe
              src={lesson.videoUrl}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute top-0 left-0 w-full h-full rounded-lg shadow-md"
            ></iframe>
          </div>
        </div>
      )}

      {lesson.imageUrl && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Image</h2>
          <img
            src={lesson.imageUrl}
            alt={`${lesson.title} illustration`}
            className="w-full h-auto rounded-lg shadow-md object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/800x450/E0E0E0/666666?text=Image+Not+Available';
            }}
          />
        </div>
      )}

      {lesson.externalUrl && (
        <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
          <h2 className="text-2xl font-semibold text-blue-800 mb-3">External Resource</h2>
          <p className="text-blue-700 mb-4">Click below to view the external web page for this lesson:</p>
          <a
            href={lesson.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold text-lg"
          >
            Go to External Page
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block ml-2 -mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}

      {lesson.content && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Lesson Notes</h2>
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 text-gray-800 leading-relaxed">
            <p>{lesson.content}</p>
          </div>
        </div>
      )}

      {!lesson.videoUrl && !lesson.imageUrl && !lesson.externalUrl && !lesson.content && (
        <p className="text-center text-gray-600 text-lg">No content available for this lesson yet.</p>
      )}

      {/* Quiz Section */}
      {quiz && !isInstructorOrAdmin && ( // Only show quiz for students, not instructors/admins
        <div className="mt-10 p-6 bg-blue-50 rounded-lg shadow-inner border border-blue-200">
          <h2 className="text-3xl font-bold text-blue-800 mb-4">Quiz: {quiz.title}</h2>
          {quiz.description && <p className="text-blue-700 mb-6">{quiz.description}</p>}

          {quizResults ? ( // Display quiz results if submitted
            <div className="bg-white p-5 rounded-lg shadow-md border border-green-300">
              <h3 className="text-2xl font-bold text-green-700 mb-4">Quiz Results: {quizResults.score}%</h3>
              <p className="text-lg text-gray-800 mb-4">
                You got {quizResults.correctCount} out of {quizResults.totalQuestions} questions correct.
              </p>
              <div className="space-y-4">
                {quizResults.results.map((result, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${result.isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                    <p className="font-semibold text-gray-900 mb-2">Q{index + 1}: {result.questionText}</p>
                    <p className="text-sm text-gray-700">Your Answer: <span className={`${result.isCorrect ? 'text-green-600' : 'text-red-600 font-bold'}`}>{result.selectedOption || 'No answer selected'}</span></p>
                    {!result.isCorrect && (
                      <p className="text-sm text-green-600">Correct Answer: <span className="font-bold">{result.correctAnswer}</span></p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : ( // Show quiz questions if not submitted
            <div className="space-y-6">
              {quiz.questions.map((q, qIndex) => (
                <div key={q._id} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                  <p className="text-lg font-semibold text-gray-900 mb-3">Q{qIndex + 1}: {q.questionText}</p>
                  <div className="space-y-2">
                    {q.options.map((option, oIndex) => (
                      <label key={oIndex} className="flex items-center text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name={`question-${q._id}`}
                          value={option}
                          checked={userAnswers[q._id] === option}
                          onChange={() => handleOptionChange(q._id, option)}
                          className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                        />
                        <span className="ml-2">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div className="text-center mt-6">
                <button
                  onClick={handleSubmitQuiz}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 font-semibold text-xl"
                  disabled={loading} // Disable if submission is in progress
                >
                  {loading ? 'Submitting...' : 'Submit Quiz'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 text-center space-x-4 flex justify-center">
        <button onClick={() => navigate(`/courses/${courseId}`)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 font-semibold text-lg">
          Back to Course Overview
        </button>
        {user && user.role === 'student' && (
          <button
            onClick={handleMarkAsComplete}
            className={`px-6 py-3 rounded-lg shadow-md transition-colors duration-200 font-semibold text-lg
              ${isLessonCompleted ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50'}`}
            disabled={isLessonCompleted || loading}
          >
            {isLessonCompleted ? 'Lesson Completed!' : 'Mark as Complete'}
          </button>
        )}
      </div>
    </div>
  );
};

export default LessonContentPage;

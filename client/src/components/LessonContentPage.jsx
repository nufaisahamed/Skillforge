import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../axios/axiosInstance.js';
import { useAuth } from '../context/AuthContext.jsx';

// ✅ Helper to convert YouTube URLs to embed format
function convertToEmbedUrl(url) {
  if (url.includes('youtube.com/watch')) {
    const videoId = new URL(url).searchParams.get('v');
    return `https://www.youtube.com/embed/${videoId}`;
  }

  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1];
    return `https://www.youtube.com/embed/${videoId}`;
  }

  return url; // Return original if not YouTube
}

const LessonContentPage = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [lesson, setLesson] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLessonCompleted, setIsLessonCompleted] = useState(false);

  const isInstructorOrAdmin = user && (user.role === 'instructor' || user.role === 'admin');

  useEffect(() => {
    if (!authLoading && !user) {
      alert('Please log in to view lesson content.');
      navigate('/login');
      return;
    }

    const fetchLessonAndQuiz = async () => {
      if (!lessonId || !user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const lessonResponse = await axiosInstance.get(`/lessons/${lessonId}`);
        setLesson(lessonResponse.data);

        if (user.role === 'student') {
          const progressRes = await axiosInstance.get(`/progress/course/${courseId}`);
          if (progressRes.data.progress[lessonId]) {
            setIsLessonCompleted(progressRes.data.progress[lessonId]);
          }
        }

        if (lessonResponse.data.quiz) {
          const quizResponse = await axiosInstance.get(`/quizzes/${lessonResponse.data.quiz}`);
          setQuiz(quizResponse.data);
          const initialAnswers = {};
          quizResponse.data.questions.forEach(q => {
            initialAnswers[q._id] = '';
          });
          setUserAnswers(initialAnswers);
        } else {
          setQuiz(null);
        }

      } catch (err) {
        const msg = err.response?.data?.message || err.message;
        setError(`Failed to fetch lesson: ${msg}`);
        console.error('Error fetching lesson:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchLessonAndQuiz();
    }
  }, [lessonId, courseId, user, authLoading, navigate]);

  const handleOptionChange = (questionId, option) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;

    const answersArray = Object.keys(userAnswers).map(questionId => ({
      questionId,
      selectedOption: userAnswers[questionId],
    }));

    try {
      setLoading(true);
      const response = await axiosInstance.post(`/quizzes/${quiz._id}/submit`, { answers: answersArray });
      setQuizResults(response.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit quiz. Please try again.';
      setError(msg);
      console.error('Quiz submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsComplete = async () => {
    if (quiz && !quizResults) {
      alert('Please complete the quiz before marking the lesson as complete.');
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.post(`/progress/complete-lesson/${lessonId}`);
      setIsLessonCompleted(true);
      alert(response.data.message || 'Lesson marked as complete!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to mark lesson as complete.';
      setError(msg);
      console.error('Error marking lesson complete:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 font-inter"><p>Loading lesson content...</p></div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-100 p-4">
        <p className="text-red-700 text-lg mb-4 text-center">Error: {error}</p>
        <button onClick={() => navigate(`/courses/${courseId}`)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mt-4">
          Go back to Course
        </button>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <p className="text-gray-700 text-lg mb-4 text-center">Lesson content not found.</p>
        <button onClick={() => navigate(`/courses/${courseId}`)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mt-4">
          Go back to Course
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-8 p-6 bg-white rounded-lg shadow-xl">
      <h1 className="text-4xl font-bold text-center text-gray-900 mb-4">
        {lesson.order}. {lesson.title}
      </h1>
      <p className="text-center text-gray-700 text-lg mb-6">{lesson.description}</p>

      {/* ✅ Video section */}
      {lesson.videoUrl && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Video Lecture</h2>
          <div className="relative" style={{ paddingBottom: '56.25%', height: 0 }}>
            {lesson.videoUrl.includes('youtube.com') || lesson.videoUrl.includes('youtu.be') ? (
              <iframe
                src={convertToEmbedUrl(lesson.videoUrl)}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full rounded-lg shadow-md"
              />
            ) : (
              <video
                src={lesson.videoUrl}
                controls
                className="absolute top-0 left-0 w-full h-full rounded-lg shadow-md"
              />
            )}
          </div>
        </div>
      )}

      {/* ✅ Image section */}
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

      {/* ✅ External resource */}
      {lesson.externalUrl && (
        <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200 text-center">
          <h2 className="text-2xl font-semibold text-blue-800 mb-3">External Resource</h2>
          <p className="text-blue-700 mb-4">Click below to view the external web page:</p>
          <a href={lesson.externalUrl} target="_blank" rel="noopener noreferrer"
             className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold text-lg inline-block">
            Go to External Page
          </a>
        </div>
      )}

      {/* ✅ Lesson content */}
      {lesson.content && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Lesson Notes</h2>
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 text-gray-800 leading-relaxed">
            <p>{lesson.content}</p>
          </div>
        </div>
      )}

      {/* ✅ Quiz */}
      {quiz && !isInstructorOrAdmin && (
        <div className="mt-10 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="text-3xl font-bold text-blue-800 mb-4">Quiz: {quiz.title}</h2>
          {quiz.description && <p className="text-blue-700 mb-6">{quiz.description}</p>}

          {quizResults ? (
            <div className="bg-white p-5 rounded-lg shadow-md border border-green-300">
              <h3 className="text-2xl font-bold text-green-700 mb-4">Quiz Results: {quizResults.score}%</h3>
              <p className="text-lg text-gray-800 mb-4">
                You got {quizResults.correctCount} out of {quizResults.totalQuestions} questions correct.
              </p>
              <div className="space-y-4">
                {quizResults.results.map((result, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${result.isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                    <p className="font-semibold text-gray-900 mb-2">Q{index + 1}: {result.questionText}</p>
                    <p className="text-sm text-gray-700">Your Answer: <span className={result.isCorrect ? 'text-green-600' : 'text-red-600 font-bold'}>{result.selectedOption || 'No answer selected'}</span></p>
                    {!result.isCorrect && (
                      <p className="text-sm text-green-600">Correct Answer: <span className="font-bold">{result.correctAnswer}</span></p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
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
                          className="form-radio h-4 w-4 text-blue-600"
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
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 font-semibold text-xl"
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Quiz'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ✅ Bottom buttons */}
      <div className="mt-8 text-center flex justify-center space-x-4">
        <button onClick={() => navigate(`/courses/${courseId}`)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold text-lg">
          Back to Course Overview
        </button>
        {user?.role === 'student' && (
          <button
            onClick={handleMarkAsComplete}
            className={`px-6 py-3 rounded-lg font-semibold text-lg
              ${isLessonCompleted ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}`}
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

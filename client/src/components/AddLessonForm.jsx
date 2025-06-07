// src/components/LessonForm.jsx
import React, { useState, useEffect } from 'react';
import axiosInstance from '../axios/axiosInstance.js'; // Ensure path is correct

// LessonForm component handles both adding and editing lessons, including quiz creation
// It receives:
// - courseId: The ID of the course this lesson belongs to
// - initialData: (Optional) The lesson object if we are editing an existing lesson
// - onSuccess: Callback function to be called after a successful add/edit operation
// - onCancel: Callback function to be called when the user cancels the form (e.g., closes edit mode)
const LessonForm = ({ courseId, initialData = null, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    imageUrl: '', // NEW: Add imageUrl field
    content: '',
    externalUrl: '', // NEW: Add externalUrl field for links to other websites
    order: '',
  });
  // State for quiz data
  const [quizData, setQuizData] = useState({
    quizId: null, // Will be set if editing an existing quiz
    // Ensure this matches your Quiz model's lesson field
    lesson: null, // This will hold the lesson _id if a quiz is associated
    title: '',
    description: '',
    questions: [], // Array of { questionText, options: [], correctAnswer }
  });

  const [submitMessage, setSubmitMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasQuiz, setHasQuiz] = useState(false); // State to toggle quiz section visibility

  // Effect to populate the form when initialData changes (for editing mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        videoUrl: initialData.videoUrl || '',
        imageUrl: initialData.imageUrl || '', // NEW: Populate imageUrl for editing
        content: initialData.content || '',
        externalUrl: initialData.externalUrl || '', // NEW: Populate externalUrl for editing
        order: initialData.order !== undefined ? String(initialData.order) : '',
      });

      // If initialData contains a quiz, fetch it
      if (initialData.quiz) {
        setHasQuiz(true);
        const fetchQuiz = async () => {
          try {
            const response = await axiosInstance.get(`/quizzes/${initialData.quiz}`);
            setQuizData({
              quizId: response.data._id,
              // Match the backend model field 'lesson'
              lesson: response.data.lesson,
              title: response.data.title || '',
              description: response.data.description || '',
              questions: response.data.questions || [],
            });
          } catch (err) {
            console.error('Error fetching quiz for lesson:', err.response?.data?.message || err.message);
            setSubmitMessage({ type: 'error', text: 'Failed to load quiz details.' });
            setHasQuiz(false);
          }
        };
        fetchQuiz();
      } else {
        setHasQuiz(false);
        setQuizData({ quizId: null, lesson: null, title: '', description: '', questions: [] }); // Reset quiz data
      }
    } else {
      // Clear all forms when switching to add new lesson mode
      setFormData({
        title: '', description: '', videoUrl: '', imageUrl: '', content: '', externalUrl: '', order: '',
      });
      setQuizData({ quizId: null, lesson: null, title: '', description: '', questions: [] }); // Reset quiz data
      setHasQuiz(false);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handlers for Quiz section
  const handleQuizChange = (e) => {
    const { name, value } = e.target;
    setQuizData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddQuestion = () => {
    setQuizData((prev) => ({
      ...prev,
      questions: [...prev.questions, { questionText: '', options: ['', ''], correctAnswer: '' }],
    }));
  };

  const handleQuestionChange = (index, e) => {
    const { name, value } = e.target;
    const newQuestions = [...quizData.questions];
    newQuestions[index][name] = value;
    setQuizData((prev) => ({ ...prev, questions: newQuestions }));
  };

  const handleOptionChange = (qIndex, oIndex, e) => {
    const newQuestions = [...quizData.questions];
    newQuestions[qIndex].options[oIndex] = e.target.value;
    setQuizData((prev) => ({ ...prev, questions: newQuestions }));
  };

  const handleAddOption = (qIndex) => {
    const newQuestions = [...quizData.questions];
    newQuestions[qIndex].options.push('');
    setQuizData((prev) => ({ ...prev, questions: newQuestions }));
  };

  const handleRemoveOption = (qIndex, oIndex) => {
    const newQuestions = [...quizData.questions];
    // Check if the removed option was the correct answer for the current question
    if (newQuestions[qIndex].correctAnswer === newQuestions[qIndex].options[oIndex]) {
      newQuestions[qIndex].correctAnswer = ''; // Clear correct answer if it's removed
    }
    newQuestions[qIndex].options.splice(oIndex, 1);
    setQuizData((prev) => ({ ...prev, questions: newQuestions }));
  };

  const handleRemoveQuestion = (index) => {
    const newQuestions = [...quizData.questions];
    newQuestions.splice(index, 1);
    setQuizData((prev) => ({ ...prev, questions: newQuestions }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitMessage(null);
    setLoading(true);

    try {
      // 1. Handle Lesson (Create or Update)
      const lessonPayload = {
        ...formData,
        order: formData.order ? parseInt(formData.order) : 0,
      };

      let lessonResponse;
      if (initialData) {
        lessonResponse = await axiosInstance.put(`/lessons/${initialData._id}`, lessonPayload);
      } else {
        lessonResponse = await axiosInstance.post(`/courses/${courseId}/lessons`, lessonPayload);
      }
      const lesson = lessonResponse.data.lesson || lessonResponse.data; // Get the saved lesson object

      // 2. Handle Quiz (Create, Update, or Delete)
      if (hasQuiz) {
        // Validation for quiz questions
        if (!quizData.title) {
            throw new Error('Quiz title is required.');
        }
        if (quizData.questions.length === 0) {
            throw new Error('Quiz must have at least one question.');
        }
        for (const q of quizData.questions) {
            if (!q.questionText || q.options.length < 2 || !q.correctAnswer) {
                throw new Error('All quiz questions must have text, at least two options, and a correct answer.');
            }
            if (!q.options.includes(q.correctAnswer)) {
                throw new Error(`Correct answer "${q.correctAnswer}" for question "${q.questionText}" is not among its options.`);
            }
        }

        const quizPayload = {
          // Send 'lesson' instead of 'lessonId'
          lesson: lesson._id, // Link quiz to the lesson just saved/updated
          title: quizData.title,
          description: quizData.description,
          questions: quizData.questions,
        };

        if (quizData.quizId) {
          // If editing an existing quiz
          await axiosInstance.put(`/quizzes/${quizData.quizId}`, quizPayload);
          setSubmitMessage({ type: 'success', text: 'Lesson and Quiz updated successfully!' });
        } else {
          // If creating a new quiz for this lesson
          await axiosInstance.post('/quizzes', quizPayload);
          setSubmitMessage({ type: 'success', text: 'Lesson and Quiz created successfully!' });
        }
      } else if (initialData && initialData.quiz) {
        // If hasQuiz is false but a quiz existed, it means the user wants to delete it
        await axiosInstance.delete(`/quizzes/${initialData.quiz}`);
        setSubmitMessage({ type: 'success', text: 'Lesson updated and Quiz deleted successfully!' });
      } else {
        // No quiz actions needed
        setSubmitMessage({ type: 'success', text: initialData ? 'Lesson updated successfully!' : 'Lesson added successfully!' });
      }

      onSuccess(lesson); // Call the success callback passed from the parent component
    } catch (error) {
      setLoading(false); // Ensure loading is off before setting error message
      const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred.';
      setSubmitMessage({ type: 'error', text: `Operation failed: ${errorMessage}` });
      console.error('Error submitting lesson/quiz form:', error.response ? error.response.data : error);
    } finally {
      setLoading(false);
    }
  };


  const formTitle = initialData ? `Edit Lesson: ${initialData.title}` : 'Add a New Lesson';
  const submitButtonText = initialData ? (loading ? 'Updating...' : 'Update Lesson') : (loading ? 'Adding...' : 'Add Lesson');

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-8 border border-purple-200 w-full md:max-w-3xl mx-auto flex flex-col max-h-[90vh]"> {/* Added flex-col and max-h-[90vh] */}
      <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">{formTitle}</h3>

      {submitMessage && (
        <div className={`px-4 py-3 rounded-md mb-4 text-center ${submitMessage.type === 'success' ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}>
          {submitMessage.text}
        </div>
      )}

      {/* This div will now handle the scrolling */}
      <div className="flex-grow overflow-y-auto pr-2 pb-4">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Lesson Basic Details */}
          <div>
            <label htmlFor="lesson-title" className="block text-sm font-medium text-gray-700">Lesson Title</label>
            <input type="text" id="lesson-title" name="title" value={formData.title} onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500" required disabled={loading} />
          </div>
          <div>
            <label htmlFor="lesson-order" className="block text-sm font-medium text-gray-700">Order (e.g., 1, 2, 3)</label>
            <input type="number" id="lesson-order" name="order" value={formData.order} onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500" min="0" disabled={loading} />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="lesson-videoUrl" className="block text-sm font-medium text-gray-700">Video URL (Optional)</label>
            <input type="url" id="lesson-videoUrl" name="videoUrl" value={formData.videoUrl} onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500" disabled={loading} />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="lesson-imageUrl" className="block text-sm font-medium text-gray-700">Image URL (Optional)</label>
            <input type="url" id="lesson-imageUrl" name="imageUrl" value={formData.imageUrl} onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500" disabled={loading} />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="lesson-externalUrl" className="block text-sm font-medium text-gray-700">External Web Page URL (Optional)</label>
            <input type="url" id="lesson-externalUrl" name="externalUrl" value={formData.externalUrl} onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500" disabled={loading} />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="lesson-description" className="block text-sm font-medium text-gray-700">Short Description</label>
            <textarea id="lesson-description" name="description" value={formData.description} onChange={handleChange} rows="2"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500" required disabled={loading}></textarea>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="lesson-content" className="block text-sm font-medium text-gray-700">Lesson Content (Text/Notes - Optional)</label>
            <textarea id="lesson-content" name="content" value={formData.content} onChange={handleChange} rows="4"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500" disabled={loading}></textarea>
          </div>

          {/* Quiz Section Toggle */}
          <div className="md:col-span-2 mt-6 p-4 border border-blue-300 rounded-lg bg-blue-50">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-blue-600 rounded"
                checked={hasQuiz}
                onChange={(e) => setHasQuiz(e.target.checked)}
                disabled={loading}
              />
              <span className="ml-2 text-lg font-semibold text-blue-800">Add/Edit Quiz for this Lesson</span>
            </label>
          </div>

          {/* Quiz Details - Conditionally rendered */}
          {hasQuiz && (
            <div className="md:col-span-2 mt-6 p-6 border border-gray-300 rounded-lg bg-gray-50">
              <h4 className="text-xl font-bold text-gray-800 mb-4">Quiz Details</h4>
              <div className="mb-4">
                <label htmlFor="quiz-title" className="block text-sm font-medium text-gray-700">Quiz Title</label>
                <input type="text" id="quiz-title" name="title" value={quizData.title} onChange={handleQuizChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500" required disabled={loading} />
              </div>
              <div className="mb-4">
                <label htmlFor="quiz-description" className="block text-sm font-medium text-gray-700">Quiz Description (Optional)</label>
                <textarea id="quiz-description" name="description" value={quizData.description} onChange={handleQuizChange} rows="2"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500" disabled={loading}></textarea>
              </div>

              {/* Questions Section */}
              <h5 className="text-lg font-semibold text-gray-800 mb-3">Questions</h5>
              {quizData.questions.length === 0 && (
                <p className="text-gray-600 mb-4">No questions added yet.</p>
              )}
              {quizData.questions.map((q, qIndex) => (
                <div key={qIndex} className="bg-white p-4 rounded-lg shadow-sm mb-4 border border-green-200">
                  <div className="flex justify-between items-center mb-3">
                    <label htmlFor={`question-text-${qIndex}`} className="block text-sm font-medium text-gray-700">Question {qIndex + 1} Text</label>
                    <button type="button" onClick={() => handleRemoveQuestion(qIndex)}
                      className="bg-red-400 text-white px-3 py-1 rounded-md text-sm hover:bg-red-500 transition-colors" disabled={loading}>
                      Remove Question
                    </button>
                  </div>
                  <input type="text" id={`question-text-${qIndex}`} name="questionText" value={q.questionText} onChange={(e) => handleQuestionChange(qIndex, e)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500" required disabled={loading} />

                  <div className="mt-4">
                    <h6 className="text-md font-medium text-gray-700 mb-2">Options</h6>
                    {q.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center mb-2">
                        <input type="text" value={option} onChange={(e) => handleOptionChange(qIndex, oIndex, e)}
                          className="flex-1 border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500 mr-2" required disabled={loading} />
                        {q.options.length > 2 && (
                          <button type="button" onClick={() => handleRemoveOption(qIndex, oIndex)}
                            className="text-red-500 hover:text-red-700 transition-colors" disabled={loading}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 11-2 0v6a1 1 0 112 0V8z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => handleAddOption(qIndex)}
                      className="mt-2 bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 transition-colors" disabled={loading}>
                      Add Option
                    </button>
                  </div>

                  <div className="mt-4">
                    <label htmlFor={`correct-answer-${qIndex}`} className="block text-sm font-medium text-gray-700">Correct Answer</label>
                    <select id={`correct-answer-${qIndex}`} name="correctAnswer" value={q.correctAnswer} onChange={(e) => handleQuestionChange(qIndex, e)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-green-500 focus:border-green-500" required disabled={loading}>
                      <option value="">Select Correct Option</option>
                      {q.options.map((option, oIndex) => (
                        <option key={oIndex} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
              <button type="button" onClick={handleAddQuestion}
                className="mt-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200" disabled={loading}>
                Add New Question
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Form Action Buttons - These will stay visible at the bottom */}
      <div className="md:col-span-2 flex justify-center space-x-4 mt-6 flex-shrink-0"> {/* Added flex-shrink-0 */}
        <button type="submit"
          onClick={handleSubmit} // Moved handleSubmit to onClick for the button, not the form.
          className="bg-purple-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-purple-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 font-semibold text-lg"
          disabled={loading}>
          {submitButtonText}
        </button>
        {initialData && ( // Show cancel button only in edit mode
          <button type="button" onClick={onCancel}
            className="bg-gray-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 font-semibold text-lg"
            disabled={loading}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default LessonForm;

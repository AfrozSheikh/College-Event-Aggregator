import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const DynamicFeedbackForm = () => {
  const { id: eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [feedbackForm, setFeedbackForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    fetchFeedbackForm();
    checkSubmissionStatus();
  }, [eventId, user]);

  const fetchFeedbackForm = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/feedback-forms/event/${eventId}`);
      setFeedbackForm(response.data);
      
      // Initialize answers object
      const initialAnswers = {};
      response.data.questions.forEach(q => {
        initialAnswers[q.id] = q.question_type === 'rating' ? 5 : '';
      });
      setAnswers(initialAnswers);
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error('No feedback form found for this event');
        navigate(`/events/${eventId}`);
      } else {
        toast.error('Failed to load feedback form');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkSubmissionStatus = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get(
        `http://localhost:5000/api/feedback-forms/check/${eventId}/${user.id}`
      );
      setHasSubmitted(response.data.hasSubmitted);
    } catch (error) {
      console.error('Error checking submission status:', error);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers({
      ...answers,
      [questionId]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required questions
    const requiredQuestions = feedbackForm.questions.filter(q => q.is_required);
    const missingAnswers = requiredQuestions.filter(q => !answers[q.id] || answers[q.id].toString().trim() === '');
    
    if (missingAnswers.length > 0) {
      toast.error('Please answer all required questions');
      return;
    }

    setSubmitting(true);

    try {
      const formattedAnswers = feedbackForm.questions.map(q => ({
        questionId: q.id,
        answerText: answers[q.id]?.toString() || ''
      }));

      await axios.post('http://localhost:5000/api/feedback-forms/responses', {
        formId: feedbackForm.id,
        eventId,
        studentId: user.id,
        answers: formattedAnswers
      });

      toast.success('Thank you for your feedback!');
      navigate('/student');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question) => {
    switch (question.question_type) {
      case 'text':
        return (
          <input
            type="text"
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required={question.is_required}
            placeholder="Your answer..."
          />
        );

      case 'textarea':
        return (
          <textarea
            rows={4}
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required={question.is_required}
            placeholder="Your answer..."
          />
        );

      case 'rating':
        return (
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => handleAnswerChange(question.id, star)}
                className="text-4xl focus:outline-none transition-colors"
              >
                {star <= (answers[question.id] || 5) ? '★' : '☆'}
              </button>
            ))}
            <span className="text-2xl font-bold text-gray-700 ml-4">
              {answers[question.id] || 5}/5
            </span>
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {question.options && question.options.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={answers[question.id] === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  required={question.is_required}
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading feedback form...</div>
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Feedback Already Submitted</h2>
            <p className="text-gray-600 mb-6">You have already submitted feedback for this event.</p>
            <button
              onClick={() => navigate('/student')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!feedbackForm) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {feedbackForm.title}
            </h1>
            {feedbackForm.description && (
              <p className="text-gray-600">{feedbackForm.description}</p>
            )}
            {feedbackForm.is_mandatory && (
              <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ This feedback form is mandatory
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {feedbackForm.questions.map((question, index) => (
              <div key={question.id} className="space-y-3">
                <label className="block text-lg font-semibold text-gray-800">
                  {index + 1}. {question.question_text}
                  {question.is_required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderQuestion(question)}
              </div>
            ))}

            <div className="pt-6 border-t border-gray-200">
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DynamicFeedbackForm;

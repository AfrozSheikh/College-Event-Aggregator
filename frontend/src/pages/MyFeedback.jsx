import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const MyFeedback = () => {
  const { user } = useAuth();
  const [feedbackList, setFeedbackList] = useState([]);
  const [dynamicFeedbackList, setDynamicFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'student') {
      fetchFeedback();
    }
  }, [user]);

  const fetchFeedback = async () => {
    try {
      console.log('Fetching feedback for user ID:', user.id);
      
      // Fetch legacy feedback
      const legacyResponse = await axios.get(`http://localhost:5000/api/feedback/user/${user.id}`);
      console.log('Legacy feedback API response:', legacyResponse.data);
      setFeedbackList(legacyResponse.data);
      
      // Fetch dynamic feedback responses - we need to get user's registrations first
      try {
        const registrationsResponse = await axios.get(`http://localhost:5000/api/participations/student/${user.id}`);
        const registrations = registrationsResponse.data;
        
        // For each registration, check if there's a dynamic feedback response
        const dynamicResponses = [];
        for (const reg of registrations) {
          try {
            const formResponse = await axios.get(`http://localhost:5000/api/feedback-forms/event/${reg.event_id}`);
            const form = formResponse.data;
            
            // Check if student submitted response
            const responsesResponse = await axios.get(`http://localhost:5000/api/feedback-forms/${form.id}/responses`);
            const userResponse = responsesResponse.data.find(r => r.student_id === user.id);
            
            if (userResponse) {
              dynamicResponses.push({
                ...userResponse,
                event_title: reg.event_title,
                event_date: reg.event_date,
                event_id: reg.event_id,
                form_title: form.title
              });
            }
          } catch (error) {
            // No dynamic feedback form for this event or not submitted
            continue;
          }
        }
        
        setDynamicFeedbackList(dynamicResponses);
      } catch (error) {
        console.error('Failed to load dynamic feedback:', error);
      }
      
    } catch (error) {
      console.error('Failed to load feedback:', error);
      toast.error('Failed to load feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your feedback...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Feedback</h1>
          <p className="text-gray-600">View all feedback you've submitted</p>
        </div>

        {feedbackList.length === 0 && dynamicFeedbackList.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback submitted yet</h3>
            <p className="text-gray-500 mb-6">Submit feedback for past events you've attended</p>
            <Link
              to="/events?type=past"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              View Past Events
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Dynamic Feedback Responses */}
            {dynamicFeedbackList.map(feedback => (
              <div key={feedback.id} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">
                        {feedback.event_title || 'Event'}
                      </h3>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        Dynamic Form
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{feedback.event_date ? new Date(feedback.event_date).toLocaleDateString() : 'Date not available'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-gray-700 mb-3">{feedback.form_title}</h4>
                  <div className="space-y-3">
                    {feedback.answers?.map((answer, index) => (
                      <div key={answer.id} className="border-l-2 border-blue-400 pl-3">
                        <p className="text-sm font-medium text-gray-700">{answer.question_text}</p>
                        <p className="text-gray-600 mt-1">{answer.answer_text || 'No answer provided'}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-500">
                    Submitted: {new Date(feedback.submitted_at).toLocaleDateString()}
                  </span>
                  {feedback.event_id && (
                    <Link
                      to={`/events/${feedback.event_id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Event →
                    </Link>
                  )}
                </div>
              </div>
            ))}
            
            {/* Legacy Feedback */}
            {feedbackList.map(feedback => (
              <div key={feedback.id} className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                <div className="flex flex-col md:flex-row justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">
                        {feedback.event_title || 'Event'}
                      </h3>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                        Legacy
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{feedback.event_date ? new Date(feedback.event_date).toLocaleDateString() : 'Date not available'}</span>
                    </div>
                    {feedback.location && (
                      <div className="flex items-center text-gray-600 mt-1">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{feedback.location}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center mt-2 md:mt-0">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="text-2xl text-yellow-400">
                          {i < feedback.rating ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                    <span className="ml-2 font-bold text-gray-700">{feedback.rating}/5</span>
                  </div>
                </div>
                
                {feedback.comment && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-700 mb-2">Your Comment:</h4>
                    <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                      {feedback.comment}
                    </p>
                  </div>
                )}
                
                {feedback.suggestions && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-700 mb-2">Your Suggestions:</h4>
                    <p className="text-gray-600 bg-blue-50 p-4 rounded-lg">
                      {feedback.suggestions}
                    </p>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-500">
                    Submitted: {new Date(feedback.submitted_at).toLocaleDateString()}
                  </span>
                  {feedback.event_id && (
                    <Link
                      to={`/events/${feedback.event_id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Event →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyFeedback;
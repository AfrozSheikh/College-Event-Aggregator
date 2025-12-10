import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const FeedbackForm = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, []);

  const fetchEvent = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/events/${id}`);
      setEvent(response.data);
      
      // Check if event is past
      const eventDate = new Date(response.data.event_date);
      const today = new Date();
      if (eventDate > today) {
        toast.error('Feedback can only be submitted for past events');
        navigate(`/events/${id}`);
      }
    } catch (error) {
      toast.error('Failed to load event');
      navigate('/events');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/feedback', {
        eventId: id,
        studentId: user.id,
        rating,
        comment,
        suggestions
      });
      
      toast.success('Thank you for your feedback!');
      navigate(`/events/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  if (!event) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Submit Feedback: {event.title}
            </h1>
            <p className="text-gray-600">
              Your feedback helps us improve future events
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Rating */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Overall Rating</h2>
              
              <div className="flex items-center space-x-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-4xl focus:outline-none"
                  >
                    {star <= rating ? '★' : '☆'}
                  </button>
                ))}
                <span className="text-2xl font-bold text-gray-700 ml-4">{rating}/5</span>
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-4">
              <label className="block text-xl font-semibold text-gray-800">
                Your Comments *
              </label>
              <textarea
                required
                rows={6}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Share your experience at the event..."
              />
            </div>

            {/* Suggestions */}
            <div className="space-y-4">
              <label className="block text-xl font-semibold text-gray-800">
                Suggestions for Improvement
              </label>
              <textarea
                rows={4}
                value={suggestions}
                onChange={(e) => setSuggestions(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Any suggestions for making future events better..."
              />
            </div>

            {/* Submit */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackForm;
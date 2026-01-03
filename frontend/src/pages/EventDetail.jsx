import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const EventDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [participations, setParticipations] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [isRegistered, setIsRegistered] = useState(false);
const [hasGivenFeedback, setHasGivenFeedback] = useState(false);
  // useEffect(() => {
  //   fetchEventData();
  // }, [id]);
  const checkRegistrationStatus = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/participations/check/${id}/${user.id}`);
      setIsRegistered(response.data.isRegistered);
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  };
  
  const checkFeedbackStatus = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/feedback/check/${id}/${user.id}`);
      setHasGivenFeedback(response.data.hasGivenFeedback);
    } catch (error) {
      console.error('Error checking feedback status:', error);
    }
  };

  useEffect(() => {
    fetchEventData();
    
    if (user?.role === 'student') {
      checkRegistrationStatus();
      checkFeedbackStatus();
    }
  }, [id, user]);

  const fetchEventData = async () => {
    try {
      const [eventRes, participationsRes, feedbackRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/events/${id}`),
        user?.role === 'admin' ? axios.get(`http://localhost:5000/api/participations/event/${id}`) : Promise.resolve({ data: [] }),
        axios.get(`http://localhost:5000/api/feedback/event/${id}`)
      ]);
      
      setEvent(eventRes.data);
      setParticipations(participationsRes.data);
      setFeedback(feedbackRes.data.feedback || []);
    } catch (error) {
      toast.error('Failed to load event details');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/events/${id}`);
      toast.success('Event deleted successfully');
      navigate(user?.role === 'admin' ? '/admin' : '/faculty');
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const generateReport = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/reports/event/${id}`);
      toast.success('Report generated successfully');
      // Open report in new tab
      window.open(`http://localhost:5000${response.data.downloadUrl}`, '_blank');
    } catch (error) {
      toast.error('Failed to generate report');
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;
  if (!event) return <div>Event not found</div>;

  const isPastEvent = new Date(event.event_date) < new Date();
  const canRegister = user?.role === 'student' && !isPastEvent;
  const canGiveFeedback = user?.role === 'student' && isPastEvent;
  const canManage = user?.role === 'admin' || (user?.role === 'faculty' && user.id === event.created_by);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{event.title}</h1>
              <div className="flex flex-wrap gap-3 items-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isPastEvent ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                }`}>
                  {isPastEvent ? 'Past Event' : 'Upcoming Event'}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                  {event.category}
                </span>
                {event.registration_fees > 0 && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    ₹{event.registration_fees} Fees
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
              {/* {canRegister && (
                <Link
                  to={`/events/${id}/participate`}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Register Now
                </Link>
              )} */}
              {canRegister && (
  <Link
  to={`/events/${id}/participate`}
  className={`px-6 py-3 rounded-lg font-medium transition ${
    isRegistered
      ? 'bg-gray-400 text-white cursor-not-allowed'
      : 'bg-green-600 text-white hover:bg-green-700'
  }`}
  onClick={e => {
    if (isRegistered) {
      e.preventDefault();
      toast.error('You are already registered for this event');
    }
  }}
>
  {isRegistered ? 'Already Registered' : 'Register Now'}
</Link>
)}
              
              {/* {canGiveFeedback && (
                <Link
                  to={`/events/${id}/feedback`}
                  className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium"
                >
                  Give Feedback
                </Link>
              )} */}
              {canGiveFeedback && (
  <Link
    to={`/events/${id}/feedback`}
    className={`px-6 py-3 rounded-lg font-medium transition ${
      hasGivenFeedback
        ? 'bg-gray-400 text-white cursor-not-allowed'
        : 'bg-yellow-600 text-white hover:bg-yellow-700'
    }`}
    onClick={e => {
      if (hasGivenFeedback) {
        e.preventDefault();
        toast.error('You have already submitted feedback for this event');
      }
    }}
  >
    {hasGivenFeedback ? 'Feedback Submitted' : 'Give Feedback'}
  </Link>
)}
              
              {user?.role === 'admin' && (
                <button
                  onClick={generateReport}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  Generate Report
                </button>
              )}
              
              {canManage && (
                <>
                  <Link
                    to={`/edit-event/${id}`}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Edit Event
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                  >
                    Delete Event
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-semibold">{format(new Date(event.event_date), 'MMMM dd, yyyy')}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Time</p>
              <p className="font-semibold">{event.event_time}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-semibold">{event.location}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Organizer</p>
              <p className="font-semibold">{event.organized_by || event.organizer_name}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('details')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Event Details
              </button>
              
              <button
                onClick={() => setActiveTab('gallery')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'gallery'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Gallery ({event.images?.length || 0})
              </button>
              
              {user?.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('participants')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'participants'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Participants ({participations.length})
                </button>
              )}
              
              <button
                onClick={() => setActiveTab('feedback')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'feedback'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Feedback ({feedback.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Description</h3>
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-line">{event.description}</p>
                </div>
              </div>
              
              {event.rules_eligibility && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Rules & Eligibility</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-line">{event.rules_eligibility}</p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Event Information</h3>
                  <ul className="space-y-2">
                    <li className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Maximum Participants</span>
                      <span className="font-medium">{event.max_participants || 'Unlimited'}</span>
                    </li>
                    <li className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Registration Fees</span>
                      <span className="font-medium">₹{event.registration_fees || 0}</span>
                    </li>
                    <li className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Created By</span>
                      <span className="font-medium">{event.organizer_name || 'N/A'}</span>
                    </li>
                  </ul>
                </div>
                
                {user?.role === 'admin' && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">Quick Stats</h3>
                    <ul className="space-y-2">
                      <li className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Total Registrations</span>
                        <span className="font-medium">{participations.length}</span>
                      </li>
                      <li className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Total Feedback</span>
                        <span className="font-medium">{feedback.length}</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'gallery' && (
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-6">Event Gallery</h3>
              {event.images && event.images.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {event.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={`http://localhost:5000/${image.image_path}`}
                        alt={`${event.title} - Image ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                          onClick={() => window.open(`http://localhost:5000/${image.image_path}`, '_blank')}
                          className="px-4 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition"
                        >
                          View Full
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No images available for this event</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'participants' && user?.role === 'admin' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Event Participants</h3>
                <span className="text-gray-600">{participations.length} registrations</span>
              </div>
              
              {participations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          College
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Course/Year
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registered On
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {participations.map((participation) => (
                        <tr key={participation.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{participation.name}</div>
                            <div className="text-sm text-gray-500">{participation.phone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {participation.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {participation.college}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {participation.course_year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(participation.registered_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No participants yet</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'feedback' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Event Feedback</h3>
                <div className="flex items-center">
                  <span className="text-gray-600 mr-3">{feedback.length} reviews</span>
                  {feedback.length > 0 && (
                    <div className="flex items-center">
                      <span className="text-yellow-400 text-xl">★</span>
                      <span className="ml-1 font-semibold">
                        {feedback.reduce((acc, fb) => acc + fb.rating, 0) / feedback.length}/5
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {feedback.length > 0 ? (
                <div className="space-y-6">
                  {feedback.map((fb) => (
                    <div key={fb.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-semibold text-gray-800">{fb.student_name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(fb.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <span className="text-yellow-400">★</span>
                          <span className="ml-1 font-medium">{fb.rating}/5</span>
                        </div>
                      </div>
                      
                      {fb.comment && (
                        <p className="text-gray-700 mb-4">{fb.comment}</p>
                      )}
                      
                      {fb.suggestions && (
                        <div className="bg-blue-50 border border-blue-100 rounded p-4">
                          <p className="text-sm font-medium text-blue-800 mb-1">Suggestions:</p>
                          <p className="text-blue-700">{fb.suggestions}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No feedback yet</p>
                  {isPastEvent && user?.role === 'student' && (
                    <Link
                      to={`/events/${id}/feedback`}
                      className="mt-4 inline-block px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                    >
                      Be the first to give feedback
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
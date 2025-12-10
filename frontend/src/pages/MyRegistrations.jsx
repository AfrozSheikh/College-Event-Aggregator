import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const MyRegistrations = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      // Note: You'll need to create an endpoint for this
      // For now, we'll fetch all events and filter by date
      const eventsRes = await axios.get('http://localhost:5000/api/events');
      const participationsRes = await axios.get('http://localhost:5000/api/participations/event/all');
      
      // Filter participations for this student
      const studentParticipations = participationsRes.data.filter(p => p.student_id === user?.id);
      
      // Map participations with event details
      const registrationsWithDetails = studentParticipations.map(participation => {
        const event = eventsRes.data.find(e => e.id === participation.event_id);
        return {
          ...participation,
          event: event || {}
        };
      });
      
      setRegistrations(registrationsWithDetails);
    } catch (error) {
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Event Registrations</h1>
        <p className="text-gray-600">Track all your event participations</p>
      </div>

      {registrations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No registrations yet</h3>
          <p className="text-gray-500 mb-6">You haven't registered for any events yet</p>
          <Link
            to="/events"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Browse Events
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {registrations.map(reg => (
            <div key={reg.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="md:flex">
                {reg.event.images && reg.event.images.length > 0 ? (
                  <div className="md:w-1/4 h-48 md:h-auto">
                    <img
                      src={`http://localhost:5000/${reg.event.images[0].image_path}`}
                      alt={reg.event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="md:w-1/4 h-48 md:h-auto bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                    <span className="text-gray-400">No Image</span>
                  </div>
                )}
                
                <div className="md:w-3/4 p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">{reg.event.title}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full capitalize">
                          {reg.event.category}
                        </span>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                          {new Date(reg.event.event_date).toLocaleDateString()}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          new Date(reg.event.event_date) >= new Date()
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {new Date(reg.event.event_date) >= new Date() ? 'Upcoming' : 'Completed'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 md:mt-0">
                      <span className="text-sm text-gray-500">
                        Registered: {new Date(reg.registered_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Location</p>
                      <p className="font-medium">{reg.event.location}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Organizer</p>
                      <p className="font-medium">{reg.event.organized_by}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <Link
                      to={`/events/${reg.event_id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      View Event
                    </Link>
                    
                    {new Date(reg.event.event_date) < new Date() && (
                      <Link
                        to={`/events/${reg.event_id}/feedback`}
                        className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                      >
                        Give Feedback
                      </Link>
                    )}
                    
                    {reg.document_path && (
                      <a
                        href={`http://localhost:5000/${reg.document_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                      >
                        View Uploaded Document
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyRegistrations;
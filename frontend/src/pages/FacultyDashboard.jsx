import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  CalendarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const FacultyDashboard = ({ view = 'dashboard' }) => {
  const { user, logout } = useAuth();
  const [myEvents, setMyEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    myEvents: 0,
    totalParticipants: 0,
    upcomingEvents: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eventsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/events')
      ]);
      
      const allEventsData = eventsRes.data;
      setAllEvents(allEventsData);
      
      // Filter events created by this faculty
      const facultyEvents = allEventsData.filter(event => event.created_by === user?.id);
      setMyEvents(facultyEvents);
      
      // Calculate stats
      setStats({
        myEvents: facultyEvents.length,
        totalParticipants: 0, // Would need additional API
        upcomingEvents: facultyEvents.filter(e => new Date(e.event_date) >= new Date()).length
      });
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/events/${eventId}`);
      toast.success('Event deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  if (view === 'events') {
    return (
      <div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Events</h1>
          <Link
            to="/create-event"
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create New Event
          </Link>
        </div>

        {myEvents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <CalendarIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events created yet</h3>
            <p className="text-gray-500 mb-6">Create your first event to get started</p>
            <Link
              to="/create-event"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myEvents.map(event => (
              <div key={event.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition">
                {event.images && event.images.length > 0 ? (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={`http://localhost:5000/${event.images[0].image_path}`}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                    <CalendarIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}

                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-bold text-gray-800">{event.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      new Date(event.event_date) >= new Date()
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {new Date(event.event_date) >= new Date() ? 'Upcoming' : 'Past'}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>

                  <div className="space-y-2 mb-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {new Date(event.event_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <UserGroupIcon className="h-4 w-4 mr-2" />
                      {event.location}
                    </div>
                    <div className="capitalize">
                      Category: {event.category}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Link
                      to={`/events/${event.id}`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      View Details
                    </Link>
                    <div className="flex space-x-2">
                      <Link
                        to={`/edit-event/${event.id}`}
                        className="p-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Faculty Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user?.name}! Manage your events and track participation.</p>
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <p className="text-sm text-blue-600">Department</p>
            <p className="font-semibold">{user?.department}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <p className="text-sm text-green-600">Faculty ID</p>
            <p className="font-semibold">{user?.faculty_id}</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
            <p className="text-sm text-purple-600">Status</p>
            <p className="font-semibold capitalize">{user?.status}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <CalendarIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">My Events</p>
              <p className="text-2xl font-bold">{stats.myEvents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <UserGroupIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Total Participants</p>
              <p className="text-2xl font-bold">{stats.totalParticipants}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <ChartBarIcon className="h-8 w-8" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Upcoming Events</p>
              <p className="text-2xl font-bold">{stats.upcomingEvents}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Recent Events */}
        <div className="bg-white rounded-xl shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">My Recent Events</h2>
            <Link to="/faculty/my-events" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All →
            </Link>
          </div>
          <div className="p-6">
            {myEvents.slice(0, 3).length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-4">No events created yet</p>
                <Link
                  to="/create-event"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create First Event
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myEvents.slice(0, 3).map(event => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-800">{event.title}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(event.event_date).toLocaleDateString()} • {event.category}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        new Date(event.event_date) >= new Date()
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {new Date(event.event_date) >= new Date() ? 'Upcoming' : 'Past'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <Link
                to="/create-event"
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition group"
              >
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-4">
                    <PlusIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Create New Event</h3>
                    <p className="text-sm text-gray-500">Organize a new college event</p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-gray-600">→</span>
              </Link>

              <Link
                to="/events"
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition group"
              >
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-green-100 text-green-600 mr-4">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Browse All Events</h3>
                    <p className="text-sm text-gray-500">View all college events</p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-gray-600">→</span>
              </Link>

              <Link
                to="/gallery"
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition group"
              >
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-purple-100 text-purple-600 mr-4">
                    <UserGroupIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800">Event Gallery</h3>
                    <p className="text-sm text-gray-500">View photos from past events</p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-gray-600">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
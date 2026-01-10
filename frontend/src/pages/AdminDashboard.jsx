import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  UsersIcon,
  CalendarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [pendingFaculty, setPendingFaculty] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalStudents: 0,
    totalFaculty: 0,
    totalParticipants: 0,
    pendingFaculty: 0,
    recentEvents: 0,
    upcomingEvents: 0,
    totalFeedback: 0,
    monthlyRegistrations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch all data in parallel
      const [facultyRes, eventsRes, statsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/users/pending'),
        axios.get('http://localhost:5000/api/events'),
        axios.get('http://localhost:5000/api/stats/dashboard') // ✅ Use real stats endpoint
      ]);
      
      setPendingFaculty(facultyRes.data);
      setEvents(eventsRes.data.slice(0, 5));
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const approveFaculty = async (facultyId) => {
    try {
      await axios.put(`http://localhost:5000/api/users/${facultyId}/approve`);
      toast.success('Faculty approved successfully');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      toast.error('Failed to approve faculty');
    }
  };

  const rejectFaculty = async (facultyId) => {
    try {
      await axios.delete(`http://localhost:5000/api/users/${facultyId}`);
      toast.success('Faculty rejected');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      toast.error('Failed to reject faculty');
    }
  };
  
  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${eventTitle}"?`)) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/events/${eventId}`);
      toast.success('Event deleted successfully');
      fetchDashboardData(); // Refresh data
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <button
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Events */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <CalendarIcon className="h-8 w-8" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Events</p>
                <p className="text-2xl font-bold">{stats.totalEvents}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {stats.recentEvents} new in 7 days
                </p>
              </div>
            </div>
          </div>

          {/* Total Students */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <UsersIcon className="h-8 w-8" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
              </div>
            </div>
          </div>

          {/* Total Faculty */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <UserGroupIcon className="h-8 w-8" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Faculty</p>
                <p className="text-2xl font-bold">{stats.totalFaculty}</p>
                <p className="text-xs text-red-500 mt-1">
                  {stats.pendingFaculty} pending approval
                </p>
              </div>
            </div>
          </div>

          {/* Total Participants */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <ChartBarIcon className="h-8 w-8" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Participants</p>
                <p className="text-2xl font-bold">{stats.totalParticipants}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {stats.monthlyRegistrations} this month
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Upcoming Events */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                <ClockIcon className="h-8 w-8" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Upcoming Events</p>
                <p className="text-2xl font-bold">{stats.upcomingEvents}</p>
              </div>
            </div>
          </div>

          {/* Total Feedback */}
          {/* <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-pink-100 text-pink-600">
                <ChatBubbleLeftRightIcon className="h-8 w-8" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Feedback</p>
                <p className="text-2xl font-bold">{stats.totalFeedback}</p>
              </div>
            </div>
          </div> */}

          {/* Growth Indicator */}
          {/* <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-teal-100 text-teal-600">
                <ArrowTrendingUpIcon className="h-8 w-8" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">System Health</p>
                <p className="text-2xl font-bold text-green-600">Active</p>
              </div>
            </div>
          </div> */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Faculty Approvals */}
          <div className="bg-white rounded-xl shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Pending Faculty Approvals</h2>
              <p className="text-sm text-gray-500">{stats.pendingFaculty} pending</p>
            </div>
            <div className="p-6">
              {pendingFaculty.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No pending approvals</p>
              ) : (
                <div className="space-y-4">
                  {pendingFaculty.map(faculty => (
                    <div key={faculty.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-medium">{faculty.name}</h3>
                        <p className="text-sm text-gray-500">{faculty.email}</p>
                        <p className="text-sm text-gray-500">{faculty.department}</p>
                        <p className="text-xs text-gray-400">
                          Applied: {new Date(faculty.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => approveFaculty(faculty.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center"
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => rejectFaculty(faculty.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center"
                        >
                          <XCircleIcon className="h-4 w-4 mr-1" />
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Events */}
          <div className="bg-white rounded-xl shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Recent Events</h2>
                <p className="text-sm text-gray-500">{events.length} shown</p>
              </div>
              <Link to="/create-event" className="text-blue-600 hover:text-blue-800 font-medium">
                + Create Event
              </Link>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {events.map(event => {
                  const isPastEvent = new Date(event.event_date) < new Date();
                  
                  return (
                    <div
                      key={event.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex justify-between items-start">
                        <Link to={`/events/${event.id}`} className="flex-1">
                          <div>
                            <h3 className="font-medium text-gray-800">{event.title}</h3>
                            <p className="text-sm text-gray-500">
                              {new Date(event.event_date).toLocaleDateString()} • {event.location}
                            </p>
                          </div>
                        </Link>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            isPastEvent
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {isPastEvent ? 'Past' : 'Upcoming'}
                          </span>
                          {isPastEvent && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                handleDeleteEvent(event.id, event.title);
                              }}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link
              to="/events"
              className="p-4 border rounded-lg hover:bg-gray-50 transition text-center"
            >
              <DocumentTextIcon className="h-8 w-8 mx-auto text-gray-600 mb-2" />
              <span className="font-medium">Manage All Events</span>
            </Link>
            
            <Link
              to="/admin/users"
              className="p-4 border rounded-lg hover:bg-gray-50 transition text-center"
            >
              <UsersIcon className="h-8 w-8 mx-auto text-gray-600 mb-2" />
              <span className="font-medium">User Management</span>
            </Link>
            
            <Link
              to="/gallery"
              className="p-4 border rounded-lg hover:bg-gray-50 transition text-center"
            >
              <CalendarIcon className="h-8 w-8 mx-auto text-gray-600 mb-2" />
              <span className="font-medium">Event Gallery</span>
            </Link>
            
            <Link
              to="/admin/reports"
              className="p-4 border rounded-lg hover:bg-gray-50 transition text-center"
            >
              <ChartBarIcon className="h-8 w-8 mx-auto text-gray-600 mb-2" />
              <span className="font-medium">View Reports</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
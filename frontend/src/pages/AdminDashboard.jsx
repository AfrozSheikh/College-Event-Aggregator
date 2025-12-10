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
  XCircleIcon
} from '@heroicons/react/24/outline';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [pendingFaculty, setPendingFaculty] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalStudents: 0,
    totalFaculty: 0,
    totalParticipants: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch pending faculty
      const facultyRes = await axios.get('http://localhost:5000/api/users/pending');
      setPendingFaculty(facultyRes.data);

      // Fetch events
      const eventsRes = await axios.get('http://localhost:5000/api/events');
      setEvents(eventsRes.data.slice(0, 5));

      // Fetch stats (you'd need to create this endpoint)
      // const statsRes = await axios.get('http://localhost:5000/api/stats');
      // setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    }
  };

  const approveFaculty = async (facultyId) => {
    try {
      await axios.put(`http://localhost:5000/api/users/${facultyId}/approve`);
      toast.success('Faculty approved successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to approve faculty');
    }
  };

  const rejectFaculty = async (facultyId) => {
    try {
      await axios.delete(`http://localhost:5000/api/users/${facultyId}`);
      toast.success('Faculty rejected');
      fetchDashboardData();
    } catch (error) {
      toast.error('Failed to reject faculty');
    }
  };

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <CalendarIcon className="h-8 w-8" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Events</p>
                <p className="text-2xl font-bold">{stats.totalEvents}</p>
              </div>
            </div>
          </div>

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

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <UsersIcon className="h-8 w-8" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Faculty</p>
                <p className="text-2xl font-bold">{stats.totalFaculty}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <ChartBarIcon className="h-8 w-8" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Participants</p>
                <p className="text-2xl font-bold">{stats.totalParticipants}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Faculty Approvals */}
          <div className="bg-white rounded-xl shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Pending Faculty Approvals</h2>
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
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => approveFaculty(faculty.id)}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                        >
                          <CheckCircleIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => rejectFaculty(faculty.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                        >
                          <XCircleIcon className="h-5 w-5" />
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
              <h2 className="text-xl font-semibold text-gray-800">Recent Events</h2>
              <Link to="/create-event" className="text-blue-600 hover:text-blue-800 font-medium">
                + Create Event
              </Link>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {events.map(event => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="block p-4 border rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-800">{event.title}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(event.event_date).toLocaleDateString()} • {event.location}
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
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/events"
              className="p-4 border rounded-lg hover:bg-gray-50 transition text-center"
            >
              <DocumentTextIcon className="h-8 w-8 mx-auto text-gray-600 mb-2" />
              <span className="font-medium">Manage All Events</span>
            </Link>
            <Link
              to="/gallery"
              className="p-4 border rounded-lg hover:bg-gray-50 transition text-center"
            >
              <CalendarIcon className="h-8 w-8 mx-auto text-gray-600 mb-2" />
              <span className="font-medium">Event Gallery</span>
            </Link>
            <button className="p-4 border rounded-lg hover:bg-gray-50 transition">
              <ChartBarIcon className="h-8 w-8 mx-auto text-gray-600 mb-2" />
              <span className="font-medium">View Reports</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
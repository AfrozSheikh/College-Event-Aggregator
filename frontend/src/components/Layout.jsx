import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  CalendarIcon,
  PhotoIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminNav = [
    { name: 'Dashboard', path: '/admin', icon: HomeIcon },
    { name: 'All Events', path: '/events', icon: CalendarIcon },
    { name: 'Create Event', path: '/create-event', icon: CalendarIcon },
    { name: 'User Management', path: '/admin/users', icon: UserGroupIcon },
    { name: 'Reports', path: '/admin/reports', icon: ChartBarIcon },
    { name: 'Gallery', path: '/gallery', icon: PhotoIcon },
  ];

  const facultyNav = [
    { name: 'Dashboard', path: '/faculty', icon: HomeIcon },
    { name: 'All Events', path: '/events', icon: CalendarIcon },
    { name: 'Create Event', path: '/create-event', icon: CalendarIcon },
    { name: 'My Events', path: '/faculty/my-events', icon: DocumentTextIcon },
    { name: 'Gallery', path: '/gallery', icon: PhotoIcon },
  ];

  const studentNav = [
    { name: 'Dashboard', path: '/student', icon: HomeIcon },
    { name: 'All Events', path: '/events', icon: CalendarIcon },
    { name: 'My Registrations', path: '/student/my-registrations', icon: DocumentTextIcon },
    { name: 'My Feedback', path: '/student/my-feedback', icon: DocumentTextIcon },
    { name: 'Gallery', path: '/gallery', icon: PhotoIcon },
  ];

  const getNavItems = () => {
    switch (user?.role) {
      case 'admin': return adminNav;
      case 'faculty': return facultyNav;
      case 'student': return studentNav;
      default: return [];
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-gray-900">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4 mb-8">
              <h1 className="text-xl font-bold text-white">College Event Aggregator</h1>
            </div>
            <nav className="flex-1 px-2 space-y-1">
              {getNavItems().map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition ${
                      isActive
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-6 w-6 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-700 p-4">
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs font-medium text-gray-300 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="ml-auto text-gray-300 hover:text-white"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden bg-gray-900 text-white">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold">College Event Aggregator</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm">{user?.name}</span>
            <button onClick={handleLogout} className="p-1">
              <ArrowRightOnRectangleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
        <nav className="flex overflow-x-auto py-2 px-4 space-x-4">
          {getNavItems().map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                location.pathname === item.path
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="md:pl-64">
        <main className="py-6">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
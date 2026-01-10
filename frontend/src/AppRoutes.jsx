import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';
import EventsPage from './pages/EventsPage';
import EventDetail from './pages/EventDetail';
import EventForm from './pages/EventForm';
import ParticipationForm from './pages/ParticipationForm';
import FeedbackForm from './pages/FeedbackForm';
import Gallery from './pages/Gallery';
import ReportViewer from './pages/ReportViewer';
import UserManagement from './pages/UserManagement';
import MyRegistrations from './pages/MyRegistrations';
import EventParticipants from './pages/EventParticipants';
import DynamicFeedbackForm from './components/DynamicFeedbackForm';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import MyFeedback from './pages/MyFeedback';

function AppRoutes() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // ✅ Redirect logged-in users away from login/signup
  useEffect(() => {
    if (user && (location.pathname === '/login' || location.pathname === '/signup')) {
      if (user.role === 'admin') window.location.href = '/admin';
      if (user.role === 'faculty') window.location.href = '/faculty';
      if (user.role === 'student') window.location.href = '/student';
    }
  }, [user, location]);

  // ✅ Auth loading guard
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Admin */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <Routes>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="reports" element={<ReportViewer />} />
                <Route path="participants/:eventId" element={<EventParticipants />} />
                <Route path="*" element={<Navigate to="/admin" />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Faculty */}
      <Route
        path="/faculty/*"
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <Layout>
              <Routes>
                <Route index element={<FacultyDashboard />} />
                <Route path="my-events" element={<FacultyDashboard view="events" />} />
                <Route path="*" element={<Navigate to="/faculty" />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

// In the student routes section, update:
<Route path="/student/*" element={
  <ProtectedRoute allowedRoles={['student']}>
    <Layout>
      <Routes>
        <Route index element={<StudentDashboard />} />
        <Route path="my-registrations" element={<MyRegistrations />} />
        <Route path="my-feedback" element={<MyFeedback />} /> {/* Add this */}
        <Route path="*" element={<Navigate to="/student" />} />
      </Routes>
    </Layout>
  </ProtectedRoute>
} />

      {/* Shared */}
      <Route path="/" element={<Navigate to="/login" />} />
      {/* <Route path="/events" element={<EventsPage />} /> */}
      <Route path="/events" element={
  <ProtectedRoute allowedRoles={['admin', 'faculty', 'student']}>
    <Layout>
      <EventsPage />
    </Layout>
  </ProtectedRoute>
} />
      {/* <Route path="/events/:id" element={<EventDetail />} /> */}
      <Route path="/events/:id" element={
  <ProtectedRoute allowedRoles={['admin', 'faculty', 'student']}>
    <Layout>
      <EventDetail />
    </Layout>
  </ProtectedRoute>
} />
      <Route
        path="/events/:id/participate"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <ParticipationForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:id/feedback"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <FeedbackForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:id/feedback-form"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <DynamicFeedbackForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      {/* <Route path="/gallery" element={<Gallery />} /> */}
      <Route path="/gallery" element={
  <ProtectedRoute allowedRoles={['admin', 'faculty', 'student']}>
    <Layout>
      <Gallery />
    </Layout>
  </ProtectedRoute>
} />
      <Route
        path="/create-event"
        element={
          <ProtectedRoute allowedRoles={['admin', 'faculty']}>
            <EventForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-event/:id"
        element={
          <ProtectedRoute allowedRoles={['admin', 'faculty']}>
            <EventForm />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <h1 className="text-6xl font-bold mb-4">404</h1>
              <p className="text-xl mb-8">Page not found</p>
              <a href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg">
                Go Home
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

export default AppRoutes;

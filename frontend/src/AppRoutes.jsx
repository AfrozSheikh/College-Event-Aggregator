import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { FullPageLoader } from './components/common/Loaders';
import NotFound from './pages/NotFound';

// Pages (lazy-loaded so each page is its own chunk)
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const FacultyDashboard = lazy(() => import('./pages/FacultyDashboard'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventDetail = lazy(() => import('./pages/EventDetail'));
const EventForm = lazy(() => import('./pages/EventForm'));
const ParticipationForm = lazy(() => import('./pages/ParticipationForm'));
const FeedbackForm = lazy(() => import('./pages/FeedbackForm'));
const Gallery = lazy(() => import('./pages/Gallery'));
const ReportViewer = lazy(() => import('./pages/ReportViewer'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const MyRegistrations = lazy(() => import('./pages/MyRegistrations'));
const EventParticipants = lazy(() => import('./pages/EventParticipants'));
const DynamicFeedbackForm = lazy(() => import('./components/DynamicFeedbackForm'));

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
const MyFeedback = lazy(() => import('./pages/MyFeedback'));

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
    return <FullPageLoader label="Getting things ready…" />;
  }

  return (
    <Suspense fallback={<FullPageLoader />}>
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

      {/* Student */}
      <Route
        path="/student/*"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <Routes>
                <Route index element={<StudentDashboard />} />
                <Route path="my-registrations" element={<MyRegistrations />} />
                <Route path="my-feedback" element={<MyFeedback />} />
                <Route path="*" element={<Navigate to="/student" />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />

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
            <Layout>
              <ParticipationForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:id/feedback"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <FeedbackForm />
            </Layout>
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
            <Layout>
              <EventForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-event/:id"
        element={
          <ProtectedRoute allowedRoles={['admin', 'faculty']}>
            <Layout>
              <EventForm />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
  );
}

export default AppRoutes;

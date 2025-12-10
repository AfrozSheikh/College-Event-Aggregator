
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// Import all pages
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
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                style: {
                  background: '#10B981',
                },
              },
              error: {
                duration: 4000,
                style: {
                  background: '#EF4444',
                },
              },
            }}
          />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected Routes with Layout */}
            <Route path="/admin/*" element={
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
            } />
            
            <Route path="/faculty/*" element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <Layout>
                  <Routes>
                    <Route index element={<FacultyDashboard />} />
                    <Route path="my-events" element={<FacultyDashboard view="events" />} />
                    <Route path="*" element={<Navigate to="/faculty" />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/student/*" element={
              <ProtectedRoute allowedRoles={['student']}>
                <Layout>
                  <Routes>
                    <Route index element={<StudentDashboard />} />
                    <Route path="my-registrations" element={<MyRegistrations />} />
                    <Route path="my-feedback" element={<div>My Feedback Page</div>} />
                    <Route path="*" element={<Navigate to="/student" />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Shared Routes */}
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/events/:id/participate" element={
              <ProtectedRoute allowedRoles={['student']}>
                <ParticipationForm />
              </ProtectedRoute>
            } />
            <Route path="/events/:id/feedback" element={
              <ProtectedRoute allowedRoles={['student']}>
                <FeedbackForm />
              </ProtectedRoute>
            } />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/create-event" element={
              <ProtectedRoute allowedRoles={['admin', 'faculty']}>
                <EventForm />
              </ProtectedRoute>
            } />
            <Route path="/edit-event/:id" element={
              <ProtectedRoute allowedRoles={['admin', 'faculty']}>
                <EventForm />
              </ProtectedRoute>
            } />
            
            {/* 404 Page */}
            <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
                  <p className="text-xl text-gray-600 mb-8">Page not found</p>
                  <a href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    Go Home
                  </a>
                </div>
              </div>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { Toaster } from 'react-hot-toast';
// import Login from './pages/Login';
// import Signup from './pages/Signup';
// import AdminDashboard from './pages/AdminDashboard';
// import FacultyDashboard from './pages/FacultyDashboard';
// import StudentDashboard from './pages/StudentDashboard';
// import EventsPage from './pages/EventsPage';
// import EventDetail from './pages/EventDetail';
// import EventForm from './pages/EventForm';
// import ParticipationForm from './pages/ParticipationForm';
// import FeedbackForm from './pages/FeedbackForm';
// import Gallery from './pages/Gallery';
// import ProtectedRoute from './components/ProtectedRoute';
// import { AuthProvider } from './context/AuthContext';
// import './index.css';

// function App() {
//   return (
//     <AuthProvider>
//       <Router>
//         <div className="min-h-screen bg-gray-50">
//           <Toaster position="top-right" />
//           <Routes>
//             <Route path="/login" element={<Login />} />
//             <Route path="/signup" element={<Signup />} />
            
//             <Route path="/admin" element={
//               <ProtectedRoute allowedRoles={['admin']}>
//                 <AdminDashboard />
//               </ProtectedRoute>
//             } />
            
//             <Route path="/faculty" element={
//               <ProtectedRoute allowedRoles={['faculty']}>
//                 <FacultyDashboard />
//               </ProtectedRoute>
//             } />
            
//             <Route path="/student" element={
//               <ProtectedRoute allowedRoles={['student']}>
//                 <StudentDashboard />
//               </ProtectedRoute>
//             } />
            
//             <Route path="/events" element={<EventsPage />} />
//             <Route path="/events/:id" element={<EventDetail />} />
//             <Route path="/events/:id/participate" element={<ParticipationForm />} />
//             <Route path="/events/:id/feedback" element={<FeedbackForm />} />
//             <Route path="/gallery" element={<Gallery />} />
//             <Route path="/create-event" element={<EventForm />} />
//             <Route path="/edit-event/:id" element={<EventForm />} />
            
//             <Route path="/" element={<Navigate to="/login" />} />
//           </Routes>
//         </div>
//       </Router>
//     </AuthProvider>
//   );
// }

// export default App;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { BellAlertIcon } from '@heroicons/react/24/outline';
import {
  CalendarIcon,
  CheckCircleIcon,
  PhotoIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const StudentDashboard = () => {
  const { user, logout, notifications } = useAuth(); // Added notifications from useAuth
  const [futureEvents, setFutureEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    // Calculate unread notifications
    if (notifications && Array.isArray(notifications)) {
      const unread = notifications.filter(n => !n.read).length;
      setUnreadCount(unread);
    }
  }, [notifications]);

  const fetchEvents = async () => {
    try {
      const [futureRes, pastRes] = await Promise.all([
        axios.get('http://localhost:5000/api/events/type/future'),
        axios.get('http://localhost:5000/api/events/type/past')
      ]);
      
      setFutureEvents(futureRes.data.slice(0, 3));
      setPastEvents(pastRes.data.slice(0, 3));
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <Link
                to="/events"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Browse All Events
              </Link>
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
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-8 text-white mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.name}!</h2>
              <p className="mb-4">Stay updated with upcoming events and participate in exciting activities.</p>
              
              {/* 🔔 Notifications Alert - Fixed with proper null check */}
              {notifications && Array.isArray(notifications) && unreadCount > 0 && (
                <div className="flex items-center bg-white bg-opacity-20 rounded-lg p-3 mb-4">
                  <BellAlertIcon className="h-5 w-5 mr-2" />
                  <span>You have {unreadCount} new notification(s)</span>
                </div>
              )}

              <div className="flex flex-wrap gap-4 text-black">
                <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                  <p className="text-sm">College</p>
                  <p className="font-semibold">{user?.college_name}</p>
                </div>
                <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                  <p className="text-sm">Course & Year</p>
                  <p className="font-semibold">{user?.course} - {user?.year}</p>
                </div>
                <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                  <p className="text-sm">Email</p>
                  <p className="font-semibold">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Link
            to="/events"
            className="bg-white rounded-xl shadow p-6 hover:shadow-md transition text-center"
          >
            <CalendarIcon className="h-12 w-12 mx-auto text-blue-600 mb-4" />
            <h3 className="font-semibold text-gray-800">Browse Events</h3>
            <p className="text-sm text-gray-600 mt-2">Find and register for events</p>
          </Link>

          <Link
            to="/gallery"
            className="bg-white rounded-xl shadow p-6 hover:shadow-md transition text-center"
          >
            <PhotoIcon className="h-12 w-12 mx-auto text-green-600 mb-4" />
            <h3 className="font-semibold text-gray-800">Event Gallery</h3>
            <p className="text-sm text-gray-600 mt-2">View photos from past events</p>
          </Link>

          <Link
            to="/student/my-registrations"
            className="bg-white rounded-xl shadow p-6 hover:shadow-md transition text-center"
          >
            <CheckCircleIcon className="h-12 w-12 mx-auto text-purple-600 mb-4" />
            <h3 className="font-semibold text-gray-800">My Registrations</h3>
            <p className="text-sm text-gray-600 mt-2">Track your participation</p>
          </Link>

          <Link
  to="/student/my-feedback"
  className="bg-white rounded-xl shadow p-6 hover:shadow-md transition text-center"
>
  <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto text-yellow-600 mb-4" />
  <h3 className="font-semibold text-gray-800">My Feedback</h3>
  <p className="text-sm text-gray-600 mt-2">View submitted feedback</p>
</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Events */}
          <div className="bg-white rounded-xl shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Upcoming Events</h2>
              <Link to="/events" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All →
              </Link>
            </div>
            <div className="p-6">
              {futureEvents.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No upcoming events</p>
              ) : (
                <div className="space-y-4">
                  {futureEvents.map(event => (
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
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {event.category}
                        </span>
                      </div>
                      <div className="mt-2">
                        <Link
                          to={`/events/${event.id}/participate`}
                          className="inline-block px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                        >
                          Register Now
                        </Link>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Past Events for Feedback */}
          <div className="bg-white rounded-xl shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Past Events</h2>
              <Link to="/events?type=past" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                View All →
              </Link>
            </div>
            <div className="p-6">
              {pastEvents.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No past events</p>
              ) : (
                <div className="space-y-4">
                  {pastEvents.map(event => (
                    <div key={event.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-800">{event.title}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(event.event_date).toLocaleDateString()} • {event.location}
                          </p>
                        </div>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                          Completed
                        </span>
                      </div>
                      <div className="mt-2 flex space-x-2">
                        <Link
                          to={`/events/${event.id}`}
                          className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition"
                        >
                          View Details
                        </Link>
                        <Link
                          to={`/events/${event.id}/feedback`}
                          className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition"
                        >
                          Submit Feedback
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import axios from 'axios';
// import toast from 'react-hot-toast';
// import { BellAlertIcon } from '@heroicons/react/24/outline';
// import {
//   CalendarIcon,
//   CheckCircleIcon,
//   PhotoIcon,
//   ChatBubbleLeftRightIcon
// } from '@heroicons/react/24/outline';

// const StudentDashboard = () => {
//   const { user, logout } = useAuth();
//   const [futureEvents, setFutureEvents] = useState([]);
//   const [pastEvents, setPastEvents] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchEvents();
//   }, []);

//   const fetchEvents = async () => {
//     try {
//       const [futureRes, pastRes] = await Promise.all([
//         axios.get('http://localhost:5000/api/events/type/future'),
//         axios.get('http://localhost:5000/api/events/type/past')
//       ]);
      
//       setFutureEvents(futureRes.data.slice(0, 3));
//       setPastEvents(pastRes.data.slice(0, 3));
//     } catch (error) {
//       toast.error('Failed to load events');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (loading) return <div>Loading...</div>;

//   return (
//     <div className="min-h-screen bg-gray-100">
//       {/* Navbar */}
//       <nav className="bg-white shadow-lg">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between h-16">
//             <div className="flex items-center">
//               <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
//             </div>
//             <div className="flex items-center space-x-4">
//               <span className="text-gray-700">Welcome, {user?.name}</span>
//               <Link
//                 to="/events"
//                 className="text-blue-600 hover:text-blue-800 font-medium"
//               >
//                 Browse All Events
//               </Link>
//               <button
//                 onClick={logout}
//                 className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
//               >
//                 Logout
//               </button>
//             </div>
//           </div>
//         </div>
//       </nav>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Welcome Card */}
//         {/* Welcome Card */}
// <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-8 text-white mb-8">
//   <div className="flex justify-between items-start">
//     <div>
//       <h2 className="text-2xl font-bold mb-2">
//         Welcome back, {user?.name}!
//       </h2>

//       <p className="mb-4">
//         Stay updated with upcoming events and participate in exciting activities.
//       </p>

//       {/* 🔔 Notifications Alert */}
//       {notifications?.filter(n => !n.read).length > 0 && (
//         <div className="flex items-center bg-white bg-opacity-20 rounded-lg p-3 mb-4">
//           <BellAlertIcon className="h-5 w-5 mr-2" />
//           <span>
//             You have {notifications.filter(n => !n.read).length} new notification(s)
//           </span>
//         </div>
//       )}

//       {/* User Info Cards */}
//       <div className="flex flex-wrap gap-4">
//         <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
//           <p className="text-sm">College</p>
//           <p className="font-semibold">{user?.college_name}</p>
//         </div>

//         <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
//           <p className="text-sm">Course & Year</p>
//           <p className="font-semibold">
//             {user?.course} - {user?.year}
//           </p>
//         </div>

//         <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
//           <p className="text-sm">Email</p>
//           <p className="font-semibold">{user?.email}</p>
//         </div>
//       </div>
//     </div>
//   </div>
// </div>

//         {/* <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-8 text-white mb-8">
//           <h2 className="text-2xl font-bold mb-2">Welcome back, {user?.name}!</h2>
//           <p className="mb-4">Stay updated with upcoming events and participate in exciting activities.</p>
//           <div className="flex flex-wrap gap-4">
//             <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
//               <p className="text-sm">College</p>
//               <p className="font-semibold">{user?.college_name}</p>
//             </div>
//             <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
//               <p className="text-sm">Course & Year</p>
//               <p className="font-semibold">{user?.course} - {user?.year}</p>
//             </div>
//             <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
//               <p className="text-sm">Email</p>
//               <p className="font-semibold">{user?.email}</p>
//             </div>
//           </div>
//         </div> */}

//         {/* Quick Actions */}
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
//           <Link
//             to="/events"
//             className="bg-white rounded-xl shadow p-6 hover:shadow-md transition text-center"
//           >
//             <CalendarIcon className="h-12 w-12 mx-auto text-blue-600 mb-4" />
//             <h3 className="font-semibold text-gray-800">Browse Events</h3>
//             <p className="text-sm text-gray-600 mt-2">Find and register for events</p>
//           </Link>

//           <Link
//             to="/gallery"
//             className="bg-white rounded-xl shadow p-6 hover:shadow-md transition text-center"
//           >
//             <PhotoIcon className="h-12 w-12 mx-auto text-green-600 mb-4" />
//             <h3 className="font-semibold text-gray-800">Event Gallery</h3>
//             <p className="text-sm text-gray-600 mt-2">View photos from past events</p>
//           </Link>

//           <div className="bg-white rounded-xl shadow p-6 text-center">
//             <CheckCircleIcon className="h-12 w-12 mx-auto text-purple-600 mb-4" />
//             <h3 className="font-semibold text-gray-800">My Registrations</h3>
//             <p className="text-sm text-gray-600 mt-2">Track your participation</p>
//           </div>

//           <div className="bg-white rounded-xl shadow p-6 text-center">
//             <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto text-yellow-600 mb-4" />
//             <h3 className="font-semibold text-gray-800">My Feedback</h3>
//             <p className="text-sm text-gray-600 mt-2">View submitted feedback</p>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//           {/* Upcoming Events */}
//           <div className="bg-white rounded-xl shadow">
//             <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
//               <h2 className="text-xl font-semibold text-gray-800">Upcoming Events</h2>
//               <Link to="/events" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
//                 View All →
//               </Link>
//             </div>
//             <div className="p-6">
//               {futureEvents.length === 0 ? (
//                 <p className="text-gray-500 text-center py-4">No upcoming events</p>
//               ) : (
//                 <div className="space-y-4">
//                   {futureEvents.map(event => (
//                     <Link
//                       key={event.id}
//                       to={`/events/${event.id}`}
//                       className="block p-4 border rounded-lg hover:bg-gray-50 transition"
//                     >
//                       <div className="flex justify-between items-start">
//                         <div>
//                           <h3 className="font-medium text-gray-800">{event.title}</h3>
//                           <p className="text-sm text-gray-500">
//                             {new Date(event.event_date).toLocaleDateString()} • {event.location}
//                           </p>
//                         </div>
//                         <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
//                           {event.category}
//                         </span>
//                       </div>
//                       <div className="mt-2">
//                         <Link
//                           to={`/events/${event.id}/participate`}
//                           className="inline-block px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
//                         >
//                           Register Now
//                         </Link>
//                       </div>
//                     </Link>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Past Events for Feedback */}
//           <div className="bg-white rounded-xl shadow">
//             <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
//               <h2 className="text-xl font-semibold text-gray-800">Past Events</h2>
//               <Link to="/events?type=past" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
//                 View All →
//               </Link>
//             </div>
//             <div className="p-6">
//               {pastEvents.length === 0 ? (
//                 <p className="text-gray-500 text-center py-4">No past events</p>
//               ) : (
//                 <div className="space-y-4">
//                   {pastEvents.map(event => (
//                     <div key={event.id} className="p-4 border rounded-lg">
//                       <div className="flex justify-between items-start">
//                         <div>
//                           <h3 className="font-medium text-gray-800">{event.title}</h3>
//                           <p className="text-sm text-gray-500">
//                             {new Date(event.event_date).toLocaleDateString()} • {event.location}
//                           </p>
//                         </div>
//                         <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
//                           Completed
//                         </span>
//                       </div>
//                       <div className="mt-2 flex space-x-2">
//                         <Link
//                           to={`/events/${event.id}`}
//                           className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition"
//                         >
//                           View Details
//                         </Link>
//                         <Link
//                           to={`/events/${event.id}/feedback`}
//                           className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition"
//                         >
//                           Submit Feedback
//                         </Link>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default StudentDashboard;
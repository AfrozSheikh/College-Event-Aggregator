
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Load user from localStorage on refresh
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      
      // Verify user still exists in backend
      verifyUser(parsedUser.id)
        .then(isValid => {
          if (isValid) {
            setUser(parsedUser);
            loadNotifications(parsedUser.id, parsedUser.role);
          } else {
            localStorage.removeItem('user');
          }
        })
        .catch(() => {
          localStorage.removeItem('user');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const verifyUser = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/auth/user?userId=${userId}`);
      return response.data && response.data.id === userId;
    } catch (error) {
      return false;
    }
  };

  const loadNotifications = async (userId, role) => {
    if (role === 'student') {
      try {
        const response = await axios.get(`http://localhost:5000/api/notifications/student/${userId}`);
        setNotifications(response.data);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });
      
      const userData = response.data;
      setUser(userData);
      
      // Save to localStorage with timestamp
      const userWithTimestamp = {
        ...userData,
        lastLogin: new Date().toISOString()
      };
      localStorage.setItem('user', JSON.stringify(userWithTimestamp));
      
      // Load notifications for student
      if (userData.role === 'student') {
        loadNotifications(userData.id, userData.role);
      }
      
      toast.success('Login successful!');
      return { success: true, role: userData.role };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
      return { success: false };
    }
  };

  const signup = async (userData) => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/signup', userData);
      toast.success(response.data.message);
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.error || 'Signup failed');
      return { success: false };
    }
  };

  const logout = () => {
    setUser(null);
    setNotifications([]);
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      signup,
      logout,
      updateUser,
      loading,
      notifications,
      addNotification,
      markNotificationAsRead,
      clearNotifications
    }}>
      {children}
    </AuthContext.Provider>
  );
};
// import React, { createContext, useState, useContext, useEffect } from 'react';
// import axios from 'axios';
// import toast from 'react-hot-toast';

// const AuthContext = createContext({});

// export const useAuth = () => useContext(AuthContext);

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Check if user is logged in from localStorage
//     const storedUser = localStorage.getItem('user');
//     if (storedUser) {
//       setUser(JSON.parse(storedUser));
//     }
//     setLoading(false);
//   }, []);

//   const login = async (email, password) => {
//     try {
//       const response = await axios.post('http://localhost:5000/api/auth/login', {
//         email,
//         password
//       });
      
//       const userData = response.data;
//       setUser(userData);
//       localStorage.setItem('user', JSON.stringify(userData));
//       toast.success('Login successful!');
//       return { success: true, role: userData.role };
//     } catch (error) {
//       toast.error(error.response?.data?.error || 'Login failed');
//       return { success: false };
//     }
//   };

//   const signup = async (userData) => {
//     try {
//       const response = await axios.post('http://localhost:5000/api/auth/signup', userData);
//       toast.success(response.data.message);
//       return { success: true };
//     } catch (error) {
//       toast.error(error.response?.data?.error || 'Signup failed');
//       return { success: false };
//     }
//   };

//   const logout = () => {
//     setUser(null);
//     localStorage.removeItem('user');
//     toast.success('Logged out successfully');
//   };

//   const updateUser = (updatedUser) => {
//     setUser(updatedUser);
//     localStorage.setItem('user', JSON.stringify(updatedUser));
//   };

//   return (
//     <AuthContext.Provider value={{
//       user,
//       login,
//       signup,
//       logout,
//       updateUser,
//       loading
//     }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };
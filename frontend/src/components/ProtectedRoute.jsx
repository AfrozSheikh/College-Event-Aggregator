import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (!allowedRoles.includes(user.role)) {
    toast.error('Access denied');
    return <Navigate to="/" />;
  }
  
  // Check if faculty is approved
  if (user.role === 'faculty' && user.status !== 'approved') {
    toast.error('Your account is pending admin approval');
    return <Navigate to="/login" />;
  }
  
  return children;
};

export default ProtectedRoute;
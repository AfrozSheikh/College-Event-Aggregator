// Validation utility functions for form validation across the application

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
  if (!email) return 'Email is required';
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  if (email.length > 100) return 'Email must be less than 100 characters';
  return '';
};

// Name validation
export const validateName = (name) => {
  const nameRegex = /^[a-zA-Z\s]{3,100}$/;
  if (!name) return 'Name is required';
  if (name.trim().length < 3) return 'Name must be at least 3 characters';
  if (name.length > 100) return 'Name must be less than 100 characters';
  if (!nameRegex.test(name.trim())) return 'Name should contain only letters and spaces';
  return '';
};

// Phone validation (10 digits)
export const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  if (!phone) return ''; // Phone is optional in some forms
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length !== 10) return 'Phone number must be exactly 10 digits';
  if (!phoneRegex.test(cleaned)) return 'Please enter a valid phone number';
  return '';
};

// Password validation
export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > 50) return 'Password must be less than 50 characters';
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUpperCase) return 'Password must contain at least one uppercase letter';
  if (!hasLowerCase) return 'Password must contain at least one lowercase letter';
  if (!hasNumber) return 'Password must contain at least one number';
  if (!hasSpecial) return 'Password must contain at least one special character';
  
  return '';
};

// Confirm password validation
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return '';
};

// Text field validation (generic)
export const validateTextField = (value, fieldName, minLength = 3, maxLength = 200) => {
  if (!value || !value.trim()) return `${fieldName} is required`;
  if (value.trim().length < minLength) return `${fieldName} must be at least ${minLength} characters`;
  if (value.length > maxLength) return `${fieldName} must be less than ${maxLength} characters`;
  return '';
};

// Number validation
export const validateNumber = (value, fieldName, min = 0, max = Infinity) => {
  if (value === '' || value === null || value === undefined) return ''; // Optional
  const num = parseFloat(value);
  if (isNaN(num)) return `${fieldName} must be a valid number`;
  if (num < min) return `${fieldName} must be at least ${min}`;
  if (num > max) return `${fieldName} must be at most ${max}`;
  return '';
};

// Date validation (future dates for events)
export const validateFutureDate = (date) => {
  if (!date) return 'Date is required';
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) return 'Event date must be in the future';
  return '';
};

// File validation
export const validateFile = (file, maxSizeMB = 5, allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']) => {
  if (!file) return ''; // File is optional in many cases
  
  const maxSize = maxSizeMB * 1024 * 1024;
  if (file.size > maxSize) return `File size must be less than ${maxSizeMB}MB`;
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    const types = allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ');
    return `Only ${types} files are allowed`;
  }
  
  return '';
};

// Faculty ID validation
export const validateFacultyId = (facultyId) => {
  const alphanumericRegex = /^[a-zA-Z0-9]{3,50}$/;
  if (!facultyId) return 'Faculty ID is required';
  if (!alphanumericRegex.test(facultyId)) return 'Faculty ID should be alphanumeric (3-50 characters)';
  return '';
};

// Department validation
export const validateDepartment = (department) => {
  if (!department) return 'Department is required';
  return '';
};

// URL validation
export const validateURL = (url) => {
  if (!url) return ''; // URL is optional
  try {
    new URL(url);
    return '';
  } catch {
    return 'Please enter a valid URL';
  }
};

// Rating validation
export const validateRating = (rating) => {
  if (!rating) return 'Rating is required';
  const num = parseInt(rating);
  if (isNaN(num) || num < 1 || num > 5) return 'Rating must be between 1 and 5';
  return '';
};

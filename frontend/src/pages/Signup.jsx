import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Signup = () => {
  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Student specific
    collegeName: '',
    course: '',
    year: '',
    // Faculty specific
    facultyId: '',
    department: ''
  });
  const [errors, setErrors] = useState({});
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear the error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Name must be less than 100 characters';
    } else if (!/^[a-zA-Z\s.'-]+$/.test(formData.name.trim())) {
      newErrors.name = 'Name can only contain letters, spaces, dots, hyphens, and apostrophes';
    }

    // Email validation — only @gmail.com allowed
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(formData.email.trim())) {
      newErrors.email = 'Only Gmail addresses are allowed (e.g. example@gmail.com)';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const cleanPhone = formData.phone.replace(/[\s\-+]/g, '');
      if (!/^(\+?91)?[6-9]\d{9}$/.test(cleanPhone) && !/^\d{10}$/.test(cleanPhone)) {
        newErrors.phone = 'Please enter a valid 10-digit Indian phone number';
      }
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else {
      const passwordErrors = [];
      if (!/[A-Z]/.test(formData.password)) passwordErrors.push('one uppercase letter');
      if (!/[a-z]/.test(formData.password)) passwordErrors.push('one lowercase letter');
      if (!/[0-9]/.test(formData.password)) passwordErrors.push('one digit');
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) passwordErrors.push('one special character');
      if (passwordErrors.length > 0) {
        newErrors.password = `Password must contain at least ${passwordErrors.join(', ')}`;
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Role-specific validations
    if (role === 'student') {
      if (!formData.collegeName.trim()) {
        newErrors.collegeName = 'College name is required';
      } else if (formData.collegeName.trim().length < 3) {
        newErrors.collegeName = 'College name must be at least 3 characters';
      }

      if (!formData.course.trim()) {
        newErrors.course = 'Course is required';
      } else if (formData.course.trim().length < 2) {
        newErrors.course = 'Course must be at least 2 characters';
      }

      if (!formData.year) {
        newErrors.year = 'Please select your year';
      }
    } else if (role === 'faculty') {
      if (!formData.facultyId.trim()) {
        newErrors.facultyId = 'Faculty ID is required';
      } else if (formData.facultyId.trim().length < 3) {
        newErrors.facultyId = 'Faculty ID must be at least 3 characters';
      }

      if (!formData.department.trim()) {
        newErrors.department = 'Department is required';
      } else if (formData.department.trim().length < 2) {
        newErrors.department = 'Department must be at least 2 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the highlighted errors before submitting');
      // Scroll to top so user can see the error summary
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const userData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      password: formData.password,
      role: role
    };

    if (role === 'student') {
      userData.collegeName = formData.collegeName.trim();
      userData.course = formData.course.trim();
      userData.year = formData.year;
    } else if (role === 'faculty') {
      userData.facultyId = formData.facultyId.trim();
      userData.department = formData.department.trim();
    }

    const result = await signup(userData);
    if (result.success) {
      navigate('/login');
    }
  };

  // Helper to render inline error message
  const renderError = (field) => {
    if (!errors[field]) return null;
    return (
      <p className="text-red-600 text-sm mt-1.5 flex items-center gap-1.5 font-medium animate-pulse">
        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {errors[field]}
      </p>
    );
  };

  // Error summary box that shows all errors at the top of the form
  const renderErrorSummary = () => {
    const errorEntries = Object.values(errors).filter(Boolean);
    if (errorEntries.length === 0) return null;
    return (
      <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <h3 className="text-red-800 font-bold text-sm">Please fix the following {errorEntries.length} error{errorEntries.length > 1 ? 's' : ''}:</h3>
        </div>
        <ul className="list-disc list-inside space-y-1">
          {errorEntries.map((err, i) => (
            <li key={i} className="text-red-700 text-sm">{err}</li>
          ))}
        </ul>
      </div>
    );
  };

  // Helper for input border class
  const inputClass = (field) =>
    `w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
      errors[field] ? 'border-red-500 bg-red-50 shadow-sm shadow-red-100' : 'border-gray-300'
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
          <p className="text-gray-600">Join the college event community</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            I am a:
          </label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => { setRole('student'); setErrors({}); }}
              className={`flex-1 py-3 rounded-lg font-medium transition ${
                role === 'student' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => { setRole('faculty'); setErrors({}); }}
              className={`flex-1 py-3 rounded-lg font-medium transition ${
                role === 'faculty' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Faculty
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {renderErrorSummary()}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={inputClass('name')}
                placeholder="John Doe"
              />
              {renderError('name')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={inputClass('email')}
                placeholder="john@example.com"
              />
              {renderError('email')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={inputClass('phone')}
                placeholder="+91 9876543210"
              />
              {renderError('phone')}
            </div>

            {role === 'student' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    College Name *
                  </label>
                  <input
                    type="text"
                    name="collegeName"
                    value={formData.collegeName}
                    onChange={handleChange}
                    className={inputClass('collegeName')}
                    placeholder="Enter college name"
                  />
                  {renderError('collegeName')}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course *
                  </label>
                  <input
                    type="text"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    className={inputClass('course')}
                    placeholder="B.Tech CSE"
                  />
                  {renderError('course')}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year *
                  </label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className={inputClass('year')}
                  >
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                  {renderError('year')}
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Faculty ID *
                  </label>
                  <input
                    type="text"
                    name="facultyId"
                    value={formData.facultyId}
                    onChange={handleChange}
                    className={inputClass('facultyId')}
                    placeholder="FAC12345"
                  />
                  {renderError('facultyId')}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className={inputClass('department')}
                    placeholder="Computer Science"
                  />
                  {renderError('department')}
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={inputClass('password')}
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1">Min 8 chars, with uppercase, lowercase, digit & special character</p>
              {renderError('password')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={inputClass('confirmPassword')}
                placeholder="••••••••"
              />
              {renderError('confirmPassword')}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-300"
          >
            Create Account
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
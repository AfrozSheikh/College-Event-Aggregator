import React from 'react';

// Error message component for form fields
export const ErrorMessage = ({ error, touched }) => {
  if (!error || !touched) return null;
  
  return (
    <p className="mt-1 text-sm text-red-600 flex items-center">
      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {error}
    </p>
  );
};

// Helper function to get input class names based on error state
export const getInputClassName = (baseClassName, error, touched) => {
  const errorClass = error && touched ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500';
  return `${baseClassName} ${errorClass}`;
};

// Password strength indicator component
export const PasswordStrength = ({ password }) => {
  if (!password) return null;
  
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const strength = [hasLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  
  const getStrengthColor = () => {
    if (strength <= 2) return 'bg-red-500';
    if (strength === 3 || strength === 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const getStrengthText = () => {
    if (strength <= 2) return 'Weak';
    if (strength === 3 || strength === 4) return 'Medium';
    return 'Strong';
  };
  
  return (
    <div className="mt-2">
      <div className="flex items-center space-x-2 mb-1">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div className={`h-2 rounded-full transition-all ${getStrengthColor()}`} style={{ width: `${(strength / 5) * 100}%` }}></div>
        </div>
        <span className="text-xs font-medium text-gray-600">{getStrengthText()}</span>
      </div>
      <div className="grid grid-cols-2 gap-1 text-xs">
        <span className={hasLength ? 'text-green-600' : 'text-gray-400'}>✓ 8+ characters</span>
        <span className={hasUpper ? 'text-green-600' : 'text-gray-400'}>✓ Uppercase</span>
        <span className={hasLower ? 'text-green-600' : 'text-gray-400'}>✓ Lowercase</span>
        <span className={hasNumber ? 'text-green-600' : 'text-gray-400'}>✓ Number</span>
        <span className={hasSpecial ? 'text-green-600' : 'text-gray-400'} style={{ gridColumn: 'span 2' }}>✓ Special character</span>
      </div>
    </div>
  );
};

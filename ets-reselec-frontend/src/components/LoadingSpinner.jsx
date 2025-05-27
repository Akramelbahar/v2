import React from 'react';
import { Settings } from 'lucide-react';

const LoadingSpinner = ({ 
  size = 'default', 
  text = null, 
  fullScreen = true,
  className = '' 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12',
    xl: 'w-16 h-16'
  };
  
  const textSizeClasses = {
    small: 'text-sm',
    default: 'text-base',
    large: 'text-lg',
    xl: 'text-xl'
  };
  
  const spinnerContent = (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* Animated Logo */}
      <div className="relative">
        <Settings 
          className={`${sizeClasses[size]} text-primary-600 animate-spin-slow`} 
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${sizeClasses[size]} border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin`}></div>
        </div>
      </div>
      
      {/* Loading Text */}
      {text && (
        <div className={`${textSizeClasses[size]} text-gray-600 font-medium animate-pulse`}>
          {text}
        </div>
      )}
      
      {/* Loading Dots */}
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );
  
  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-soft p-8">
          {spinnerContent}
        </div>
      </div>
    );
  }
  
  return spinnerContent;
};

// Page loading spinner with ETS RESELEC branding
export const PageLoadingSpinner = ({ message = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="bg-white rounded-lg shadow-soft p-12 max-w-sm w-full text-center">
      <div className="mb-6">
        <Settings className="w-16 h-16 text-primary-600 mx-auto animate-spin-slow" />
      </div>
      
      <h2 className="text-xl font-semibold text-gray-900 mb-2">ETS RESELEC</h2>
      
      <p className="text-gray-600 mb-6">{message}</p>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-primary-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
      </div>
    </div>
  </div>
);

// Button loading spinner
export const ButtonSpinner = ({ size = 'small' }) => (
  <div className="flex items-center justify-center">
    <div className={`${sizeClasses[size]} border-2 border-white border-t-transparent rounded-full animate-spin`}></div>
  </div>
);

// Inline loading spinner
export const InlineSpinner = ({ text = 'Loading...', className = '' }) => (
  <div className={`flex items-center space-x-2 ${className}`}>
    <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
    <span className="text-sm text-gray-600">{text}</span>
  </div>
);

// Table loading spinner
export const TableLoadingSpinner = ({ rows = 5, columns = 4 }) => (
  <div className="animate-pulse">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4 py-4 border-b border-gray-200">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <div
            key={colIndex}
            className="flex-1 h-4 bg-gray-300 rounded"
            style={{ animationDelay: `${(rowIndex * columns + colIndex) * 0.1}s` }}
          ></div>
        ))}
      </div>
    ))}
  </div>
);

// Card loading spinner
export const CardLoadingSpinner = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white rounded-lg shadow-soft p-6 animate-pulse">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-3 bg-gray-300 rounded"></div>
          <div className="h-3 bg-gray-300 rounded w-5/6"></div>
          <div className="h-3 bg-gray-300 rounded w-4/6"></div>
        </div>
      </div>
    ))}
  </div>
);

const sizeClasses = {
  small: 'w-4 h-4',
  default: 'w-8 h-8',
  large: 'w-12 h-12',
  xl: 'w-16 h-16'
};

export default LoadingSpinner;
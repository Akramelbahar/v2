import React from 'react';
import { Settings } from 'lucide-react';

const LoadingSpinner = ({ 
  size = 'default', 
  text = null, 
  fullScreen = false,
  className = '' 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-6 h-6',
    large: 'w-8 h-8',
    xl: 'w-12 h-12'
  };
  
  const textSizeClasses = {
    small: 'text-sm',
    default: 'text-base',
    large: 'text-lg',
    xl: 'text-xl'
  };
  
  const spinnerContent = (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <div className="relative">
        <Settings 
          className={`${sizeClasses[size]} text-blue-600 animate-spin`} 
        />
        <div className={`
          absolute inset-0 ${sizeClasses[size]} 
          border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin
        `}></div>
      </div>
      
      {text && (
        <div className={`${textSizeClasses[size]} text-gray-600 font-medium`}>
          {text}
        </div>
      )}
    </div>
  );
  
  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          {spinnerContent}
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-center p-6">
      {spinnerContent}
    </div>
  );
};

export const TableLoadingSpinner = ({ rows = 5, columns = 4 }) => (
  <div className="animate-pulse">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4 py-4 border-b border-gray-200 last:border-b-0">
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

export const CardLoadingSpinner = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
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

export default LoadingSpinner;
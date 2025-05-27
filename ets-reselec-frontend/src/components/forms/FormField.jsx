import React from 'react';
import { AlertCircle } from 'lucide-react';

const FormField = ({
  label,
  name,
  type = 'text',
  required = false,
  error = null,
  help = null,
  children,
  className = ''
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {children}
      
      {error && (
        <div className="flex items-center space-x-1 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {help && !error && (
        <p className="text-sm text-gray-500">{help}</p>
      )}
    </div>
  );
};

export default FormField;
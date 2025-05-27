// src/components/common/SearchInput.jsx
import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

const SearchInput = ({
  value = '',
  onChange,
  onClear,
  placeholder = 'Rechercher...',
  debounceMs = 300,
  className = '',
  size = 'default'
}) => {
  const [localValue, setLocalValue] = useState(value);

  const sizeClasses = {
    small: 'pl-8 pr-8 py-1.5 text-sm',
    default: 'pl-10 pr-10 py-2',
    large: 'pl-12 pr-12 py-3 text-lg'
  };

  const iconSizes = {
    small: 'w-4 h-4',
    default: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  const iconPositions = {
    small: 'left-2',
    default: 'left-3',
    large: 'left-4'
  };

  const clearPositions = {
    small: 'right-2',
    default: 'right-3',
    large: 'right-4'
  };

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onChange && localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange, value]);

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClear = () => {
    setLocalValue('');
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange('');
    }
  };

  return (
    <div className="relative">
      <div className={`absolute inset-y-0 ${iconPositions[size]} flex items-center pointer-events-none`}>
        <Search className={`${iconSizes[size]} text-gray-400`} />
      </div>
      <input
        type="text"
        className={`
          block w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${sizeClasses[size]} ${className}
        `}
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
      />
      {localValue && (
        <button
          type="button"
          className={`absolute inset-y-0 ${clearPositions[size]} flex items-center`}
          onClick={handleClear}
        >
          <X className={`${iconSizes[size]} text-gray-400 hover:text-gray-600`} />
        </button>
      )}
    </div>
  );
};

export default SearchInput;
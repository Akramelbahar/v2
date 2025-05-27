
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

const Select = ({
  value,
  onChange,
  options = [],
  placeholder = 'Sélectionner...',
  searchable = false,
  multiple = false,
  disabled = false,
  className = '',
  error = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = searchable && searchQuery
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handleSelect = (option) => {
    if (multiple) {
      const newValue = Array.isArray(value) ? [...value] : [];
      const index = newValue.findIndex(v => v.value === option.value);
      
      if (index === -1) {
        newValue.push(option);
      } else {
        newValue.splice(index, 1);
      }
      
      onChange(newValue);
    } else {
      onChange(option);
      setIsOpen(false);
    }
  };

  const getDisplayValue = () => {
    if (multiple && Array.isArray(value)) {
      return value.length > 0 ? `${value.length} sélectionné(s)` : placeholder;
    }
    return value?.label || placeholder;
  };

  const isSelected = (option) => {
    if (multiple && Array.isArray(value)) {
      return value.some(v => v.value === option.value);
    }
    return value?.value === option.value;
  };

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between px-3 py-2 text-left bg-white border rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${error ? 'border-red-300' : 'border-gray-300'}
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-400'}
        `}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {getDisplayValue()}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {searchable && (
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <div className="py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">Aucune option trouvée</div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-100
                    ${isSelected(option) ? 'bg-blue-50 text-blue-900' : 'text-gray-900'}
                  `}
                >
                  <span>{option.label}</span>
                  {isSelected(option) && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Select;
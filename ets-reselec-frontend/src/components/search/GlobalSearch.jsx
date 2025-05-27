

// 12. Global Search Component
// ets-reselec-frontend/src/components/search/GlobalSearch.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, Users, Package, Wrench, X, Loader } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { searchService } from '../../services/searchService';
import { useNavigate } from 'react-router-dom';

const GlobalSearch = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const { data: results, isLoading } = useQuery({
    queryKey: ['global-search', query],
    queryFn: () => searchService.searchAll(query),
    enabled: query.length >= 2,
    staleTime: 30000
  });

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < (results?.total || 0) - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : (results?.total || 0) - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (results && results.allResults[selectedIndex]) {
            handleResultClick(results.allResults[selectedIndex]);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  const handleResultClick = (result) => {
    const routes = {
      client: `/clients/${result.id}`,
      equipment: `/equipment/${result.id}`,
      intervention: `/interventions/${result.id}`
    };
    
    navigate(routes[result.type] || '/');
    onClose();
  };

  const getResultIcon = (type) => {
    const icons = {
      client: Users,
      equipment: Package,
      intervention: Wrench
    };
    return icons[type] || Search;
  };

  const getResultColor = (type) => {
    const colors = {
      client: 'text-blue-600',
      equipment: 'text-green-600',
      intervention: 'text-orange-600'
    };
    return colors[type] || 'text-gray-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-start justify-center px-4 pt-16">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-25 transition-opacity" onClick={onClose} />
        
        <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
          {/* Search Input */}
          <div className="flex items-center px-4 py-4 border-b">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input
              ref={inputRef}
              type="text"
              className="flex-1 text-lg placeholder-gray-500 border-0 focus:ring-0 focus:outline-none"
              placeholder="Search clients, equipment, interventions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {isLoading && <Loader className="w-5 h-5 text-gray-400 animate-spin ml-3" />}
            <button
              onClick={onClose}
              className="ml-3 p-1 rounded-md hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {query.length < 2 && (
              <div className="px-4 py-8 text-center text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>Type at least 2 characters to search</p>
              </div>
            )}

            {query.length >= 2 && !isLoading && (!results || results.total === 0) && (
              <div className="px-4 py-8 text-center text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No results found for "{query}"</p>
              </div>
            )}

            {results && results.total > 0 && (
              <div className="py-2">
                {/* Results by Category */}
                {Object.entries(results.byType).map(([type, items]) => (
                  items.length > 0 && (
                    <div key={type} className="mb-4">
                      <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase bg-gray-50">
                        {type}s ({items.length})
                      </div>
                      {items.map((item, index) => {
                        const globalIndex = results.allResults.indexOf(item);
                        const Icon = getResultIcon(type);
                        const isSelected = globalIndex === selectedIndex;
                        
                        return (
                          <button
                            key={item.id}
                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 ${
                              isSelected ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                            }`}
                            onClick={() => handleResultClick(item)}
                          >
                            <Icon className={`w-5 h-5 ${getResultColor(type)}`} />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {item.title}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {item.subtitle}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {results && results.total > 0 && (
            <div className="px-4 py-3 border-t bg-gray-50 text-xs text-gray-500 flex justify-between">
              <span>Found {results.total} results</span>
              <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;

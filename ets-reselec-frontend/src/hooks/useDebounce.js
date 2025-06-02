// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

export default function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// src/hooks/usePagination.js
import { useState, useCallback } from 'react';

export default function usePagination(initialPage = 1, initialPageSize = 10) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when page size changes
  }, []);

  const resetPagination = useCallback(() => {
    setCurrentPage(initialPage);
    setPageSize(initialPageSize);
  }, [initialPage, initialPageSize]);

  return {
    currentPage,
    pageSize,
    setCurrentPage: handlePageChange,
    setPageSize: handlePageSizeChange,
    resetPagination,
    paginationParams: {
      page: currentPage,
      limit: pageSize
    }
  };
}

// src/hooks/useSearch.js
import { useState, useCallback } from 'react';
import useDebounce from './useDebounce';

export default function useSearch(initialValue = '', debounceDelay = 300) {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  const debouncedSearchQuery = useDebounce(searchQuery, debounceDelay);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    debouncedSearchQuery,
    setSearchQuery: handleSearch,
    clearSearch,
    searchParams: {
      search: debouncedSearchQuery
    }
  };
}

// src/hooks/useSort.js
import { useState, useCallback } from 'react';

export default function useSort(initialSortBy = 'id', initialSortOrder = 'DESC') {
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState(initialSortOrder);

  const handleSort = useCallback((field) => {
    if (field === sortBy) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      // New field, default to ASC
      setSortBy(field);
      setSortOrder('ASC');
    }
  }, [sortBy, sortOrder]);

  const resetSort = useCallback(() => {
    setSortBy(initialSortBy);
    setSortOrder(initialSortOrder);
  }, [initialSortBy, initialSortOrder]);

  return {
    sortBy,
    sortOrder,
    handleSort,
    resetSort,
    sortParams: {
      sortBy,
      sortOrder
    }
  };
}

// src/hooks/useFilters.js
import { useState, useCallback } from 'react';

export default function useFilters(initialFilters = {}) {
  const [filters, setFilters] = useState(initialFilters);

  const setFilter = useCallback((key, value) => {
    setFilters(prev => {
      if (value === undefined || value === '' || value === null) {
        // Remove filter if value is empty
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const setMultipleFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilter = useCallback((key) => {
    setFilters(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({});
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  return {
    filters,
    setFilter,
    setMultipleFilters,
    clearFilter,
    clearAllFilters,
    resetFilters,
    filterParams: filters
  };
}
import { useState, useEffect, useRef, useCallback } from 'react';

// Basic debounce hook
export const useDebounce = (value, delay = 300) => {
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
};

// Advanced debounced input hook with immediate local updates
export const useDebouncedInput = (initialValue = '', delay = 300, onDebouncedChange = null) => {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const timeoutRef = useRef(null);
  const callbackRef = useRef(onDebouncedChange);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = onDebouncedChange;
  }, [onDebouncedChange]);

  // Debounce logic
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
      
      // Call the callback if provided
      if (callbackRef.current && value !== debouncedValue) {
        callbackRef.current(value);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay, debouncedValue]);

  // Handle input changes
  const handleChange = useCallback((newValue) => {
    setValue(newValue);
  }, []);

  // Reset function
  const reset = useCallback((newValue = '') => {
    setValue(newValue);
    setDebouncedValue(newValue);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Force immediate update (skip debouncing)
  const forceUpdate = useCallback((newValue) => {
    setValue(newValue);
    setDebouncedValue(newValue);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (callbackRef.current) {
      callbackRef.current(newValue);
    }
  }, []);

  return {
    value,           // Current input value (updates immediately)
    debouncedValue,  // Debounced value (updates after delay)
    handleChange,    // Function to update the value
    reset,           // Function to reset the value
    forceUpdate,     // Function to force immediate update
    isPending: value !== debouncedValue // Whether there's a pending debounced update
  };
};

// Hook for debouncing multiple filter inputs
export const useDebouncedFilters = (initialFilters = {}, delay = 300, onFiltersChange = null) => {
  const [filters, setFilters] = useState(initialFilters);
  const [debouncedFilters, setDebouncedFilters] = useState(initialFilters);
  const timeoutRef = useRef(null);
  const callbackRef = useRef(onFiltersChange);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = onFiltersChange;
  }, [onFiltersChange]);

  // Debounce filters
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedFilters(filters);
      
      // Call the callback if provided
      if (callbackRef.current && JSON.stringify(filters) !== JSON.stringify(debouncedFilters)) {
        callbackRef.current(filters);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [filters, delay, debouncedFilters]);

  // Update a specific filter
  const updateFilter = useCallback((key, value, immediate = false) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // For immediate updates (like checkboxes), skip debouncing
    if (immediate) {
      setDebouncedFilters(newFilters);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (callbackRef.current) {
        callbackRef.current(newFilters);
      }
    }
  }, [filters]);

  // Reset all filters
  const resetFilters = useCallback((newFilters = {}) => {
    setFilters(newFilters);
    setDebouncedFilters(newFilters);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Force immediate update for all filters
  const forceUpdate = useCallback((newFilters) => {
    setFilters(newFilters);
    setDebouncedFilters(newFilters);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (callbackRef.current) {
      callbackRef.current(newFilters);
    }
  }, []);

  return {
    filters,           // Current filter values
    debouncedFilters,  // Debounced filter values
    updateFilter,      // Function to update a specific filter
    resetFilters,      // Function to reset all filters
    forceUpdate,       // Function to force immediate update
    isPending: JSON.stringify(filters) !== JSON.stringify(debouncedFilters) // Whether there are pending changes
  };
};

// Hook for debouncing search queries with search history
export const useDebouncedSearch = (delay = 300, onSearch = null, maxHistorySize = 10) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const timeoutRef = useRef(null);
  const callbackRef = useRef(onSearch);

  // Update callback ref
  useEffect(() => {
    callbackRef.current = onSearch;
  }, [onSearch]);

  // Debounce search query
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (query.trim() === '') {
      setDebouncedQuery('');
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    timeoutRef.current = setTimeout(() => {
      setDebouncedQuery(query);
      setIsSearching(false);
      
      // Add to search history
      if (query.trim() && !searchHistory.includes(query.trim())) {
        setSearchHistory(prev => {
          const newHistory = [query.trim(), ...prev.filter(item => item !== query.trim())];
          return newHistory.slice(0, maxHistorySize);
        });
      }

      // Call the callback
      if (callbackRef.current) {
        callbackRef.current(query);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, delay, searchHistory, maxHistorySize]);

  // Handle search input changes
  const handleSearch = useCallback((newQuery) => {
    setQuery(newQuery);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setIsSearching(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Search from history
  const searchFromHistory = useCallback((historyQuery) => {
    setQuery(historyQuery);
    // Force immediate search for history items
    setDebouncedQuery(historyQuery);
    setIsSearching(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (callbackRef.current) {
      callbackRef.current(historyQuery);
    }
  }, []);

  return {
    query,                    // Current search query
    debouncedQuery,          // Debounced search query
    searchHistory,           // Array of previous searches
    isSearching,             // Whether a search is pending
    handleSearch,            // Function to update search query
    clearSearch,             // Function to clear search
    searchFromHistory,       // Function to search from history
    isPending: query !== debouncedQuery && query.trim() !== '' // Whether there's a pending search
  };
};

// Performance monitoring for debounced operations
const debounceMetrics = {
  totalDebounces: 0,
  averageDelay: 0,
  savedAPICalls: 0,
  delays: []
};

export const trackDebounceMetrics = (delay) => {
  debounceMetrics.totalDebounces++;
  debounceMetrics.delays.push(delay);
  debounceMetrics.savedAPICalls++; // Each debounce potentially saves an API call
  
  // Calculate rolling average
  const recentDelays = debounceMetrics.delays.slice(-50); // Last 50 operations
  debounceMetrics.averageDelay = 
    recentDelays.reduce((sum, d) => sum + d, 0) / recentDelays.length;
};

export const getDebounceMetrics = () => {
  return {
    ...debounceMetrics,
    efficiency: debounceMetrics.totalDebounces > 0 
      ? (debounceMetrics.savedAPICalls / debounceMetrics.totalDebounces * 100).toFixed(1)
      : 0
  };
};

export const resetDebounceMetrics = () => {
  debounceMetrics.totalDebounces = 0;
  debounceMetrics.averageDelay = 0;
  debounceMetrics.savedAPICalls = 0;
  debounceMetrics.delays = [];
};

import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import './App.css';
import VehicleSearchFilter from './components/VehicleSearchFilter';
import VehicleCardSkeleton from './components/VehicleCardSkeleton';
import LazyVehicleCard from './components/LazyVehicleCard';
import SearchResultsHeader from './components/SearchResultsHeader';
import { fetchVehiclesPaginated, fetchAllFilteredVehicles } from './services/api-paginated';
import ErrorBoundary from './components/ErrorBoundary';
import {
  VehicleGridErrorBoundary,
  FilterErrorBoundary,
  PaginationErrorBoundary,
  VehicleCardErrorBoundary
} from './components/SpecializedErrorBoundaries';
import { useBatchLazyLoading } from './hooks/useLazyLoading';
import { useDebouncedFilters } from './hooks/useDebounce';
import { optimizeChunkLoading } from './utils/bundleAnalyzer';
import BundleAnalysisPanel from './components/BundleAnalysisPanel';
import { performanceMonitor } from './services/performanceMonitor';

// Lazy load heavy components for better performance
const Pagination = lazy(() => import('./components/Pagination'));

// URL parameter helpers
const filtersToURLParams = (filters, page = 1) => {
  try {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (!value ||
          (Array.isArray(value) && value.length === 0) ||
          ['zipCode', 'radius', 'termLength', 'interestRate', 'downPayment'].includes(key)) {
        return;
      }

      // Sanitize key and values
      const safeKey = encodeURIComponent(key);

      if (Array.isArray(value)) {
        value.forEach(item => {
          if (item && item.toString().trim()) {
            const safeValue = encodeURIComponent(item.toString().trim());
            params.append(safeKey, safeValue);
          }
        });
      } else if (value.toString().trim() !== '') {
        const safeValue = encodeURIComponent(value.toString().trim());
        params.set(safeKey, safeValue);
      }
    });

    if (page > 1) {
      params.set('page', page.toString());
    }

    return params.toString();
  } catch (error) {
    console.warn('URL params creation failed:', error);
    return '';
  }
};

const URLParamsToFilters = (searchParams) => {
  try {
    const filters = {
      condition: [],
      make: [],
      model: [],
      trim: [],
      year: [],
      vehicleType: [],
      bodyType: [],
      driveType: [],
      transmission: [],
      transmissionSpeed: [],
      fuelType: [],
      exteriorColor: [],
      interiorColor: [],
      mileage: '',
      sellerType: [],
      dealer: [],
      state: [],
      city: [],
      zipCodeFilter: [],
      priceMin: '',
      priceMax: '',
      paymentMin: '',
      paymentMax: '',
      zipCode: '98498',
      radius: '200',
      termLength: '72',
      interestRate: '8',
      downPayment: '2000'
    };

    for (const [key, value] of searchParams.entries()) {
      // Skip invalid or dangerous parameters
      if (key === 'page' || key === 'reload' || !value || value.length > 100) {
        continue;
      }

      // Skip extremely long numbers (potential attack)
      if (/^\d{10,}$/.test(value)) {
        continue;
      }

      // Decode URI components safely
      let safeKey, safeValue;
      try {
        safeKey = decodeURIComponent(key);
        safeValue = decodeURIComponent(value);
      } catch (decodeError) {
        console.warn('Failed to decode URL parameter:', key, value);
        continue;
      }

      if (filters.hasOwnProperty(safeKey)) {
        if (Array.isArray(filters[safeKey])) {
          if (!filters[safeKey].includes(safeValue)) {
            filters[safeKey].push(safeValue);
          }
        } else {
          filters[safeKey] = safeValue;
        }
      }
    }

    return filters;
  } catch (error) {
    console.warn('Failed to parse URL parameters, using defaults:', error);
    return {
      condition: [],
      make: [],
      model: [],
      trim: [],
      year: [],
      vehicleType: [],
      bodyType: [],
      driveType: [],
      transmission: [],
      transmissionSpeed: [],
      fuelType: [],
      exteriorColor: [],
      interiorColor: [],
      mileage: '',
      sellerType: [],
      dealer: [],
      state: [],
      city: [],
      zipCodeFilter: [],
      priceMin: '',
      priceMax: '',
      paymentMin: '',
      paymentMax: '',
      zipCode: '98498',
      radius: '200',
      termLength: '72',
      interestRate: '8',
      downPayment: '2000'
    };
  }
};

// Demo data functions moved to API service for better organization

function App() {
  // Initialize filters from URL parameters
  const getInitialFilters = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search || '');
      if (urlParams.toString()) {
        return URLParamsToFilters(urlParams);
      }
    } catch (error) {
      console.warn('Failed to parse URL parameters:', error);
    }

    return {
      condition: [],
      make: [],
      model: [],
      trim: [],
      year: [],
      vehicleType: [],
      bodyType: [],
      driveType: [],
      transmission: [],
      transmissionSpeed: [],
      fuelType: [],
      exteriorColor: [],
      interiorColor: [],
      mileage: '',
      sellerType: [],
      dealer: [],
      state: [],
      city: [],
      zipCodeFilter: [],
      priceMin: '',
      priceMax: '',
      paymentMin: '',
      paymentMax: '',
      zipCode: '98498',
      radius: '200',
      termLength: '72',
      interestRate: '8',
      downPayment: '2000'
    };
  };

  // State management with debounced filters
  const initialFilters = getInitialFilters();
  const {
    filters,
    debouncedFilters,
    updateFilter,
    resetFilters,
    forceUpdate: forceUpdateFilters,
    isPending: filtersArePending
  } = useDebouncedFilters(initialFilters, 500, (newFilters) => {
    console.log('🔄 Debounced filters updated:', newFilters);
    debouncedFilterChange(newFilters);
  });

  // Data state
  const [vehicles, setVehicles] = useState([]);
  const [filterOptions, setFilterOptions] = useState({});
  const [fullInventory, setFullInventory] = useState([]); // Store full inventory for accurate filter counts
  const [loading, setLoading] = useState(true);
  const [optimisticLoading, setOptimisticLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiConnected, setApiConnected] = useState(false);

  // Caching state for sequential filtering performance
  const [cachedVehicles, setCachedVehicles] = useState(new Map());

  // Page preloading cache for instant pagination
  const [preloadedPages, setPreloadedPages] = useState(new Map());

  const [favorites, setFavorites] = useState({});
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search || '');
      const pageParam = urlParams.get('page');
      const parsedPage = pageParam ? parseInt(pageParam, 10) : 1;
      return (parsedPage > 0 && parsedPage < 10000) ? parsedPage : 1; // Reasonable bounds
    } catch (error) {
      console.warn('Failed to parse page parameter:', error);
      return 1;
    }
  });
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showingFavorites, setShowingFavorites] = useState(false);

  // Bundle analysis state (development only)
  const [showBundleAnalysis, setShowBundleAnalysis] = useState(false);

  // Pagination state
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(19); // 🚀 PERFORMANCE: Show 19 results as requested
  const [searchTime, setSearchTime] = useState(0);

  // Lazy loading state with batch management
  const {
    visibleItems: visibleVehicles,
    hasMoreBatches,
    isLoading: batchLoading,
    loadNextBatch,
    resetBatches,
    batchInfo
  } = useBatchLazyLoading(vehicles, 6); // Load 6 vehicles at a time

  // Update URL when filters or page change
  const updateURL = useCallback((newFilters, page = currentPage) => {
    try {
      const params = filtersToURLParams(newFilters, page);

      // Ensure we have a valid pathname
      const pathname = window.location.pathname || '/';

      // Construct the new URL properly
      const newURL = params ? `${pathname}?${params}` : pathname;

      // Validate the URL before pushing to history
      const currentURL = window.location.pathname + window.location.search;

      if (newURL !== currentURL && newURL.length < 2048) { // URL length limit
        // Use replaceState instead of pushState to avoid history buildup
        window.history.replaceState(null, '', newURL);
      }
    } catch (error) {
      console.warn('URL update failed:', error);
      // Fallback: don't update URL if there's an error
    }
  }, [currentPage]);

  // Helper function to check if we can use cached data for sequential filtering
  const canUseSequentialCache = useCallback((newFilters, currentFilters) => {
    // Check if this is a Ford → Explorer type scenario
    const newMake = newFilters.make || [];
    const currentMake = currentFilters.make || [];
    const newModel = newFilters.model || [];
    const currentModel = currentFilters.model || [];

    // Scenario: User selected Ford, now adding Explorer model
    if (newMake.length === 1 && currentMake.length === 1 &&
        newMake[0] === currentMake[0] && // Same make (Ford)
        newModel.length > currentModel.length) { // Adding model filter

      const cacheKey = `make_${newMake[0]}`;
      return cachedVehicles.has(cacheKey);
    }

    return false;
  }, [cachedVehicles]);

  // Helper function to filter cached vehicles client-side
  const filterCachedVehicles = useCallback((cacheKey, newFilters) => {
    const cached = cachedVehicles.get(cacheKey);
    if (!cached) return null;

    // Apply model filter to cached Ford vehicles
    const filteredVehicles = cached.vehicles.filter(vehicle => {
      if (newFilters.model && newFilters.model.length > 0) {
        const getMeta = (key) => {
          const meta = vehicle.meta_data?.find(m => m.key === key);
          return meta ? meta.value : '';
        };

        const vehicleModel = getMeta('model') || vehicle.title.split(' ')[2];
        return newFilters.model.includes(vehicleModel);
      }
      return true;
    });

    return {
      vehicles: filteredVehicles,
      totalResults: filteredVehicles.length,
      totalPages: Math.ceil(filteredVehicles.length / itemsPerPage),
      currentPage: 1,
      searchTime: 10, // Ultra-fast client-side filtering
      isCached: true
    };
  }, [cachedVehicles, itemsPerPage]);

  // Cache for filter options to avoid expensive recalculations
  const filterOptionsCache = useRef(new Map());

  // Extract filter options from vehicle data with memoization - now uses FULL inventory
  const extractFilterOptions = useCallback((vehicles) => {
    console.log('📊 Calculating filter options from', vehicles.length, 'vehicles (FULL INVENTORY)');

    // Create cache key based on vehicle IDs and count
    const cacheKey = vehicles.map(v => v.id).sort().join('-') + '-' + vehicles.length;

    // Return cached result if available
    if (filterOptionsCache.current.has(cacheKey)) {
      console.log('🚀 Using cached filter options');
      return filterOptionsCache.current.get(cacheKey);
    }

    const options = {
      makes: [],
      models: [],
      conditions: [],
      bodyTypes: [],
      drivetrains: [],
      transmissions: [],
      exteriorColors: [],
      interiorColors: [],
      years: [],
      trims: [],
      fuelTypes: []
    };

    const counts = {};

    vehicles.forEach(vehicle => {
      // Extract make from title or meta data
      const title = vehicle.title || '';
      const titleParts = title.split(' ');
      const year = titleParts[0];
      const make = titleParts[1];
      const model = titleParts.slice(2).join(' ').split(' ')[0];

      // Makes
      if (make && make.trim() !== '') {
        counts[`make_${make}`] = (counts[`make_${make}`] || 0) + 1;
      }

      // Models
      if (model && model.trim() !== '') {
        counts[`model_${model}`] = (counts[`model_${model}`] || 0) + 1;
      }

      // Years
      if (year && !isNaN(year) && year.length === 4) {
        counts[`year_${year}`] = (counts[`year_${year}`] || 0) + 1;
      }

      // Extract from meta_data if available
      const metaData = vehicle.meta_data || [];

      metaData.forEach(meta => {
        const key = meta.key;
        const value = meta.value;

        if (value && value.toString().trim() !== '') {
          if (key === 'condition') {
            counts[`condition_${value}`] = (counts[`condition_${value}`] || 0) + 1;
          } else if (key === 'body_type' || key === 'vehicleType') {
            counts[`bodyType_${value}`] = (counts[`bodyType_${value}`] || 0) + 1;
          } else if (key === 'drivetrain' || key === 'drive_type') {
            counts[`drivetrain_${value}`] = (counts[`drivetrain_${value}`] || 0) + 1;
          } else if (key === 'transmission') {
            counts[`transmission_${value}`] = (counts[`transmission_${value}`] || 0) + 1;
          } else if (key === 'exterior_color') {
            counts[`exteriorColor_${value}`] = (counts[`exteriorColor_${value}`] || 0) + 1;
          } else if (key === 'interior_color') {
            counts[`interiorColor_${value}`] = (counts[`interiorColor_${value}`] || 0) + 1;
          } else if (key === 'fuel_type') {
            counts[`fuelType_${value}`] = (counts[`fuelType_${value}`] || 0) + 1;
          } else if (key === 'trim') {
            counts[`trim_${value}`] = (counts[`trim_${value}`] || 0) + 1;
          }
        }
      });

      // Default values for common fields
      counts['condition_Used'] = (counts['condition_Used'] || 0) + 1;
      counts['transmission_Automatic'] = (counts['transmission_Automatic'] || 0) + 1;
      counts['drivetrain_FWD'] = (counts['drivetrain_FWD'] || 0) + 1;
    });

    // Convert counts to filter options format
    Object.keys(counts).forEach(key => {
      const [category, value] = key.split('_');
      const count = counts[key];

      if (category === 'make') {
        options.makes.push({ name: value, count });
      } else if (category === 'model') {
        options.models.push({ name: value, count });
      } else if (category === 'year') {
        options.years.push({ name: value, count });
      } else if (category === 'condition') {
        options.conditions.push({ name: value, count });
      } else if (category === 'bodyType') {
        options.bodyTypes.push({ name: value, count });
      } else if (category === 'drivetrain') {
        options.drivetrains.push({ name: value, count });
      } else if (category === 'transmission') {
        options.transmissions.push({ name: value, count });
      } else if (category === 'exteriorColor') {
        options.exteriorColors.push({ name: value, count });
      } else if (category === 'interiorColor') {
        options.interiorColors.push({ name: value, count });
      } else if (category === 'fuelType') {
        options.fuelTypes.push({ name: value, count });
      } else if (category === 'trim') {
        options.trims.push({ name: value, count });
      }
    });

    // Sort each category by count (most popular first)
    Object.keys(options).forEach(category => {
      options[category].sort((a, b) => b.count - a.count);
    });

    // Cache the result for future use
    filterOptionsCache.current.set(cacheKey, options);

    // Limit cache size to prevent memory leaks
    if (filterOptionsCache.current.size > 10) {
      const firstKey = filterOptionsCache.current.keys().next().value;
      filterOptionsCache.current.delete(firstKey);
    }

    console.log('✅ Filter options calculated:', {
      makes: options.makes.length,
      models: options.models.length,
      conditions: options.conditions.length,
      fromVehicles: vehicles.length
    });

    return options;
  }, []);

  // Request deduplication map
  const activeRequests = useRef(new Map());

  // Preload next page for instant pagination
  const preloadNextPage = useCallback(async (currentPage, currentFilters) => {
    const nextPage = currentPage + 1;

    // Don't preload if we're already on the last page
    if (nextPage > totalPages) return;

    const preloadKey = `page_${nextPage}_${JSON.stringify(currentFilters)}`;

    // Don't preload if already cached
    if (preloadedPages.has(preloadKey)) {
      console.log(`🚀 Page ${nextPage} already preloaded`);
      return;
    }

    try {
      console.log(`🚀 PRELOADING page ${nextPage} in background...`);
      const preloadedData = await fetchVehiclesPaginated(nextPage, itemsPerPage, currentFilters);

      setPreloadedPages(prev => {
        const updated = new Map(prev);
        updated.set(preloadKey, {
          data: preloadedData,
          timestamp: Date.now()
        });

        // Limit cache size to prevent memory issues
        if (updated.size > 5) {
          const firstKey = updated.keys().next().value;
          updated.delete(firstKey);
        }

        return updated;
      });

      // Preload images for instant display
      preloadedData.vehicles.forEach((vehicle) => {
        const imageUrl = vehicle.images?.[0] || vehicle.image;
        if (imageUrl && !imageUrl.includes('/api/placeholder')) {
          const img = new Image();
          img.src = imageUrl;
        }
      });

      console.log(`✅ Page ${nextPage} preloaded with ${preloadedData.vehicles.length} vehicles`);
    } catch (error) {
      console.warn(`⚠️ Failed to preload page ${nextPage}:`, error.message);
    }
  }, [totalPages, itemsPerPage, preloadedPages]);

  // Fetch full inventory for accurate filter counts (separate from pagination)
  const fetchFullInventoryForFilters = useCallback(async () => {
    try {
      console.log('📊 Fetching FULL inventory for accurate filter counts...');
      const fullVehicles = await fetchAllFilteredVehicles({});
      setFullInventory(fullVehicles);

      // Calculate filter options from FULL inventory
      const fullFilterOptions = extractFilterOptions(fullVehicles);
      setFilterOptions(fullFilterOptions);

      console.log(`✅ Full inventory loaded: ${fullVehicles.length} vehicles for accurate filter counts`);
    } catch (error) {
      console.warn('⚠️ Could not fetch full inventory for filters:', error.message);
      // Fallback to current page filter options if needed
    }
  }, [extractFilterOptions]);

  // Function to fetch vehicles with server-side pagination
  const fetchVehiclesPage = useCallback(async (page = currentPage, newFilters = filters) => {
    // Create unique request key for deduplication
    const requestKey = JSON.stringify({ page, filters: newFilters, itemsPerPage });

    // Check if same request is already in progress
    if (activeRequests.current.has(requestKey)) {
      return activeRequests.current.get(requestKey);
    }

    setLoading(true);
    setError(null);

    try {
      const startTime = Date.now();

      // 🚀 SMART SEQUENTIAL FILTERING: Check if we can use cached data (Ford → Explorer)
      if (apiConnected && canUseSequentialCache(newFilters, filters)) {
        const makeFilter = newFilters.make[0];
        const cacheKey = `make_${makeFilter}`;
        const cachedResult = filterCachedVehicles(cacheKey, newFilters);

        if (cachedResult) {
          console.log(`⚡ ULTRA-FAST: Using cached ${makeFilter} vehicles for model filtering`);

          // Apply pagination to cached results
          const startIndex = (page - 1) * itemsPerPage;
          const paginatedVehicles = cachedResult.vehicles.slice(startIndex, startIndex + itemsPerPage);

          const fastResult = {
            ...cachedResult,
            vehicles: paginatedVehicles,
            currentPage: page
          };

          // Update state immediately with cached data
          setVehicles(fastResult.vehicles);
          setTotalResults(fastResult.totalResults);
          setTotalPages(fastResult.totalPages);
          setCurrentPage(fastResult.currentPage);
          setSearchTime(fastResult.searchTime);
          setApiConnected(true);
          setError(null);

          updateURL(newFilters, page);
          setLoading(false);

          console.log(`🎯 CACHED RESULT: ${fastResult.vehicles.length} vehicles in ${fastResult.searchTime}ms`);
          return;
        }
      }

      // Create and store request promise for deduplication
      const requestPromise = fetchVehiclesPaginated(page, itemsPerPage, newFilters);
      activeRequests.current.set(requestKey, requestPromise);

      // Regular API call when cache not available
      const result = await requestPromise;

      // Clean up completed request from deduplication map
      activeRequests.current.delete(requestKey);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (result.error) {
        throw new Error(result.error);
      }

      // Update state with paginated results
      setVehicles(result.vehicles);
      setTotalResults(result.totalResults);
      setTotalPages(result.totalPages);
      setCurrentPage(result.currentPage);
      setSearchTime(result.searchTime || responseTime);

      // Track search performance
      performanceMonitor.trackSearch(
        result.searchTime || responseTime,
        result.totalResults,
        result.isCached || false
      );

      // Reset batch loading for new vehicle data
      resetBatches();

      // Properly detect if we're using real API data vs demo data
      const isRealAPIData = !result.isDemo;
      setApiConnected(isRealAPIData);
      setError(null);

      // 🚀 CRITICAL FIX: Don't update filter options from current page!
      // Filter options should come from FULL inventory, not current page
      // This was the main cause of incorrect filter counts

      // Only update full inventory and filter options on initial load or filter changes
      if (page === 1 || fullInventory.length === 0) {
        fetchFullInventoryForFilters();
      }

      console.log(`🎯 Page ${page}: ${result.vehicles.length} vehicles loaded in ${result.searchTime || responseTime}ms`);
      console.log(`📊 Total inventory: ${result.totalResults.toLocaleString()} vehicles`);

      // 🚀 SMART CACHING: Store make-specific data for Ford → Explorer scenarios
      if (isRealAPIData && newFilters.make && newFilters.make.length === 1 && !newFilters.model?.length) {
        const makeFilter = newFilters.make[0];
        const cacheKey = `make_${makeFilter}`;

        setCachedVehicles(prev => {
          const updated = new Map(prev);
          updated.set(cacheKey, {
            vehicles: result.allVehicles || result.vehicles,
            timestamp: Date.now(),
            totalResults: result.totalResults
          });
          console.log(`💾 CACHED: ${makeFilter} vehicles (${result.totalResults} total)`);
          return updated;
        });
      }

      // Update URL
      updateURL(newFilters, page);

      // 🚀 PRELOAD NEXT PAGE for instant pagination
      if (page < totalPages && !loading) {
        // Small delay to not interfere with current page loading
        setTimeout(() => {
          preloadNextPage(page, newFilters);
        }, 500);
      }

    } catch (error) {
      console.error('❌ Unexpected error in fetchVehiclesPage:', error);
      setError(`Unexpected error: ${error.message}`);
      setApiConnected(false);

      // Clean up failed request from deduplication map
      activeRequests.current.delete(requestKey);

      setVehicles([]);
      setTotalResults(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedFilters, updateURL, canUseSequentialCache, filterCachedVehicles, apiConnected, fullInventory.length, fetchFullInventoryForFilters, totalPages, loading, preloadNextPage, resetBatches]);

  // Handle page changes with preloaded data for instant loading
  const handlePageChange = useCallback((newPage) => {
    console.log(`📄 Page changed to: ${newPage}`);

    const preloadKey = `page_${newPage}_${JSON.stringify(debouncedFilters)}`;
    const preloadedData = preloadedPages.get(preloadKey);

    // Use preloaded data if available for INSTANT page changes
    if (preloadedData && (Date.now() - preloadedData.timestamp < 30000)) {
      console.log(`⚡ INSTANT LOAD: Using preloaded data for page ${newPage}`);

      const data = preloadedData.data;
      setVehicles(data.vehicles);
      setTotalResults(data.totalResults);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
      setSearchTime(data.searchTime || 1); // Show as very fast
      setError(null);

      updateURL(debouncedFilters, newPage);

      // Remove used preloaded data to save memory
      setPreloadedPages(prev => {
        const updated = new Map(prev);
        updated.delete(preloadKey);
        return updated;
      });

      // Preload the NEXT page now
      setTimeout(() => {
        preloadNextPage(newPage, debouncedFilters);
      }, 100);

    } else {
      // Fallback to regular loading if no preloaded data
      console.log(`🔄 Regular load for page ${newPage} (no preloaded data)`);
      setCurrentPage(newPage);
      fetchVehiclesPage(newPage, debouncedFilters);
    }

    // Smooth scroll to results
    const resultsElement = document.querySelector('.vehicle-grid');
    if (resultsElement) {
      resultsElement.scrollIntoView({ behavior: 'smooth' });
    }
  }, [debouncedFilters, fetchVehiclesPage, preloadedPages, updateURL, preloadNextPage, resetBatches]);

  // Debounced filter handler to prevent rapid API calls
  const debouncedFilterChange = useCallback((newFilters) => {
    setCurrentPage(1);
    fetchVehiclesPage(1, newFilters);
  }, [fetchVehiclesPage]);

  // Handle filter changes with smart debouncing
  const handleFilterChange = useCallback((key, value, immediate = false) => {
    console.log(`🔄 Filter changed: ${key} = ${value} (immediate: ${immediate})`);

    // Track filter change
    performanceMonitor.trackFilterChange(key, value);

    // Show optimistic loading for text inputs only
    if (!immediate && ['priceMin', 'priceMax', 'paymentMin', 'paymentMax', 'zipCode', 'interestRate', 'downPayment'].includes(key)) {
      setOptimisticLoading(true);
    }

    // Update filter using debounced system
    updateFilter(key, value, immediate);
  }, [updateFilter]);

  // Handle sort changes
  const handleSortChange = useCallback((newSortBy) => {
    console.log(`🔄 Sort changed to: ${newSortBy}`);
    setSortBy(newSortBy);
    setCurrentPage(1);
    fetchVehiclesPage(1, debouncedFilters);
  }, [debouncedFilters, fetchVehiclesPage]);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    console.log(`📋 Items per page changed to: ${newItemsPerPage}`);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    fetchVehiclesPage(1, debouncedFilters);
  }, [debouncedFilters, fetchVehiclesPage]);

  // Initial data load and bundle optimization
  useEffect(() => {
    console.log('🚀 App initialized - loading first page and full inventory for filters');
    fetchVehiclesPage(currentPage, debouncedFilters);
    // Note: fetchFullInventoryForFilters is called within fetchVehiclesPage for page 1

    // Optimize chunk loading for better performance
    optimizeChunkLoading();

    // Start performance monitoring in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Performance monitoring started');
      // Log bundle info periodically in development
      setTimeout(() => {
        const { logBundleInfo } = require('./utils/bundleAnalyzer');
        logBundleInfo();
      }, 5000);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search || '');
        const newFilters = URLParamsToFilters(urlParams);
        const pageParam = urlParams.get('page') || '1';
        const newPage = parseInt(pageParam, 10);
        const safePage = (newPage > 0 && newPage < 10000) ? newPage : 1;

        forceUpdateFilters(newFilters); // Force immediate update for navigation
        setCurrentPage(safePage);
        fetchVehiclesPage(safePage, newFilters);
      } catch (error) {
        console.warn('Failed to handle browser navigation:', error);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [fetchVehiclesPage, forceUpdateFilters]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Toggle favorites
  const toggleFavorite = (vehicleId, vehicle) => {
    setFavorites(prev => ({
      ...prev,
      [vehicleId]: !prev[vehicleId]
    }));
  };

  // Calculate display metrics
  const startResult = totalResults > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endResult = Math.min(currentPage * itemsPerPage, totalResults);

  // Handle favorites toggle
  const handleToggleFavorites = () => {
    setShowingFavorites(!showingFavorites);
    if (!showingFavorites) {
      const favoriteVehicles = vehicles.filter(v => favorites[v.id]);
      setVehicles(favoriteVehicles);
    } else {
      fetchVehiclesPage(currentPage, debouncedFilters);
    }
  };

  return (
    <ErrorBoundary
      level="app"
      onReset={() => {
        // Complete app reset
        const initial = getInitialFilters();
        resetFilters(initial);
        setVehicles([]);
        setCachedVehicles(new Map());
        setPreloadedPages(new Map());
        setCurrentPage(1);
        setError(null);
        fetchVehiclesPage(1, initial);
      }}
    >
      <div className="App">
        <header className="app-header">
          <h1>Carzino Vehicle Search</h1>
          <div className="connection-status">
            {loading ? (
              <p>🔄 Loading vehicles...</p>
            ) : error ? (
              <p className="error">❌ {error}</p>
            ) : (
              <div className="status-info">
                <p>{apiConnected ? '✅ Connected to WooCommerce inventory' : '🎯 Demo Mode - WooCommerce API unreachable'} ({totalResults.toLocaleString()} {apiConnected ? 'vehicles' : 'sample vehicles'})</p>
                <div className="search-stats">
                  <span>📄 Showing {startResult.toLocaleString()}-{endResult.toLocaleString()}</span>
                  <span>⏱️ Search: {searchTime}ms{searchTime < 50 ? ' ⚡ CACHED' : ''}</span>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="main-container">
          {/* Search and Filter Section - Sidebar */}
          <FilterErrorBoundary
          onRetry={() => fetchVehiclesPage(currentPage, debouncedFilters)}
          onReset={() => {
            const initial = getInitialFilters();
            resetFilters(initial);
            fetchVehiclesPage(1, initial);
          }}
        >
            <VehicleSearchFilter
              filters={filters}
              onFiltersChange={handleFilterChange}
              loading={loading}
              filterOptions={filterOptions}
              isOpen={isMobileFiltersOpen}
              onClose={isMobile ? () => setIsMobileFiltersOpen(false) : null}
              isMobile={isMobile}
            />
          </FilterErrorBoundary>


          {/* Main Content Area */}
          <div className="main-content">

            {/* 🚀 Fast Loading Indicator for Filter Updates */}
          {(optimisticLoading || filtersArePending) && (
            <div style={{
              position: 'fixed',
              top: '10px',
              right: '10px',
              background: filtersArePending ? 'rgba(59, 130, 246, 0.9)' : 'rgba(34, 197, 94, 0.9)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '500',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              animation: 'pulse 1s infinite'
            }}>
              {filtersArePending ? '⏳ Processing filters...' : '⚡ Updating filters...'}
            </div>
          )}
            {/* Results Header with Sort and View Options */}
            <SearchResultsHeader
            totalResults={totalResults}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            startResult={startResult}
            endResult={endResult}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            searchTime={optimisticLoading || filtersArePending ? 'Updating...' : (searchTime < 100 && searchTime > 0 ? `${searchTime}ms ⚡ CACHED` : searchTime)}
            currentFilters={debouncedFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onMobileFiltersOpen={isMobile ? () => setIsMobileFiltersOpen(true) : null}
            favoritesCount={Object.values(favorites).filter(Boolean).length}
            showingFavorites={showingFavorites}
            onToggleFavorites={handleToggleFavorites}
            isMobile={isMobile}
            mobileFiltersOpen={isMobileFiltersOpen}
          />

            {/* Vehicle Grid */}
            <VehicleGridErrorBoundary
            onRetry={() => fetchVehiclesPage(currentPage, debouncedFilters)}
            onReset={() => {
              // Clear cache and reset to first page
              setCachedVehicles(new Map());
              setPreloadedPages(new Map());
              fetchVehiclesPage(1, debouncedFilters);
            }}
          >
              {loading ? (
                <div className={`vehicle-grid ${viewMode}-view p-2`}>
                  {Array.from({ length: itemsPerPage }, (_, index) => (
                    <VehicleCardSkeleton key={`skeleton-${index}`} />
                  ))}
                </div>
              ) : error ? (
                <div className="error-container">
                  <p>Error loading vehicles: {error}</p>
                  <button onClick={() => fetchVehiclesPage(currentPage, debouncedFilters)}>Try Again</button>
                </div>
              ) : vehicles.length === 0 ? (
                <div className="no-results" style={isMobile ? {paddingLeft: '20px', paddingRight: '20px'} : {}}>
                  <h3>No vehicles found</h3>
                  <p>Try adjusting your search filters</p>
                </div>
              ) : (
                <>
                  <div className={`vehicle-grid ${viewMode}-view p-2`}>
                    {visibleVehicles.map((vehicle, index) => (
                      <VehicleCardErrorBoundary
                        key={`boundary-${vehicle.id}-${currentPage}-${index}`}
                        vehicleId={vehicle.id}
                      >
                        <LazyVehicleCard
                          key={`${vehicle.id}-${currentPage}-${index}`}
                          vehicle={vehicle}
                          favorites={favorites}
                          onFavoriteToggle={toggleFavorite}
                          index={index}
                          priority={index < 3} // First 3 cards load immediately
                        />
                      </VehicleCardErrorBoundary>
                    ))}
                  </div>

                  {/* Load More Vehicles Button for Batch Loading */}
                  {hasMoreBatches && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      padding: '20px',
                      borderTop: '1px solid #e5e7eb',
                      marginTop: '20px'
                    }}>
                      <button
                        onClick={loadNextBatch}
                        disabled={batchLoading}
                        style={{
                          padding: '12px 24px',
                          backgroundColor: batchLoading ? '#9ca3af' : '#2563eb',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: '500',
                          cursor: batchLoading ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          if (!batchLoading) e.target.style.backgroundColor = '#1d4ed8';
                        }}
                        onMouseOut={(e) => {
                          if (!batchLoading) e.target.style.backgroundColor = '#2563eb';
                        }}
                      >
                        {batchLoading ? (
                          <>
                            <div style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid #ffffff',
                              borderTop: '2px solid transparent',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }}></div>
                            Loading more vehicles...
                          </>
                        ) : (
                          <>
                            ⬇️ Load More Vehicles ({vehicles.length - visibleVehicles.length} remaining)
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Performance Info for Development */}
                  {process.env.NODE_ENV === 'development' && (
                    <div style={{
                      padding: '8px 16px',
                      margin: '10px 0',
                      backgroundColor: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#0369a1',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        📊 Lazy Loading: Showing {batchInfo.itemsShown}/{batchInfo.totalItems} vehicles
                        (Batch {batchInfo.current}/{batchInfo.total})
                        {filtersArePending && (
                          <span style={{ marginLeft: '12px', color: '#dc2626' }}>
                            ⏳ Filters pending debounce
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setShowBundleAnalysis(!showBundleAnalysis)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          border: '1px solid #0369a1',
                          borderRadius: '4px',
                          backgroundColor: showBundleAnalysis ? '#0369a1' : 'transparent',
                          color: showBundleAnalysis ? 'white' : '#0369a1',
                          cursor: 'pointer',
                          marginLeft: '8px'
                        }}
                      >
                        📦 Bundle
                      </button>
                    </div>
                  )}
                </>
              )}
            </VehicleGridErrorBoundary>

            {/* Pagination */}
            {totalPages > 1 && (
              <PaginationErrorBoundary onRetry={() => fetchVehiclesPage(currentPage, debouncedFilters)}>
                <Suspense fallback={<div className="flex justify-center py-4"><div className="loading-spinner"></div></div>}>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalResults={totalResults}
                    resultsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                  />
                </Suspense>
              </PaginationErrorBoundary>
            )}
          </div>
        </div>
      </div>

      {/* Bundle Analysis Panel (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <BundleAnalysisPanel
          isVisible={showBundleAnalysis}
          onClose={() => setShowBundleAnalysis(false)}
        />
      )}
    </ErrorBoundary>
  );
}

export default App;

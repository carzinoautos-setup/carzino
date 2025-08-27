import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import './App.css';
import VehicleSearchFilter from './components/VehicleSearchFilter';
import VehicleCard from './components/VehicleCard';
import VehicleCardSkeleton from './components/VehicleCardSkeleton';
import SearchResultsHeader from './components/SearchResultsHeader';
import { fetchVehiclesPaginated } from './services/api-paginated';

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
    if (key === 'page' || key === 'reload' || !value || value.length > 50) {
      continue;
    }

    if (/^\d{10,}$/.test(value)) {
      continue;
    }

    if (filters.hasOwnProperty(key)) {
      if (Array.isArray(filters[key])) {
        if (!filters[key].includes(value)) {
          filters[key].push(value);
        }
      } else {
        filters[key] = value;
      }
    }
  }

  return filters;
};

// Demo data functions moved to API service for better organization

function App() {
  // Initialize filters from URL parameters
  const getInitialFilters = () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.toString()) {
      return URLParamsToFilters(urlParams);
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

  // State management
  const [filters, setFilters] = useState(getInitialFilters);

  // Data state
  const [vehicles, setVehicles] = useState([]);
  const [filterOptions, setFilterOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [optimisticLoading, setOptimisticLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiConnected, setApiConnected] = useState(false);

  // Caching state for sequential filtering performance
  const [cachedVehicles, setCachedVehicles] = useState(new Map());

  const [favorites, setFavorites] = useState({});
  const [currentPage, setCurrentPage] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get('page');
    return pageParam ? parseInt(pageParam, 10) : 1;
  });
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showingFavorites, setShowingFavorites] = useState(false);

  // Pagination state
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(19); // 🚀 PERFORMANCE: Show 19 results as requested
  const [searchTime, setSearchTime] = useState(0);

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

  // Extract filter options from vehicle data with memoization
  const extractFilterOptions = useCallback((vehicles) => {
    // Create cache key based on vehicle IDs and count
    const cacheKey = vehicles.map(v => v.id).sort().join('-') + '-' + vehicles.length;

    // Return cached result if available
    if (filterOptionsCache.current.has(cacheKey)) {
      // console.log('🚀 Using cached filter options');
      return filterOptionsCache.current.get(cacheKey);
    }

    // console.log('⚙️ Calculating filter options for', vehicles.length, 'vehicles');
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

    return options;
  }, []);

  // Request deduplication map
  const activeRequests = useRef(new Map());

  // Function to fetch vehicles with server-side pagination
  const fetchVehiclesPage = useCallback(async (page = currentPage, newFilters = filters) => {
    // Create unique request key for deduplication
    const requestKey = JSON.stringify({ page, filters: newFilters, itemsPerPage });

    // Check if same request is already in progress
    if (activeRequests.current.has(requestKey)) {
      // console.log('🔄 DEDUP: Request already in progress, skipping duplicate');
      return activeRequests.current.get(requestKey);
    }

    setLoading(true);
    setError(null);

    try {
      const startTime = Date.now();

      // 🚀 SMART SEQUENTIAL FILTERING: Check if we can use cached data (Ford → Explorer)
      // Only use caching when we have a reliable API connection
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

          // Update filter options from cached data
          const filterOptionsExtracted = extractFilterOptions(cachedResult.vehicles);
          setFilterOptions(filterOptionsExtracted);

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

      // Update state with paginated results (could be real API data or demo data)
      setVehicles(result.vehicles);
      setTotalResults(result.totalResults);
      setTotalPages(result.totalPages);
      setCurrentPage(result.currentPage);
      setSearchTime(result.searchTime || responseTime);

      // Properly detect if we're using real API data vs demo data
      const isRealAPIData = !result.isDemo;
      setApiConnected(isRealAPIData);

      // API connection confirmed

      // Clear any previous errors if we successfully got data (even if demo)
      setError(null);

      // Clear any previous errors since we got data
      setError(null);

      // FAST LOADING: Use current page vehicles for immediate filter options
      const quickFilterOptions = extractFilterOptions(result.vehicles);
      setFilterOptions(quickFilterOptions);

      // 🚀 PERFORMANCE: Skip background fetch for immediate speed
      // Use only current page filter options for ultra-fast loading

      console.log(`🎯 Total: ${result.totalResults.toLocaleString()} vehicles in ${result.searchTime || responseTime}ms`);

      // 🚀 SMART CACHING: Store make-specific data for Ford → Explorer scenarios
      if (isRealAPIData && newFilters.make && newFilters.make.length === 1 && !newFilters.model?.length) {
        const makeFilter = newFilters.make[0];
        const cacheKey = `make_${makeFilter}`;

        // Cache the full result for this make (e.g., all Ford vehicles)
        setCachedVehicles(prev => {
          const updated = new Map(prev);
          updated.set(cacheKey, {
            vehicles: result.allVehicles || result.vehicles, // Store all vehicles if available
            timestamp: Date.now(),
            totalResults: result.totalResults
          });
          console.log(`💾 CACHED: ${makeFilter} vehicles (${result.totalResults} total)`);
          return updated;
        });
      }

      // Update URL
      updateURL(newFilters, page);

    } catch (error) {
      console.error('❌ Unexpected error in fetchVehiclesPage:', error);
      setError(`Unexpected error: ${error.message}`);
      setApiConnected(false);

      // Clean up failed request from deduplication map
      activeRequests.current.delete(requestKey);

      // This should rarely happen now since API service handles fallbacks
      // But just in case, provide a minimal fallback
      setVehicles([]);
      setTotalResults(0);
      setTotalPages(0);
      setFilterOptions({});
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filters, updateURL, extractFilterOptions, canUseSequentialCache, filterCachedVehicles, apiConnected]);

  // Handle page changes
  const handlePageChange = useCallback((newPage) => {
    console.log(`📄 Page changed to: ${newPage}`);
    setCurrentPage(newPage);
    fetchVehiclesPage(newPage, filters);
    
    const resultsElement = document.querySelector('.vehicle-grid');
    if (resultsElement) {
      resultsElement.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filters, fetchVehiclesPage]);

  // Debounced filter handler to prevent rapid API calls
  const debouncedFilterChange = useCallback((newFilters) => {
    setCurrentPage(1);
    fetchVehiclesPage(1, newFilters);
  }, [fetchVehiclesPage]);

  // Handle filter changes with optimistic loading and debouncing
  const handleFilterChange = useCallback((newFilters) => {
    console.log('🔄 Filters changed:', newFilters);
    setFilters(newFilters);

    // Show instant optimistic loading state
    setOptimisticLoading(true);

    // Clear previous timeout
    if (window.filterTimeout) {
      clearTimeout(window.filterTimeout);
    }

    // Debounce API calls by 300ms to prevent rapid requests
    window.filterTimeout = setTimeout(() => {
      setOptimisticLoading(false);
      debouncedFilterChange(newFilters);
    }, 300);
  }, [debouncedFilterChange]);

  // Handle sort changes
  const handleSortChange = useCallback((newSortBy) => {
    console.log(`🔄 Sort changed to: ${newSortBy}`);
    setSortBy(newSortBy);
    setCurrentPage(1);
    fetchVehiclesPage(1, filters);
  }, [filters, fetchVehiclesPage]);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    console.log(`📋 Items per page changed to: ${newItemsPerPage}`);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    fetchVehiclesPage(1, filters);
  }, [filters, fetchVehiclesPage]);

  // Initial data load
  useEffect(() => {
    fetchVehiclesPage(currentPage, filters);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const newFilters = URLParamsToFilters(urlParams);
      const newPage = parseInt(urlParams.get('page') || '1', 10);

      setFilters(newFilters);
      setCurrentPage(newPage);
      fetchVehiclesPage(newPage, newFilters);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [fetchVehiclesPage]);

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
      fetchVehiclesPage(currentPage, filters);
    }
  };

  return (
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
        <VehicleSearchFilter
          filters={filters}
          onFiltersChange={handleFilterChange}
          loading={loading}
          filterOptions={filterOptions}
          isOpen={isMobileFiltersOpen}
          onClose={isMobile ? () => setIsMobileFiltersOpen(false) : null}
          isMobile={isMobile}
        />


        {/* Main Content Area */}
        <div className="main-content">
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
            searchTime={optimisticLoading ? 'Updating...' : searchTime}
            currentFilters={filters}
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
          {loading ? (
            <div className={`vehicle-grid ${viewMode}-view p-2`}>
              {Array.from({ length: itemsPerPage }, (_, index) => (
                <VehicleCardSkeleton key={`skeleton-${index}`} />
              ))}
            </div>
          ) : error ? (
            <div className="error-container">
              <p>Error loading vehicles: {error}</p>
              <button onClick={() => fetchVehiclesPage(currentPage, filters)}>Try Again</button>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="no-results" style={isMobile ? {paddingLeft: '20px', paddingRight: '20px'} : {}}>
              <h3>No vehicles found</h3>
              <p>Try adjusting your search filters</p>
            </div>
          ) : (
            <div className={`vehicle-grid ${viewMode}-view p-2`}>
              {vehicles.map((vehicle, index) => (
                <VehicleCard
                  key={`${vehicle.id}-${currentPage}-${index}`}
                  vehicle={vehicle}
                  favorites={favorites}
                  onFavoriteToggle={toggleFavorite}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Suspense fallback={<div className="flex justify-center py-4"><div className="loading-spinner"></div></div>}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalResults={totalResults}
                resultsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

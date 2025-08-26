import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import VehicleSearchFilter from './components/VehicleSearchFilter';
import VehicleCard from './components/VehicleCard';
import Pagination from './components/Pagination';
import SearchResultsHeader from './components/SearchResultsHeader';
import { fetchVehiclesPaginated, fetchAllFilteredVehicles } from './services/api-paginated';

// URL parameter helpers
const filtersToURLParams = (filters, page = 1) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (!value ||
        (Array.isArray(value) && value.length === 0) ||
        ['zipCode', 'radius', 'termLength', 'interestRate', 'downPayment'].includes(key)) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(item => params.append(key, item));
    } else if (value.toString().trim() !== '') {
      params.set(key, value.toString());
    }
  });

  if (page > 1) {
    params.set('page', page.toString());
  }

  return params.toString();
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
  const [error, setError] = useState(null);
  const [apiConnected, setApiConnected] = useState(false);

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
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [searchTime, setSearchTime] = useState(0);

  // Update URL when filters or page change
  const updateURL = useCallback((newFilters, page = currentPage) => {
    const params = filtersToURLParams(newFilters, page);
    const newURL = params ? `${window.location.pathname}?${params}` : window.location.pathname;

    if (newURL !== window.location.pathname + window.location.search) {
      window.history.pushState(null, '', newURL);
    }
  }, [currentPage]);

  // Extract filter options from vehicle data
  const extractFilterOptions = useCallback((vehicles) => {
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

    return options;
  }, []);

  // Function to fetch vehicles with server-side pagination
  const fetchVehiclesPage = useCallback(async (page = currentPage, newFilters = filters) => {
    console.log(`🔍 Loading page ${page} with filters:`, newFilters);
    setLoading(true);
    setError(null);

    try {
      const startTime = Date.now();
      
      // Use the new paginated API
      const result = await fetchVehiclesPaginated(page, itemsPerPage, newFilters);
      
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
      setApiConnected(!result.isDemo); // Set false if demo data

      // Clear any previous errors if we successfully got data (even if demo)
      setError(null);

      // Clear any previous errors since we got data
      setError(null);

      // FAST LOADING: Use current page vehicles for immediate filter options
      const quickFilterOptions = extractFilterOptions(result.vehicles);
      setFilterOptions(quickFilterOptions);
      console.log('⚡ Fast loading: Immediate filter options from current page');

      // BACKGROUND: Fetch proper conditional filter options asynchronously (non-blocking)
      const hasActiveFilters = Object.entries(newFilters).some(([key, values]) => {
        if (['zipCode', 'radius', 'termLength', 'interestRate', 'downPayment', 'priceMin', 'priceMax', 'paymentMin', 'paymentMax'].includes(key)) {
          return false;
        }
        return Array.isArray(values) ? values.length > 0 : (values && values.toString().trim() !== '');
      });

      if (hasActiveFilters) {
        // Non-blocking background fetch for conditional filtering
        fetchAllFilteredVehicles(newFilters)
          .then(allFilteredVehicles => {
            const conditionalFilterOptions = extractFilterOptions(allFilteredVehicles);
            setFilterOptions(conditionalFilterOptions);
            console.log('🎯 Background update: Conditional filter options from', allFilteredVehicles.length, 'filtered vehicles');
          })
          .catch(error => {
            console.warn('⚠️ Background filter options fetch failed:', error.message);
            // Keep the quick filter options if background fetch fails
          });
      }

      const dataSource = result.isDemo ? 'demo data' : 'API';
      console.log(`✅ Loaded page ${page}: ${result.vehicles.length} vehicles from ${dataSource}`);
      console.log(`�� Total: ${result.totalResults.toLocaleString()} vehicles in ${result.searchTime || responseTime}ms`);

      // Update URL
      updateURL(newFilters, page);
      
    } catch (error) {
      console.error('❌ Unexpected error in fetchVehiclesPage:', error);
      setError(`Unexpected error: ${error.message}`);
      setApiConnected(false);

      // This should rarely happen now since API service handles fallbacks
      // But just in case, provide a minimal fallback
      setVehicles([]);
      setTotalResults(0);
      setTotalPages(0);
      setFilterOptions({});
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filters, updateURL, extractFilterOptions]);

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

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters) => {
    console.log('🔄 Filters changed:', newFilters);
    setFilters(newFilters);
    setCurrentPage(1);
    fetchVehiclesPage(1, newFilters);
  }, [fetchVehiclesPage]);

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
                <span>⏱️ Search: {searchTime}ms</span>
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
          onClose={() => setIsMobileFiltersOpen(false)}
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
            searchTime={searchTime}
            currentFilters={filters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onMobileFiltersOpen={() => setIsMobileFiltersOpen(true)}
            favoritesCount={Object.values(favorites).filter(Boolean).length}
            showingFavorites={showingFavorites}
            onToggleFavorites={handleToggleFavorites}
          />

          {/* Vehicle Grid */}
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading vehicles...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <p>Error loading vehicles: {error}</p>
              <button onClick={() => fetchVehiclesPage(currentPage, filters)}>Try Again</button>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="no-results">
              <h3>No vehicles found</h3>
              <p>Try adjusting your search filters</p>
            </div>
          ) : (
            <>
              {/* Vehicle Cards */}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalResults={totalResults}
                  resultsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

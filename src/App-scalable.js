import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import VehicleSearchFilter from './components/VehicleSearchFilter';
import VehicleCard from './components/VehicleCard';
import Pagination from './components/Pagination';
import SearchResultsHeader from './components/SearchResultsHeader';
import { vehicleAPI } from './services/scalable-api';

// Performance optimization: Debounce search input
const useDebounce = (value, delay) => {
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

function App() {
  // State management optimized for large scale
  const [vehicles, setVehicles] = useState([]);
  const [filterOptions, setFilterOptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const resultsPerPage = 25; // Optimized for performance

  // Filter state - optimized structure
  const [filters, setFilters] = useState({
    make: [],
    model: [],
    year: [],
    condition: [],
    bodyType: [],
    fuelType: [],
    transmission: [],
    priceMin: '',
    priceMax: '',
    mileageMax: '',
    zipCode: '',
    radius: '50'
  });

  // UI state
  const [favorites, setFavorites] = useState({});
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [showingFavorites, setShowingFavorites] = useState(false);

  // Debounce search query for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const savedFavorites = JSON.parse(localStorage.getItem('carzino_favorites') || '{}');
      setFavorites(savedFavorites);
    } catch (error) {
      console.warn('Failed to load favorites:', error);
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = useCallback((newFavorites) => {
    setFavorites(newFavorites);
    try {
      localStorage.setItem('carzino_favorites', JSON.stringify(newFavorites));
    } catch (error) {
      console.warn('Failed to save favorites:', error);
    }
  }, []);

  // Main vehicle search function
  const searchVehicles = useCallback(async (page = 1, resetResults = false) => {
    setLoading(true);
    setError(null);

    try {
      // Prepare search parameters
      const searchParams = {
        ...filters,
        query: debouncedSearchQuery,
        sort: sortBy,
        favorites: showingFavorites ? Object.keys(favorites) : undefined
      };

      console.log(`🔍 Searching vehicles - Page ${page}:`, searchParams);

      // Call scalable API instead of WooCommerce
      const response = await vehicleAPI.searchVehicles(
        searchParams,
        page,
        resultsPerPage
      );

      if (resetResults || page === 1) {
        setVehicles(response.vehicles);
      } else {
        // Append results for pagination (if implementing infinite scroll)
        setVehicles(prev => [...prev, ...response.vehicles]);
      }

      setTotalResults(response.pagination.total);
      setTotalPages(response.pagination.total_pages);
      setCurrentPage(response.pagination.current_page);

      // Update filter options based on current results
      if (response.filters) {
        setFilterOptions(response.filters);
      }

      console.log(`✅ Loaded ${response.vehicles.length} vehicles (${response.pagination.total} total)`);

    } catch (error) {
      console.error('❌ Search error:', error);
      setError(error.message);
      
      // Don't clear existing results on error
      if (vehicles.length === 0) {
        setVehicles([]);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearchQuery, sortBy, showingFavorites, favorites, resultsPerPage, vehicles.length]);

  // Load filter options separately for better performance
  const loadFilterOptions = useCallback(async () => {
    try {
      const options = await vehicleAPI.getFilterOptions(filters);
      setFilterOptions(options);
    } catch (error) {
      console.warn('⚠️ Filter options error:', error);
    }
  }, [filters]);

  // Initial load
  useEffect(() => {
    searchVehicles(1, true);
  }, [searchVehicles]);

  // Load filter options when filters change
  useEffect(() => {
    loadFilterOptions();
  }, [loadFilterOptions]);

  // Handle filter changes with optimization
  const handleFiltersChange = useCallback((newFilters) => {
    // Clear dependent filters for better UX
    if (JSON.stringify(filters.make) !== JSON.stringify(newFilters.make)) {
      newFilters.model = [];
    }

    setFilters(newFilters);
    setCurrentPage(1);
    
    // Trigger new search
    searchVehicles(1, true);
  }, [filters.make, searchVehicles]);

  // Handle search input
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  // Handle pagination
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    searchVehicles(page, true);
    
    // Scroll to top for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchVehicles]);

  // Handle sorting
  const handleSortChange = useCallback((newSort) => {
    setSortBy(newSort);
    setCurrentPage(1);
    searchVehicles(1, true);
  }, [searchVehicles]);

  // Handle favorites
  const handleFavoriteToggle = useCallback((vehicleId, vehicle) => {
    const newFavorites = { ...favorites };
    if (newFavorites[vehicleId]) {
      delete newFavorites[vehicleId];
    } else {
      newFavorites[vehicleId] = vehicle;
    }
    saveFavorites(newFavorites);
  }, [favorites, saveFavorites]);

  // Handle favorites view toggle
  const handleToggleFavorites = useCallback((show) => {
    setShowingFavorites(typeof show === 'boolean' ? show : !showingFavorites);
    setCurrentPage(1);
    searchVehicles(1, true);
  }, [showingFavorites, searchVehicles]);

  // Memoized values for performance
  const favoritesCount = useMemo(() => Object.keys(favorites).length, [favorites]);
  
  const displayedVehicles = useMemo(() => {
    if (showingFavorites) {
      return vehicles.filter(vehicle => favorites[vehicle.id]);
    }
    return vehicles;
  }, [vehicles, favorites, showingFavorites]);

  // Loading state
  if (loading && vehicles.length === 0) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>Carzino Vehicle Search</h1>
          <p>🔄 Loading vehicles...</p>
        </header>
        <div className="main-container">
          <div className="loading-spinner">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
                🔍 Searching vehicle inventory...
              </div>
              <div style={{ color: '#666' }}>
                Using scalable search architecture
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <h1>Carzino Vehicle Search</h1>
        <p>
          {error ? (
            <span style={{ color: '#d32f2f' }}>
              ❌ {error} - Showing cached results
            </span>
          ) : (
            `✅ ${totalResults.toLocaleString()} vehicles found`
          )}
        </p>
        
        {/* Performance indicators */}
        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
          🚀 Scalable architecture • 🔍 Server-side search • ⚡ Cached results
        </div>
      </header>

      {/* Main Content */}
      <div className="main-container">
        {/* Desktop Sidebar */}
        <aside className="flex-shrink-0">
          <VehicleSearchFilter
            filters={filters}
            onFiltersChange={handleFiltersChange}
            filterOptions={filterOptions}
            isLoading={loading}
            isMobile={false}
          />
        </aside>

        {/* Results Section */}
        <main className="flex-1 min-w-0 bg-white">
          {/* Search Results Header */}
          <SearchResultsHeader
            totalResults={showingFavorites ? favoritesCount : totalResults}
            currentFilters={filters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            favoritesCount={favoritesCount}
            showingFavorites={showingFavorites}
            onToggleFavorites={handleToggleFavorites}
            onSearch={handleSearch}
            searchQuery={searchQuery}
          />

          {/* Performance metrics */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{ 
              background: '#f5f5f5', 
              padding: '0.5rem', 
              fontSize: '0.8rem',
              borderBottom: '1px solid #ddd'
            }}>
              📊 Page {currentPage} of {totalPages} • 
              {loading ? ' Loading...' : ` ${displayedVehicles.length} vehicles shown`} • 
              Cache: {vehicleAPI.getCacheStats().size} items
            </div>
          )}

          {/* Vehicle Grid */}
          <div className={`vehicle-grid ${viewMode === 'grid' ? 'grid-view' : 'list-view'} p-4`}>
            {loading && vehicles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', gridColumn: '1 / -1' }}>
                🔄 Loading vehicles...
              </div>
            ) : displayedVehicles.length > 0 ? (
              displayedVehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  favorites={favorites}
                  onFavoriteToggle={handleFavoriteToggle}
                  onView={() => vehicleAPI.reportVehicleView(vehicle.id)}
                />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', gridColumn: '1 / -1' }}>
                <h3>No vehicles found</h3>
                <p>Try adjusting your search criteria or filters</p>
                <button
                  onClick={() => {
                    setFilters({
                      make: [],
                      model: [],
                      year: [],
                      condition: [],
                      bodyType: [],
                      fuelType: [],
                      transmission: [],
                      priceMin: '',
                      priceMax: '',
                      mileageMax: '',
                      zipCode: '',
                      radius: '50'
                    });
                    setSearchQuery('');
                    setShowingFavorites(false);
                  }}
                  style={{
                    background: '#1976d2',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginTop: '1rem'
                  }}
                >
                  🔄 Reset All Filters
                </button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && !showingFavorites && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              loading={loading}
            />
          )}

          {/* Load more for mobile/infinite scroll (future enhancement) */}
          {currentPage < totalPages && !loading && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                style={{
                  background: '#1976d2',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Load More Vehicles ({totalResults - (currentPage * resultsPerPage)} remaining)
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Error notification */}
      {error && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#d32f2f',
          color: 'white',
          padding: '1rem',
          borderRadius: '4px',
          maxWidth: '300px',
          zIndex: 1000
        }}>
          <strong>Connection Issue</strong>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
            {error}
          </p>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'transparent',
              border: '1px solid white',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '2px',
              cursor: 'pointer',
              marginTop: '0.5rem'
            }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

export default App;

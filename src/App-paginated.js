import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import VehicleSearchFilter from './components/VehicleSearchFilter';
import VehicleCard from './components/VehicleCard';
import Pagination from './components/Pagination';
import SearchResultsHeader from './components/SearchResultsHeader';
import { fetchVehiclesPaginated, getSearchCount } from './services/api-paginated';

// URL parameter helpers (keep your existing functions)
const filtersToURLParams = (filters, page = 1) => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (!value || (Array.isArray(value) && value.length === 0)) return;
    
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
  // Your existing URL parsing logic
  const filters = {
    condition: [],
    make: [],
    model: [],
    year: [],
    priceMin: '',
    priceMax: '',
    search: '',
    // ... other filters
  };

  for (const [key, value] of searchParams.entries()) {
    if (key === 'page') continue;
    
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

function App() {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Vehicle and filter state
  const [vehicles, setVehicles] = useState([]);
  const [filters, setFilters] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return URLParamsToFilters(searchParams);
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [searchTime, setSearchTime] = useState(0);

  // Get initial page from URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlPage = parseInt(searchParams.get('page')) || 1;
    setCurrentPage(urlPage);
  }, []);

  // Fetch vehicles with pagination
  const fetchVehicles = useCallback(async (page = currentPage, newFilters = filters, newSortBy = sortBy) => {
    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 Fetching page ${page} with ${itemsPerPage} items per page`);
      console.log('🔧 Filters:', newFilters);
      
      const startTime = Date.now();
      
      const result = await fetchVehiclesPaginated(page, itemsPerPage, newFilters, newSortBy);
      
      const endTime = Date.now();
      const fetchTime = endTime - startTime;
      
      setVehicles(result.vehicles);
      setTotalResults(result.totalResults);
      setTotalPages(result.totalPages);
      setCurrentPage(result.currentPage);
      setSearchTime(result.searchTime || fetchTime);

      console.log(`✅ Loaded ${result.vehicles.length} vehicles`);
      console.log(`📊 Total results: ${result.totalResults.toLocaleString()}`);
      console.log(`⏱️ Search time: ${result.searchTime || fetchTime}ms`);

      // Update URL without causing a page reload
      const newUrl = `${window.location.pathname}?${filtersToURLParams(newFilters, page)}`;
      window.history.pushState({ page, filters: newFilters }, '', newUrl);

    } catch (err) {
      console.error('❌ Error fetching vehicles:', err);
      setError(`Failed to load vehicles: ${err.message}`);
      setVehicles([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, sortBy, itemsPerPage]);

  // Initial load
  useEffect(() => {
    fetchVehicles();
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters) => {
    console.log('🔄 Filters changed:', newFilters);
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
    fetchVehicles(1, newFilters, sortBy);
  }, [sortBy, fetchVehicles]);

  // Handle page changes
  const handlePageChange = useCallback((newPage) => {
    console.log(`📄 Page changed to: ${newPage}`);
    setCurrentPage(newPage);
    fetchVehicles(newPage, filters, sortBy);
    
    // Scroll to top of results
    const resultsElement = document.querySelector('.vehicle-grid');
    if (resultsElement) {
      resultsElement.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filters, sortBy, fetchVehicles]);

  // Handle sort changes
  const handleSortChange = useCallback((newSortBy) => {
    console.log(`🔄 Sort changed to: ${newSortBy}`);
    setSortBy(newSortBy);
    setCurrentPage(1); // Reset to first page when sort changes
    fetchVehicles(1, filters, newSortBy);
  }, [filters, fetchVehicles]);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    console.log(`📋 Items per page changed to: ${newItemsPerPage}`);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
    
    // Use current filters and sort
    fetchVehicles(1, filters, sortBy);
  }, [filters, sortBy, fetchVehicles]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = (event) => {
      const searchParams = new URLSearchParams(window.location.search);
      const urlPage = parseInt(searchParams.get('page')) || 1;
      const urlFilters = URLParamsToFilters(searchParams);
      
      setCurrentPage(urlPage);
      setFilters(urlFilters);
      fetchVehicles(urlPage, urlFilters, sortBy);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [sortBy, fetchVehicles]);

  // Calculate display metrics
  const startResult = totalResults > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endResult = Math.min(currentPage * itemsPerPage, totalResults);

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
              <p>✅ Connected to vehicle inventory</p>
              <div className="search-stats">
                <span>📊 {totalResults.toLocaleString()} total vehicles</span>
                <span>📄 Showing {startResult.toLocaleString()}-{endResult.toLocaleString()}</span>
                <span>⏱️ Search: {searchTime}ms</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="main-container">
        {/* Search and Filter Section */}
        <VehicleSearchFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          loading={loading}
        />

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
            <button onClick={() => fetchVehicles()}>Try Again</button>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="no-results">
            <h3>No vehicles found</h3>
            <p>Try adjusting your search filters</p>
          </div>
        ) : (
          <>
            {/* Vehicle Cards */}
            <div className="vehicle-grid">
              {vehicles.map((vehicle, index) => (
                <VehicleCard
                  key={`${vehicle.id}-${currentPage}-${index}`}
                  vehicle={vehicle}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalResults={totalResults}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                loading={loading}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import './App.css';
import VehicleSearchFilter from './components/VehicleSearchFilter';
import VehicleCard from './components/VehicleCard';
import SearchResultsHeader from './components/SearchResultsHeader';
import Pagination from './components/Pagination';
import DataDebugPanel from './components/DataDebugPanel';
import { fetchVehiclesSimple } from './services/api-simple';

function AppDebug() {
  // State
  const [vehicles, setVehicles] = useState([]);
  const [filterOptions, setFilterOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiConnected, setApiConnected] = useState(false);
  const [favorites, setFavorites] = useState({});
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(19);
  
  // Filters
  const [filters, setFilters] = useState({
    condition: [],
    make: [],
    model: [],
    trim: [],
    year: [],
    priceMin: '',
    priceMax: '',
    zipCode: '98498',
    radius: '200'
  });

  // Load data with simplified API
  const loadData = async (page = 1) => {
    console.log('🔄 Loading data with simplified API...');
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchVehiclesSimple(page, itemsPerPage, filters);
      
      setVehicles(result.vehicles);
      setTotalResults(result.totalResults);
      setTotalPages(result.totalPages);
      setCurrentPage(result.currentPage);
      setApiConnected(!result.isDemo);
      
      if (result.filterOptions) {
        setFilterOptions(result.filterOptions);
      }
      
      if (result.error) {
        setError(result.error);
      }
      
      console.log('✅ Data loaded:', {
        vehicles: result.vehicles.length,
        totalResults: result.totalResults,
        isDemo: result.isDemo,
        hasError: !!result.error
      });
      
    } catch (error) {
      console.error('❌ Data loading failed:', error);
      setError(error.message);
      setApiConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData(1);
  }, []);

  // Handle filter changes
  const handleFiltersChange = (newFilters) => {
    console.log('🔧 Filters changed:', newFilters);
    setFilters(newFilters);
    setCurrentPage(1);
    loadData(1);
  };

  // Handle page changes
  const handlePageChange = (newPage) => {
    console.log('📄 Page changed to:', newPage);
    setCurrentPage(newPage);
    loadData(newPage);
  };

  // Handle favorites
  const handleFavoriteToggle = (vehicleId, vehicle) => {
    setFavorites(prev => ({
      ...prev,
      [vehicleId]: !prev[vehicleId]
    }));
  };

  return (
    <div className="App">
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
        padding: '20px 0',
        marginBottom: '24px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px'
        }}>
          <h1 style={{
            color: 'white',
            margin: 0,
            fontSize: '28px',
            fontWeight: 'bold'
          }}>
            Carzino Vehicle Search (Debug Mode)
          </h1>
          {loading && (
            <p style={{ color: 'white', margin: '8px 0 0 0', opacity: 0.9 }}>
              ⏳ Loading vehicles...
            </p>
          )}
          {apiConnected && !loading && (
            <p style={{ color: 'white', margin: '8px 0 0 0', opacity: 0.9 }}>
              ✅ Connected to WooCommerce inventory ({totalResults.toLocaleString()} vehicles)
            </p>
          )}
          {!apiConnected && !loading && (
            <p style={{ color: 'white', margin: '8px 0 0 0', opacity: 0.9 }}>
              ⚠️ Using demo data - check environment variables
            </p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px',
        display: 'grid',
        gridTemplateColumns: '290px 1fr',
        gap: '24px'
      }}>
        {/* Filters */}
        <div>
          <VehicleSearchFilter
            filters={filters}
            onFiltersChange={handleFiltersChange}
            filterOptions={filterOptions}
            isLoading={loading}
          />
        </div>

        {/* Results */}
        <div>
          <SearchResultsHeader
            totalResults={totalResults}
            currentResults={vehicles.length}
            onSortChange={() => {}}
            onViewModeChange={() => {}}
            sortBy="relevance"
            viewMode="grid"
            searchTime={0}
          />

          {/* Error Message */}
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
              color: '#dc2626'
            }}>
              <strong>⚠️ Notice:</strong> {error}
            </div>
          )}

          {/* Vehicle Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }}>
            {vehicles.map(vehicle => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                favorites={favorites}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalResults={totalResults}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          )}
        </div>
      </div>

      {/* Debug Panel */}
      <DataDebugPanel
        vehicles={vehicles}
        filterOptions={filterOptions}
        loading={loading}
        error={error}
        apiConnected={apiConnected}
      />
    </div>
  );
}

export default AppDebug;

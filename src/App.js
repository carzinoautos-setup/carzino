import React, { useState, useEffect } from 'react';
import './App.css';
import VehicleSearchFilter from './components/VehicleSearchFilter';
import VehicleCard from './components/VehicleCard';
import Pagination from './components/Pagination';
import SearchResultsHeader from './components/SearchResultsHeader';
import { fetchVehicles, fetchFilterOptions, testAPIConnection } from './services/api';

function App() {
  // State management
  const [filters, setFilters] = useState({
    condition: [],
    make: [],
    model: [],
    trim: [],
    year: [], // Add year filter
    vehicleType: [],
    bodyType: [],
    driveType: [],
    transmission: [], // Updated from transmissionSpeed to match ACF
    transmissionSpeed: [], // Keep for component compatibility
    fuelType: [], // New ACF field
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
  });

  // Data state
  const [vehicles, setVehicles] = useState([]);
  const [filterOptions, setFilterOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiConnected, setApiConnected] = useState(false);

  const [favorites, setFavorites] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showingFavorites, setShowingFavorites] = useState(false);

  // Pagination state
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const resultsPerPage = 12; // Reduced from 25 to 12 for faster loading

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Test API connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🔗 Starting API connection test...');
        const result = await testAPIConnection();
        console.log('📡 API Connection Test Result:', result);

        // Check if result exists and has expected properties
        if (result && typeof result === 'object') {
          if (result.success) {
            setApiConnected(true);
            console.log(`✅ Connected to WooCommerce API. Found ${result.productCount || 'unknown'} products.`);
            setError(null); // Clear any previous errors
          } else {
            setApiConnected(false);
            console.error('❌ API Connection Failed:', result.message || 'Unknown error');

            // Handle CORS errors more gracefully
            if (result.message && result.message.includes('CORS Error')) {
              const isProduction = window.location.hostname === 'carzinoautos-setup.github.io';

              if (isProduction) {
                // This is unexpected in production
                setError('CORS Error: Production site cannot access WooCommerce API. Please check CORS configuration.');
              } else {
                // This is expected in dev environment
                setError(null); // Don't show error in dev - it's expected
                console.log('📝 Dev Environment: CORS error is expected. GitHub Pages will work fine.');
              }
            } else {
              setError(`API Connection Failed: ${result.message || 'Unknown API error'}`);
            }
          }
        } else {
          // Result is undefined or not an object
          console.error('❌ API test returned invalid result:', result);
          setApiConnected(false);
          setError('API test failed - invalid response format');
        }
      } catch (err) {
        console.error('❌ API Connection Error:', err);
        setApiConnected(false);
        setError(`Connection Error: ${err.message || 'Unknown connection error'}`);
      }
    };

    testConnection();
  }, []);

  // Load initial data when API is connected
  useEffect(() => {
    if (apiConnected) {
      loadVehiclesAndFilters();
    }
  }, [apiConnected, currentPage, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update filter options when filters change (for cascading behavior)
  useEffect(() => {
    if (apiConnected && vehicles.length > 0) {
      updateFilterOptions();
    }
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Function to update only filter options (for cascading filters)
  const updateFilterOptions = async () => {
    try {
      console.log('🔗 Updating filter options based on current selections:', filters);
      const filterData = await fetchFilterOptions(filters);
      setFilterOptions(filterData);
      console.log('✅ Filter options updated for cascading behavior');
    } catch (err) {
      console.error('Error updating filter options:', err);
    }
  };

  // Load vehicles and filter options
  const loadVehiclesAndFilters = async () => {
    try {
      setLoading(true);
      
      // Fetch vehicles with current filters and pagination
      const vehicleParams = {
        page: currentPage,
        per_page: resultsPerPage,
        // Add filter parameters here when implementing search
      };

      const [vehicleData, filterData] = await Promise.all([
        fetchVehicles(vehicleParams),
        fetchFilterOptions(filters) // Pass current filters for cascading logic
      ]);

      // Transform vehicle data to match existing component structure
      const transformedVehicles = vehicleData.results.map(vehicle => ({
        id: vehicle.id,
        featured: vehicle.featured || false,
        viewed: false, // This would come from user session data
        images: vehicle.images.gallery.length > 0 ? vehicle.images.gallery : [vehicle.images.featured],
        badges: getBadgesForVehicle(vehicle),
        title: vehicle.title,
        mileage: extractMileage(vehicle),
        transmission: extractTransmission(vehicle),
        doors: extractDoors(vehicle),
        salePrice: formatPrice(vehicle.price),
        payment: calculatePayment(vehicle.price),
        dealer: extractDealer(vehicle),
        location: extractLocation(vehicle),
        phone: extractPhone(vehicle),
        rawData: vehicle // Keep original data for debugging
      }));

      setVehicles(transformedVehicles);
      setFilterOptions(filterData);
      setTotalResults(vehicleData.total);
      setTotalPages(Math.ceil(vehicleData.total / resultsPerPage));
      
      console.log(`📊 Loaded ${transformedVehicles.length} vehicles from WooCommerce API`);
      console.log('🏷️ Filter options:', filterData);
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError(`Failed to load vehicles: ${err.message}`);
      
      // Fallback to sample data if API fails
      setVehicles(getSampleVehicles());
      setTotalResults(6);
      setTotalPages(1);
      
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to transform WooCommerce data
  const getBadgesForVehicle = (vehicle) => {
    const badges = [];
    
    // Add condition badges
    if (vehicle.stock_status === 'instock') {
      badges.push('Available');
    }
    if (vehicle.featured) {
      badges.push('Featured');
    }
    if (vehicle.sale_price && vehicle.sale_price !== vehicle.price) {
      badges.push('Sale');
    }
    
    // Add category-based badges
    vehicle.categories.forEach(cat => {
      if (cat.name !== 'Uncategorized') {
        badges.push(cat.name);
      }
    });
    
    return badges.slice(0, 3); // Limit to 3 badges
  };

  const extractMileage = (vehicle) => {
    // Look for mileage in meta data or attributes
    const mileageAttr = vehicle.attributes.find(attr => 
      attr.name.toLowerCase().includes('mileage') || 
      attr.name.toLowerCase().includes('miles')
    );
    
    if (mileageAttr?.options?.[0]) {
      return mileageAttr.options[0];
    }
    
    // Default for new vehicles
    return 'New';
  };

  const extractTransmission = (vehicle) => {
    const transAttr = vehicle.attributes.find(attr => 
      attr.name.toLowerCase().includes('transmission')
    );
    
    if (transAttr?.options?.[0]) {
      return transAttr.options[0];
    }
    
    return 'Auto'; // Default
  };

  const extractDoors = (vehicle) => {
    const doorsAttr = vehicle.attributes.find(attr => 
      attr.name.toLowerCase().includes('doors')
    );
    
    if (doorsAttr?.options?.[0]) {
      return `${doorsAttr.options[0]} doors`;
    }
    
    return '4 doors'; // Default
  };

  const formatPrice = (price) => {
    if (!price || price === '0') return 'Call for Price';
    
    const numPrice = parseFloat(price);
    return `$${numPrice.toLocaleString()}`;
  };

  const calculatePayment = (price) => {
    if (!price || price === '0') return 'Call';
    
    // Simple payment calculation (real app would use proper finance calculations)
    const numPrice = parseFloat(price);
    const monthlyPayment = Math.round((numPrice * 0.02)); // Rough 2% of price
    
    return `$${monthlyPayment}`;
  };

  const extractDealer = (vehicle) => {
    // Look for dealer info in meta data
    const dealerMeta = vehicle.meta_data.find(meta => 
      meta.key.toLowerCase().includes('dealer') || 
      meta.key.toLowerCase().includes('seller')
    );
    
    if (dealerMeta?.value) {
      return dealerMeta.value;
    }
    
    return 'Carzino Dealer'; // Default
  };

  const extractLocation = (vehicle) => {
    // Look for location in meta data
    const locationMeta = vehicle.meta_data.find(meta => 
      meta.key.toLowerCase().includes('location') || 
      meta.key.toLowerCase().includes('city')
    );
    
    if (locationMeta?.value) {
      return locationMeta.value;
    }
    
    return 'Washington State'; // Default
  };

  const extractPhone = (vehicle) => {
    // Look for phone in meta data
    const phoneMeta = vehicle.meta_data.find(meta => 
      meta.key.toLowerCase().includes('phone') || 
      meta.key.toLowerCase().includes('contact')
    );
    
    if (phoneMeta?.value) {
      return phoneMeta.value;
    }
    
    return '(253) 555-0100'; // Default
  };

  // Fallback sample data (same as before)
  const getSampleVehicles = () => [
    {
      id: 'sample-1',
      featured: true,
      viewed: true,
      images: ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=450&h=300&fit=crop"],
      badges: ["API Error", "Sample"],
      title: "Sample Vehicle (API Connection Issue)",
      mileage: "N/A",
      transmission: "Auto",
      doors: "4 doors",
      salePrice: "Call for Price",
      payment: "Call",
      dealer: "Sample Dealer",
      location: "Sample Location",
      phone: "(253) 555-0100"
    }
  ];

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage.getItem('carzino_favorites') || '{}');
    setFavorites(savedFavorites);
  }, []);

  // Save favorites to localStorage
  const saveFavorites = (newFavorites) => {
    setFavorites(newFavorites);
    localStorage.setItem('carzino_favorites', JSON.stringify(newFavorites));
  };

  // Handle favorite toggle
  const handleFavoriteToggle = (vehicleId, vehicle) => {
    const newFavorites = { ...favorites };
    if (newFavorites[vehicleId]) {
      delete newFavorites[vehicleId];
    } else {
      newFavorites[vehicleId] = vehicle;
    }
    saveFavorites(newFavorites);
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters) => {
    console.log('🔄 Filters changed:', { old: filters, new: newFilters });
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change

    // Clear dependent filters when parent filter changes
    if (JSON.stringify(filters.make) !== JSON.stringify(newFilters.make)) {
      // If make changed, clear model and trim selections
      if (newFilters.model?.length > 0) {
        console.log('🔗 Make changed, clearing dependent filters (model, trim)');
        newFilters.model = [];
        newFilters.trim = [];
      }
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle sort change
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  // Handle mobile filters
  const handleMobileFiltersOpen = () => {
    setIsMobileFiltersOpen(true);
  };

  const handleMobileFiltersClose = () => {
    setIsMobileFiltersOpen(false);
  };

  // Handle favorites toggle
  const handleToggleFavorites = (show) => {
    if (typeof show === 'boolean') {
      setShowingFavorites(show);
    } else {
      setShowingFavorites(!showingFavorites);
    }
    setCurrentPage(1);
  };

  // Handle filter removal
  const handleRemoveFilter = (category, value) => {
    const newFilters = { ...filters };

    if (category === 'price') {
      newFilters.priceMin = '';
      newFilters.priceMax = '';
    } else if (category === 'payment') {
      newFilters.paymentMin = '';
      newFilters.paymentMax = '';
    } else if (Array.isArray(newFilters[category])) {
      newFilters[category] = newFilters[category].filter(item => item !== value);
    } else {
      newFilters[category] = '';
    }

    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Handle clear all filters
  const handleClearAllFilters = () => {
    setFilters({
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
      mileage: '',
      exteriorColor: [],
      interiorColor: [],
      sellerType: [],
      dealer: [],
      state: [],
      city: [],
      zipCodeFilter: [],
      priceMin: '',
      priceMax: '',
      paymentMin: '',
      paymentMax: '',
      zipCode: filters.zipCode, // Keep location settings
      radius: filters.radius,
      termLength: filters.termLength,
      interestRate: filters.interestRate,
      downPayment: filters.downPayment
    });
    setCurrentPage(1);
  };

  // Handle search
  const handleSearch = (query) => {
    console.log('Searching for:', query);
    // TODO: Implement search in API call
    setCurrentPage(1);
  };

  // Get current page vehicles
  const favoritesCount = Object.keys(favorites).length;
  const vehiclesToShow = showingFavorites
    ? vehicles.filter(vehicle => favorites[vehicle.id])
    : vehicles;
  const currentVehicles = vehiclesToShow;

  // Loading state
  if (loading && vehicles.length === 0) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>Carzino Vehicle Search</h1>
          <p>Loading your vehicle inventory...</p>
        </header>
        <div className="main-container">
          <div className="loading-spinner">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
                🔄 Connecting to WooCommerce API...
              </div>
              <div style={{ color: '#666' }}>
                Loading vehicles from: {process.env.REACT_APP_WP_SITE_URL}
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
          {apiConnected
            ? `Connected to your WooCommerce inventory (${totalResults} vehicles)`
            : window.location.hostname === 'carzinoautos-setup.github.io'
            ? `Showing sample data (${totalResults} vehicles) - API connection issue`
            : `Dev Environment: Showing sample data (${totalResults} vehicles) - Use GitHub Pages for live data`
          }
        </p>
        {error && (
          <div style={{ 
            background: '#fee', 
            color: '#c33', 
            padding: '0.5rem 1rem', 
            borderRadius: '4px', 
            margin: '0.5rem 0',
            fontSize: '0.9rem'
          }}>
            ⚠️ {error}
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="main-container">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside className="flex-shrink-0">
            <VehicleSearchFilter
              filters={filters}
              onFiltersChange={handleFiltersChange}
              filterOptions={filterOptions}
              isLoading={loading}
              isMobile={false}
            />
          </aside>
        )}

        {/* Mobile Filter Overlay */}
        {isMobile && isMobileFiltersOpen && (
          <VehicleSearchFilter
            filters={filters}
            onFiltersChange={handleFiltersChange}
            filterOptions={filterOptions}
            isLoading={loading}
            isMobile={true}
            onClose={handleMobileFiltersClose}
          />
        )}

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
            onMobileFiltersOpen={handleMobileFiltersOpen}
            favoritesCount={favoritesCount}
            showingFavorites={showingFavorites}
            onToggleFavorites={handleToggleFavorites}
            onRemoveFilter={handleRemoveFilter}
            onClearAllFilters={handleClearAllFilters}
            onSearch={handleSearch}
          />

          {/* Vehicle Grid */}
          <div className={`vehicle-grid ${viewMode === 'grid' ? 'grid-view' : 'list-view'} ${isMobile ? 'p-2' : 'p-4'}`}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', gridColumn: '1 / -1' }}>
                Loading vehicles...
              </div>
            ) : currentVehicles.length > 0 ? (
              currentVehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  favorites={favorites}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', gridColumn: '1 / -1' }}>
                {apiConnected 
                  ? 'No vehicles found. Try adjusting your filters.' 
                  : 'Unable to load vehicles. Please check your connection.'
                }
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && !showingFavorites && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalResults={totalResults}
              resultsPerPage={resultsPerPage}
              onPageChange={handlePageChange}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

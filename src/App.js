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

        // Add timeout to prevent hanging on startup
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('API test timeout')), 10000)
        );

        const result = await Promise.race([
          testAPIConnection(),
          timeoutPromise
        ]);

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

            // Handle CORS errors more gracefully - don't block the app
            if (result.message && result.message.includes('CORS Error')) {
              console.log('📝 CORS issue detected - app will use fallback data');
              setError(null); // Don't show error - fallback will work
            } else {
              setError(`API Connection Issue: ${result.message || 'Using fallback data'}`);
            }
          }
        } else {
          console.error('❌ API test returned invalid result:', result);
          setApiConnected(false);
          setError(null); // Don't block app - use fallback
        }
      } catch (err) {
        console.error('❌ API Connection Error:', err);
        setApiConnected(false);

        if (err.message === 'API test timeout') {
          console.log('📝 API test timed out - app will use fallback data');
          setError(null); // Don't show error for timeout
        } else {
          setError(null); // Don't block app - use fallback
        }
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
    if (apiConnected && vehicles.length > 0 && !loading) {
      const timeoutId = setTimeout(() => {
        updateFilterOptions();
      }, 500); // Debounce filter updates

      return () => clearTimeout(timeoutId);
    }
  }, [filters, apiConnected, vehicles.length, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Function to update only filter options (for cascading filters)
  const updateFilterOptions = async () => {
    try {
      // Skip if already loading or not connected
      if (loading || !apiConnected) {
        console.log('📋 Skipping filter update - app is loading or not connected');
        return;
      }

      // Check if we have meaningful filter selections to cascade
      const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
        if (['zipCode', 'radius', 'termLength', 'interestRate', 'downPayment', 'priceMin', 'priceMax', 'paymentMin', 'paymentMax'].includes(key)) {
          return false; // Skip configuration fields
        }
        return Array.isArray(value) ? value.length > 0 : (value && value.toString().trim() !== '');
      });

      if (!hasActiveFilters) {
        console.log('📋 No active filters, skipping filter options update');
        return;
      }

      console.log('🔗 Updating filter options based on current selections');

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Filter update timeout')), 5000)
      );

      const filterData = await Promise.race([
        fetchFilterOptions(filters),
        timeoutPromise
      ]);

      setFilterOptions(filterData);

      console.log('✅ Filter options updated for cascading behavior:', {
        makes: filterData.makes?.length || 0,
        models: filterData.models?.length || 0,
        availableOptions: Object.keys(filterData).filter(key => filterData[key]?.length > 0).join(', ')
      });
    } catch (err) {
      console.warn('⚠️ Filter options update failed, keeping existing options:', err.message);
      // Silently fail to prevent blocking the UI
    }
  };

  // Load vehicles and filter options
  const loadVehiclesAndFilters = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors

      // Fetch vehicles with current filters and pagination
      const vehicleParams = {
        page: currentPage,
        per_page: resultsPerPage,
        // Add filter parameters here when implementing search
      };

      // Use Promise.allSettled to handle partial failures gracefully
      const [vehicleResult, filterResult] = await Promise.allSettled([
        fetchVehicles(vehicleParams),
        fetchFilterOptions(filters) // Pass current filters for cascading logic
      ]);

      // Handle vehicle data result
      const vehicleData = vehicleResult.status === 'fulfilled'
        ? vehicleResult.value
        : { results: [], total: 0, totalPages: 1 };

      // Handle filter data result
      const filterData = filterResult.status === 'fulfilled'
        ? filterResult.value
        : { makes: [], models: [], conditions: [], bodyTypes: [], total: 0 };

      if (vehicleResult.status === 'rejected') {
        console.error('Vehicle data failed:', vehicleResult.reason);
        setError('Failed to load vehicle data - using fallback');
      }

      if (filterResult.status === 'rejected') {
        console.error('Filter data failed:', filterResult.reason);
        // Don't show error for filter failure, just log it
      }

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

    // Clear dependent filters when parent filter is removed
    if (category === 'make') {
      console.log('🔗 Make filter removed, clearing dependent filters');
      newFilters.model = [];
      newFilters.trim = [];
    } else if (category === 'model') {
      console.log('🔗 Model filter removed, clearing dependent trim filters');
      newFilters.trim = [];
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

  // Filter vehicles based on selected filters
  const getFilteredVehicles = () => {
    let filtered = vehicles;
    const originalCount = filtered.length;

    // Apply make filter
    if (filters.make && filters.make.length > 0) {
      const beforeMakeFilter = filtered.length;
      filtered = filtered.filter(vehicle => {
        const vehicleMake = extractMakeFromVehicle(vehicle);
        const matches = vehicleMake && filters.make.includes(vehicleMake);
        if (!matches && vehicleMake) {
          console.log(`🚫 Filtering out ${vehicle.title} - Make: ${vehicleMake} not in [${filters.make.join(', ')}]`);
        }
        return matches;
      });
      console.log(`🔍 Make filter applied: ${beforeMakeFilter} → ${filtered.length} vehicles (filtered by: ${filters.make.join(', ')})`);
    }

    // Apply model filter
    if (filters.model && filters.model.length > 0) {
      filtered = filtered.filter(vehicle => {
        const vehicleModel = extractModelFromVehicle(vehicle);
        return vehicleModel && filters.model.includes(vehicleModel);
      });
    }

    // Apply condition filter
    if (filters.condition && filters.condition.length > 0) {
      filtered = filtered.filter(vehicle => {
        const vehicleCondition = extractConditionFromVehicle(vehicle);
        return vehicleCondition && filters.condition.includes(vehicleCondition);
      });
    }

    // Apply vehicle type filter
    if (filters.vehicleType && filters.vehicleType.length > 0) {
      filtered = filtered.filter(vehicle => {
        const vehicleType = extractVehicleTypeFromVehicle(vehicle);
        return vehicleType && filters.vehicleType.includes(vehicleType);
      });
    }

    // Apply drive type filter
    if (filters.driveType && filters.driveType.length > 0) {
      filtered = filtered.filter(vehicle => {
        const driveType = extractDriveTypeFromVehicle(vehicle);
        return driveType && filters.driveType.includes(driveType);
      });
    }

    // Apply transmission filter
    if (filters.transmissionSpeed && filters.transmissionSpeed.length > 0) {
      filtered = filtered.filter(vehicle => {
        const transmission = extractTransmissionFromVehicle(vehicle);
        return transmission && filters.transmissionSpeed.includes(transmission);
      });
    }

    // Apply year filter
    if (filters.year && filters.year.length > 0) {
      filtered = filtered.filter(vehicle => {
        const year = extractYearFromVehicle(vehicle);
        return year && filters.year.includes(year.toString());
      });
    }

    // Apply price filters
    if (filters.priceMin || filters.priceMax) {
      filtered = filtered.filter(vehicle => {
        const price = extractPriceFromVehicle(vehicle);
        if (!price) return true;

        const numPrice = parseFloat(price);
        if (filters.priceMin && numPrice < parseFloat(filters.priceMin)) return false;
        if (filters.priceMax && numPrice > parseFloat(filters.priceMax)) return false;

        return true;
      });
    }

    return filtered;
  };

  // Helper functions to extract data from vehicles
  const extractMakeFromVehicle = (vehicle) => {
    if (vehicle.rawData?.meta_data) {
      const makeMeta = vehicle.rawData.meta_data.find(meta => meta.key === 'make');
      if (makeMeta?.value) return makeMeta.value;
    }
    if (vehicle.rawData?.attributes) {
      const makeAttr = vehicle.rawData.attributes.find(attr =>
        attr.name.toLowerCase().includes('make')
      );
      if (makeAttr?.options?.[0]) return makeAttr.options[0];
    }
    return null;
  };

  const extractModelFromVehicle = (vehicle) => {
    if (vehicle.rawData?.meta_data) {
      const modelMeta = vehicle.rawData.meta_data.find(meta => meta.key === 'model');
      if (modelMeta?.value) return modelMeta.value;
    }
    if (vehicle.rawData?.attributes) {
      const modelAttr = vehicle.rawData.attributes.find(attr =>
        attr.name.toLowerCase().includes('model')
      );
      if (modelAttr?.options?.[0]) return modelAttr.options[0];
    }
    return null;
  };

  const extractConditionFromVehicle = (vehicle) => {
    if (vehicle.rawData?.meta_data) {
      const conditionMeta = vehicle.rawData.meta_data.find(meta => meta.key === 'condition');
      if (conditionMeta?.value) return conditionMeta.value;
    }
    return vehicle.rawData?.stock_status === 'instock' ? 'Available' : 'Sold';
  };

  const extractVehicleTypeFromVehicle = (vehicle) => {
    if (vehicle.rawData?.meta_data) {
      const typeMeta = vehicle.rawData.meta_data.find(meta => meta.key === 'body_type');
      if (typeMeta?.value) return typeMeta.value;
    }
    return vehicle.rawData?.categories?.find(cat => cat.name !== 'Uncategorized')?.name || null;
  };

  const extractDriveTypeFromVehicle = (vehicle) => {
    if (vehicle.rawData?.meta_data) {
      const driveMeta = vehicle.rawData.meta_data.find(meta => meta.key === 'drivetrain');
      if (driveMeta?.value) return driveMeta.value;
    }
    if (vehicle.rawData?.attributes) {
      const driveAttr = vehicle.rawData.attributes.find(attr =>
        attr.name.toLowerCase().includes('drive')
      );
      if (driveAttr?.options?.[0]) return driveAttr.options[0];
    }
    return null;
  };

  const extractTransmissionFromVehicle = (vehicle) => {
    if (vehicle.rawData?.meta_data) {
      const transMeta = vehicle.rawData.meta_data.find(meta => meta.key === 'transmission');
      if (transMeta?.value) return transMeta.value;
    }
    if (vehicle.rawData?.attributes) {
      const transAttr = vehicle.rawData.attributes.find(attr =>
        attr.name.toLowerCase().includes('transmission')
      );
      if (transAttr?.options?.[0]) return transAttr.options[0];
    }
    return null;
  };

  const extractYearFromVehicle = (vehicle) => {
    if (vehicle.rawData?.meta_data) {
      const yearMeta = vehicle.rawData.meta_data.find(meta => meta.key === 'year');
      if (yearMeta?.value) return yearMeta.value;
    }
    if (vehicle.rawData?.attributes) {
      const yearAttr = vehicle.rawData.attributes.find(attr =>
        attr.name.toLowerCase().includes('year')
      );
      if (yearAttr?.options?.[0]) return yearAttr.options[0];
    }
    return null;
  };

  const extractPriceFromVehicle = (vehicle) => {
    return vehicle.rawData?.price || vehicle.rawData?.regular_price;
  };

  // Get current page vehicles with filtering
  const favoritesCount = Object.keys(favorites).length;
  const allFilteredVehicles = showingFavorites
    ? vehicles.filter(vehicle => favorites[vehicle.id])
    : getFilteredVehicles();

  // Update total results to reflect filtered count
  const actualTotalResults = showingFavorites ? favoritesCount : allFilteredVehicles.length;
  const currentVehicles = allFilteredVehicles;

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
            ? `Connected to your WooCommerce inventory (${actualTotalResults} of ${totalResults} vehicles shown)`
            : window.location.hostname === 'carzinoautos-setup.github.io'
            ? `Showing sample data (${actualTotalResults} vehicles) - API connection issue`
            : `Dev Environment: Showing sample data (${actualTotalResults} vehicles) - Use GitHub Pages for live data`
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
            totalResults={actualTotalResults}
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

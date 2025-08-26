import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import VehicleSearchFilter from './components/VehicleSearchFilter';
import VehicleCard from './components/VehicleCard';
import Pagination from './components/Pagination';
import SearchResultsHeader from './components/SearchResultsHeader';
import { fetchVehiclesPaginated } from './services/api-paginated';

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

// Function to apply filters to vehicle data (for demo mode)
const applyFiltersToVehicles = (vehicles, filters) => {
  return vehicles.filter(vehicle => {
    // Helper function to get meta value
    const getMeta = (key) => {
      const meta = vehicle.meta_data?.find(m => m.key === key);
      return meta ? meta.value : '';
    };

    // Helper function to extract make from title
    const extractMakeFromTitle = () => {
      const titleParts = vehicle.title.split(' ');
      return titleParts[1] || ''; // Position 1 is typically the make (after year)
    };

    // Check make filter
    if (filters.make && filters.make.length > 0) {
      const vehicleMake = getMeta('make') || extractMakeFromTitle();
      if (!filters.make.includes(vehicleMake)) {
        return false;
      }
    }

    // Check model filter
    if (filters.model && filters.model.length > 0) {
      const vehicleModel = getMeta('model');
      if (!filters.model.includes(vehicleModel)) {
        return false;
      }
    }

    // Check condition filter
    if (filters.condition && filters.condition.length > 0) {
      const vehicleCondition = getMeta('condition');
      if (!filters.condition.includes(vehicleCondition)) {
        return false;
      }
    }

    // Check vehicle type filter
    if (filters.vehicleType && filters.vehicleType.length > 0) {
      const vehicleType = getMeta('body_type') || getMeta('vehicleType');
      if (!filters.vehicleType.includes(vehicleType)) {
        return false;
      }
    }

    // Check year filter
    if (filters.year && filters.year.length > 0) {
      const titleParts = vehicle.title.split(' ');
      const vehicleYear = titleParts[0] || getMeta('year');
      if (!filters.year.includes(vehicleYear)) {
        return false;
      }
    }

    // Check drivetrain filter
    if (filters.driveType && filters.driveType.length > 0) {
      const driveType = getMeta('drivetrain') || getMeta('drive_type');
      if (!filters.driveType.includes(driveType)) {
        return false;
      }
    }

    // Check exterior color filter
    if (filters.exteriorColor && filters.exteriorColor.length > 0) {
      const exteriorColor = getMeta('exterior_color');
      if (!filters.exteriorColor.includes(exteriorColor)) {
        return false;
      }
    }

    // Check interior color filter
    if (filters.interiorColor && filters.interiorColor.length > 0) {
      const interiorColor = getMeta('interior_color');
      if (!filters.interiorColor.includes(interiorColor)) {
        return false;
      }
    }

    // Check fuel type filter
    if (filters.fuelType && filters.fuelType.length > 0) {
      const fuelType = getMeta('fuel_type');
      if (!filters.fuelType.includes(fuelType)) {
        return false;
      }
    }

    // Check trim filter
    if (filters.trim && filters.trim.length > 0) {
      const trim = getMeta('trim');
      if (!filters.trim.includes(trim)) {
        return false;
      }
    }

    // Check price range
    if (filters.priceMin || filters.priceMax) {
      const priceStr = vehicle.salePrice?.replace(/[$,]/g, '') || '0';
      const price = parseFloat(priceStr);

      if (filters.priceMin && price < parseFloat(filters.priceMin)) {
        return false;
      }

      if (filters.priceMax && price > parseFloat(filters.priceMax)) {
        return false;
      }
    }

    // If all filters pass, include the vehicle
    return true;
  });
};

// Demo data function
const getRealisticDemoVehicles = () => {
  return [
    {
      id: 'demo-1',
      title: '2021 Toyota RAV4 XLE (Demo Data)',
      featured: false,
      viewed: false,
      images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=450&h=300&fit=crop'],
      badges: [],
      mileage: "32,456",
      transmission: "Auto",
      doors: "4 doors",
      salePrice: "$28,995",
      payment: "$580",
      dealer: "Demo Dealer",
      location: "Seattle, WA",
      phone: "(253) 555-0100",
      seller_data: null,
      meta_data: [
        { key: 'make', value: 'Toyota' },
        { key: 'condition', value: 'Used' },
        { key: 'body_type', value: 'SUV' }
      ],
      rawData: {}
    },
    {
      id: 'demo-2',
      title: '2020 Honda Civic Si (Demo Data)',
      featured: false,
      viewed: false,
      images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=450&h=300&fit=crop'],
      badges: [],
      mileage: "24,567",
      transmission: "Manual",
      doors: "4 doors",
      salePrice: "$22,995",
      payment: "$329",
      dealer: "Demo Dealer",
      location: "Tacoma, WA",
      phone: "(253) 555-0200",
      seller_data: null,
      meta_data: [
        { key: 'make', value: 'Honda' },
        { key: 'condition', value: 'Used' },
        { key: 'body_type', value: 'Sedan' }
      ],
      rawData: {}
    },
    {
      id: 'demo-3',
      title: '2019 Ford F-150 XLT (Demo Data)',
      featured: false,
      viewed: false,
      images: ['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=450&h=300&fit=crop'],
      badges: [],
      mileage: "45,321",
      transmission: "Auto",
      doors: "4 doors",
      salePrice: "$31,995",
      payment: "$449",
      dealer: "Demo Dealer",
      location: "Everett, WA",
      phone: "(425) 555-0300",
      seller_data: null,
      meta_data: [
        { key: 'make', value: 'Ford' },
        { key: 'condition', value: 'Used' },
        { key: 'body_type', value: 'Truck' }
      ],
      rawData: {}
    }
  ];
};

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

      // Update state with paginated results
      setVehicles(result.vehicles);
      setTotalResults(result.totalResults);
      setTotalPages(result.totalPages);
      setCurrentPage(result.currentPage);
      setSearchTime(responseTime);
      setApiConnected(true);
      
      // Extract and set filter options from the loaded vehicles
      const filterOptionsExtracted = extractFilterOptions(result.vehicles);
      setFilterOptions(filterOptionsExtracted);
      
      console.log(`✅ Loaded page ${page}: ${result.vehicles.length} vehicles`);
      console.log(`📊 Total: ${result.totalResults.toLocaleString()} vehicles in ${responseTime}ms`);
      
      // Update URL
      updateURL(newFilters, page);
      
    } catch (error) {
      console.error('❌ Failed to load vehicles:', error);
      setError(`Failed to load vehicles: ${error.message}`);
      setApiConnected(false);
      
      // Load demo data as fallback
      const demoData = getRealisticDemoVehicles();

      // Apply filters to demo data
      const filteredDemoData = applyFiltersToVehicles(demoData, newFilters);

      // Apply pagination to filtered data
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentPageData = filteredDemoData.slice(startIndex, endIndex);

      setVehicles(currentPageData);
      setTotalResults(filteredDemoData.length);
      setTotalPages(Math.ceil(filteredDemoData.length / itemsPerPage));

      // Extract filter options from ALL demo data (not just current page)
      const filterOptionsExtracted = extractFilterOptions(demoData);
      setFilterOptions(filterOptionsExtracted);
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
              <p>{apiConnected ? '✅ Connected to WooCommerce inventory' : '🎯 Demo Mode'} ({totalResults.toLocaleString()} vehicles)</p>
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

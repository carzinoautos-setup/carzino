import React, { useState, useEffect } from 'react';
import './App.css';
import VehicleSearchFilter from './components/VehicleSearchFilter';
import VehicleCard from './components/VehicleCard';
import Pagination from './components/Pagination';
import SearchResultsHeader from './components/SearchResultsHeader';
import { fetchVehicles, fetchFilterOptions, testAPIConnection } from './services/api';

// URL parameter helpers
const filtersToURLParams = (filters, page = 1) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    // Skip empty values and default configuration
    if (!value ||
        (Array.isArray(value) && value.length === 0) ||
        ['zipCode', 'radius', 'termLength', 'interestRate', 'downPayment'].includes(key)) {
      return;
    }

    if (Array.isArray(value)) {
      // For arrays, add each value separately
      value.forEach(item => params.append(key, item));
    } else if (value.toString().trim() !== '') {
      params.set(key, value.toString());
    }
  });

  // Add page parameter if not page 1
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

  // Parse URL parameters
  for (const [key, value] of searchParams.entries()) {
    if (Array.isArray(filters[key])) {
      // For array filters, collect all values
      if (!filters[key].includes(value)) {
        filters[key].push(value);
      }
    } else {
      // For single value filters
      filters[key] = value;
    }
  }

  return filters;
};

function App() {
  // Initialize filters from URL parameters
  const getInitialFilters = () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.toString()) {
      console.log('🔗 Initializing filters from URL:', urlParams.toString());
      return URLParamsToFilters(urlParams);
    }

    // Default filters if no URL parameters
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
  const [totalPages, setTotalPages] = useState(1);
  const resultsPerPage = 12; // Reduced from 25 to 12 for faster loading

  // Update URL when filters or page change
  const updateURL = (newFilters, page = currentPage) => {
    const params = filtersToURLParams(newFilters, page);
    const newURL = params ? `${window.location.pathname}?${params}` : window.location.pathname;

    if (newURL !== window.location.pathname + window.location.search) {
      window.history.pushState(null, '', newURL);
      console.log('🔗 Updated URL:', newURL);
    }
  };

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const newFilters = URLParamsToFilters(urlParams);
      const newPage = parseInt(urlParams.get('page') || '1', 10);

      console.log('🔙 Browser navigation detected, updating filters and page from URL');
      setFilters(newFilters);
      setCurrentPage(newPage);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

      // Always update filter options for cascading, even if no filters are active
      // This ensures base options are shown when no filters are selected
      console.log('🔗 Updating ALL filter options for conditional filtering based on:', filters);

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Filter update timeout')), 5000)
      );

      const filterData = await Promise.race([
        fetchFilterOptions(filters),
        timeoutPromise
      ]);

      setFilterOptions(filterData);

      console.log('✅ ALL filter options updated for conditional behavior:', {
        makes: filterData.makes?.length || 0,
        models: filterData.models?.length || 0,
        conditions: filterData.conditions?.length || 0,
        vehicleTypes: filterData.bodyTypes?.length || 0,
        driveTypes: filterData.drivetrains?.length || 0,
        years: filterData.years?.length || 0,
        transmissions: filterData.transmissions?.length || 0,
        exteriorColors: filterData.exteriorColors?.length || 0,
        interiorColors: filterData.interiorColors?.length || 0,
        fuelTypes: filterData.fuelTypes?.length || 0,
        trims: filterData.trims?.length || 0
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
        console.warn('Vehicle data failed, using fallback:', vehicleResult.reason.message);
        // Don't show error if we have fallback data working
        if (!vehicleData.results || vehicleData.results.length === 0) {
          setError('Failed to load vehicle data');
        }
      }

      if (filterResult.status === 'rejected') {
        console.warn('Filter data failed, using fallback:', filterResult.reason.message);
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

      // Debug first few vehicles
      console.log('🚗 First 3 vehicles for debugging:');
      transformedVehicles.slice(0, 3).forEach((vehicle, index) => {
        console.log(`Vehicle ${index + 1}:`, {
          title: vehicle.title,
          id: vehicle.id,
          rawData: vehicle.rawData ? {
            id: vehicle.rawData.id,
            name: vehicle.rawData.title,
            meta_data: vehicle.rawData.meta_data?.map(m => ({ key: m.key, value: m.value })) || [],
            attributes: vehicle.rawData.attributes?.map(a => ({ name: a.name, options: a.options })) || []
          } : 'No rawData'
        });
      });
      
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

    // Clear dependent filters when parent filter changes
    if (JSON.stringify(filters.make) !== JSON.stringify(newFilters.make)) {
      // If make changed, clear model and trim selections
      if (newFilters.model?.length > 0) {
        console.log('🔗 Make changed, clearing dependent filters (model, trim)');
        newFilters.model = [];
        newFilters.trim = [];
      }
    }

    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change

    // Update URL to reflect new filters
    updateURL(newFilters);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update URL with new page
    updateURL(filters, page);
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

    // Update URL to reflect filter removal
    updateURL(newFilters);
  };

  // Handle clear all filters
  const handleClearAllFilters = () => {
    const clearedFilters = {
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
    };

    setFilters(clearedFilters);
    setCurrentPage(1);

    // Clear URL parameters (go to base URL)
    window.history.pushState(null, '', window.location.pathname);
    console.log('🔗 Cleared all filters, reset URL to base path');
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

    console.log(`🔍 Starting vehicle filtering with ${originalCount} total vehicles`);
    console.log(`🔍 Current filters:`, filters);

    // Apply make filter
    if (filters.make && filters.make.length > 0) {
      const beforeMakeFilter = filtered.length;
      console.log(`🔍 Applying make filter for: [${filters.make.join(', ')}]`);

      filtered = filtered.filter((vehicle, index) => {
        const vehicleMake = extractMakeFromVehicle(vehicle);
        const matches = vehicleMake && filters.make.includes(vehicleMake);

        if (index < 5) { // Log first 5 vehicles for debugging
          console.log(`🚗 Vehicle ${index + 1}: "${vehicle.title}" - Make: "${vehicleMake}" - Matches: ${matches}`);
        }

        return matches;
      });
      console.log(`🔍 Make filter applied: ${beforeMakeFilter} → ${filtered.length} vehicles (filtered by: ${filters.make.join(', ')})`);
    }

    // Apply model filter
    if (filters.model && filters.model.length > 0) {
      const beforeModelFilter = filtered.length;
      console.log(`🔍 Applying model filter for: [${filters.model.join(', ')}]`);

      filtered = filtered.filter(vehicle => {
        const vehicleModel = extractModelFromVehicle(vehicle);
        const matches = vehicleModel && filters.model.includes(vehicleModel);

        console.log(`🚗 Vehicle: ${vehicle.title} - Model: "${vehicleModel}" - Matches: ${matches}`);

        if (!matches && vehicleModel) {
          console.log(`🚫 Filtering out ${vehicle.title} - Model: "${vehicleModel}" not in [${filters.model.join('", "')}]`);
        } else if (matches) {
          console.log(`✅ Keeping ${vehicle.title} - Model: "${vehicleModel}" matches filter`);
        }

        return matches;
      });
      console.log(`🔍 Model filter applied: ${beforeModelFilter} → ${filtered.length} vehicles (filtered by: [${filters.model.join(', ')}])`);
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

    if (originalCount !== filtered.length) {
      console.log(`✅ Final filtering result: ${originalCount} → ${filtered.length} vehicles`);
    }

    return filtered;
  };

  // Helper functions to extract data from vehicles
  const extractMakeFromVehicle = (vehicle) => {
    let make = null;

    // Try meta_data first (using same structure as api.js)
    const metaData = vehicle.rawData?.meta_data || vehicle.meta_data || [];
    if (Array.isArray(metaData)) {
      const makeMeta = metaData.find(meta =>
        meta.key === 'make' || meta.key === '_make' || meta.key === 'vehicle_make'
      );
      if (makeMeta?.value) {
        make = makeMeta.value;
        console.log(`📊 Found make in meta_data: "${make}" for ${vehicle.title}`);
        return make;
      }
    }

    // Try attributes (using same structure as api.js)
    const attributes = vehicle.rawData?.attributes || vehicle.attributes || [];
    if (Array.isArray(attributes)) {
      const makeAttr = attributes.find(attr =>
        attr.name && attr.name.toLowerCase().includes('make')
      );
      if (makeAttr?.options?.[0]) {
        make = makeAttr.options[0];
        console.log(`📊 Found make in attributes: "${make}" for ${vehicle.title}`);
        return make;
      }
    }

    // Try extracting from title as fallback
    const title = (vehicle.title || '').toLowerCase();
    if (title.includes('toyota')) make = 'Toyota';
    else if (title.includes('ford')) make = 'Ford';
    else if (title.includes('chevrolet') || title.includes('chevy')) make = 'Chevrolet';
    else if (title.includes('honda')) make = 'Honda';
    else if (title.includes('jeep')) make = 'Jeep';
    else if (title.includes('nissan')) make = 'Nissan';
    else if (title.includes('hyundai')) make = 'Hyundai';
    else if (title.includes('kia')) make = 'Kia';
    else if (title.includes('bmw')) make = 'BMW';
    else if (title.includes('mercedes')) make = 'Mercedes-Benz';
    else if (title.includes('audi')) make = 'Audi';
    else if (title.includes('volkswagen') || title.includes('vw')) make = 'Volkswagen';

    if (make) {
      console.log(`📊 Extracted make from title: "${make}" for ${vehicle.title}`);
    } else {
      console.log(`❌ No make found for ${vehicle.title}`);
    }

    return make;
  };

  const extractModelFromVehicle = (vehicle) => {
    let model = null;

    // Try meta_data first (using same structure as api.js)
    const metaData = vehicle.rawData?.meta_data || vehicle.meta_data || [];
    if (Array.isArray(metaData)) {
      const modelMeta = metaData.find(meta =>
        meta.key === 'model' || meta.key === '_model' || meta.key === 'vehicle_model'
      );
      if (modelMeta?.value) {
        model = modelMeta.value;
        console.log(`📊 Found model in meta_data: "${model}" for ${vehicle.title}`);
        return model;
      }
    }

    // Try attributes (using same structure as api.js)
    const attributes = vehicle.rawData?.attributes || vehicle.attributes || [];
    if (Array.isArray(attributes)) {
      const modelAttr = attributes.find(attr =>
        attr.name && attr.name.toLowerCase().includes('model')
      );
      if (modelAttr?.options?.[0]) {
        model = modelAttr.options[0];
        console.log(`📊 Found model in attributes: "${model}" for ${vehicle.title}`);
        return model;
      }
    }

    // Try extracting from title as fallback
    const title = vehicle.title || '';
    const lowerTitle = title.toLowerCase();

    // Ford models (check specific models first)
    if (lowerTitle.includes('f-150') || lowerTitle.includes('f150') || lowerTitle.includes('f 150')) {
      model = 'F-150';
    } else if (lowerTitle.includes('mustang')) {
      model = 'Mustang';
    } else if (lowerTitle.includes('explorer')) {
      model = 'Explorer';
    } else if (lowerTitle.includes('focus') && lowerTitle.includes('electric')) {
      model = 'Focus Electric';
    } else if (lowerTitle.includes('focus')) {
      model = 'Focus';
    } else if (lowerTitle.includes('edge')) {
      model = 'Edge';
    } else if (lowerTitle.includes('escape')) {
      model = 'Escape';
    } else if (lowerTitle.includes('expedition')) {
      model = 'Expedition';
    } else if (lowerTitle.includes('bronco')) {
      model = 'Bronco';
    }
    // Toyota models
    else if (lowerTitle.includes('tacoma')) {
      model = 'Tacoma';
    } else if (lowerTitle.includes('4runner') || lowerTitle.includes('4-runner')) {
      model = '4Runner';
    } else if (lowerTitle.includes('rav4') && lowerTitle.includes('hybrid')) {
      model = 'RAV4 Hybrid';
    } else if (lowerTitle.includes('rav4')) {
      model = 'RAV4';
    } else if (lowerTitle.includes('camry')) {
      model = 'Camry';
    } else if (lowerTitle.includes('corolla')) {
      model = 'Corolla';
    } else if (lowerTitle.includes('prius')) {
      model = 'Prius';
    } else if (lowerTitle.includes('highlander')) {
      model = 'Highlander';
    } else if (lowerTitle.includes('sienna')) {
      model = 'Sienna';
    }

    // Jeep models
    else if (lowerTitle.includes('wrangler')) model = 'Wrangler';
    else if (lowerTitle.includes('grand cherokee')) model = 'Grand Cherokee';
    else if (lowerTitle.includes('cherokee')) model = 'Cherokee';

    // Honda models
    else if (lowerTitle.includes('civic')) model = 'Civic';
    else if (lowerTitle.includes('accord')) model = 'Accord';
    else if (lowerTitle.includes('cr-v') || lowerTitle.includes('crv')) model = 'CR-V';
    else if (lowerTitle.includes('pilot')) model = 'Pilot';

    if (model) {
      console.log(`📊 Extracted model from title: "${model}" for ${vehicle.title}`);
      return model;
    }

    console.log(`❌ No model found for ${vehicle.title}`);
    return null;
  };

  const extractConditionFromVehicle = (vehicle) => {
    const metaData = vehicle.rawData?.meta_data || vehicle.meta_data || [];
    const conditionMeta = metaData.find(meta => meta.key === 'condition');
    if (conditionMeta?.value) return conditionMeta.value;

    const stockStatus = vehicle.rawData?.stock_status || vehicle.stock_status;
    return stockStatus === 'instock' ? 'Available' : 'Sold';
  };

  const extractVehicleTypeFromVehicle = (vehicle) => {
    const metaData = vehicle.rawData?.meta_data || vehicle.meta_data || [];
    const typeMeta = metaData.find(meta => meta.key === 'body_type');
    if (typeMeta?.value) return typeMeta.value;

    const categories = vehicle.rawData?.categories || vehicle.categories || [];
    return categories.find(cat => cat.name !== 'Uncategorized')?.name || null;
  };

  const extractDriveTypeFromVehicle = (vehicle) => {
    const metaData = vehicle.rawData?.meta_data || vehicle.meta_data || [];
    const driveMeta = metaData.find(meta => meta.key === 'drivetrain');
    if (driveMeta?.value) return driveMeta.value;

    const attributes = vehicle.rawData?.attributes || vehicle.attributes || [];
    const driveAttr = attributes.find(attr =>
      attr.name.toLowerCase().includes('drive')
    );
    if (driveAttr?.options?.[0]) return driveAttr.options[0];
    return null;
  };

  const extractTransmissionFromVehicle = (vehicle) => {
    const metaData = vehicle.rawData?.meta_data || vehicle.meta_data || [];
    const transMeta = metaData.find(meta => meta.key === 'transmission');
    if (transMeta?.value) return transMeta.value;

    const attributes = vehicle.rawData?.attributes || vehicle.attributes || [];
    const transAttr = attributes.find(attr =>
      attr.name.toLowerCase().includes('transmission')
    );
    if (transAttr?.options?.[0]) return transAttr.options[0];
    return null;
  };

  const extractYearFromVehicle = (vehicle) => {
    const metaData = vehicle.rawData?.meta_data || vehicle.meta_data || [];
    const yearMeta = metaData.find(meta => meta.key === 'year');
    if (yearMeta?.value) return yearMeta.value;

    const attributes = vehicle.rawData?.attributes || vehicle.attributes || [];
    const yearAttr = attributes.find(attr =>
      attr.name.toLowerCase().includes('year')
    );
    if (yearAttr?.options?.[0]) return yearAttr.options[0];
    return null;
  };

  const extractPriceFromVehicle = (vehicle) => {
    return vehicle.rawData?.price || vehicle.rawData?.regular_price || vehicle.price || vehicle.regular_price;
  };

  // Get current page vehicles with filtering
  const favoritesCount = Object.keys(favorites).length;
  const allFilteredVehicles = showingFavorites
    ? vehicles.filter(vehicle => favorites[vehicle.id])
    : getFilteredVehicles();

  // Update total results to reflect filtered count
  const actualTotalResults = showingFavorites ? favoritesCount : allFilteredVehicles.length;

  // Apply pagination to filtered vehicles
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const currentVehicles = showingFavorites
    ? allFilteredVehicles
    : allFilteredVehicles.slice(startIndex, endIndex);

  // Calculate total pages based on filtered results
  const filteredTotalPages = showingFavorites
    ? Math.ceil(favoritesCount / resultsPerPage)
    : Math.ceil(actualTotalResults / resultsPerPage);

  console.log(`📄 Pagination: Page ${currentPage}, showing vehicles ${startIndex + 1}-${Math.min(endIndex, actualTotalResults)} of ${actualTotalResults} total (${filteredTotalPages} pages)`);

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
          {filteredTotalPages > 1 && !showingFavorites && (
            <Pagination
              currentPage={currentPage}
              totalPages={filteredTotalPages}
              totalResults={actualTotalResults}
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

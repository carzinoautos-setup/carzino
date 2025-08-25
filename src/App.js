import React, { useState, useEffect } from 'react';
import './App.css';
import VehicleSearchFilter from './components/VehicleSearchFilter';
import VehicleCard from './components/VehicleCard';
import Pagination from './components/Pagination';
import SearchResultsHeader from './components/SearchResultsHeader';
import { fetchVehicles, fetchFilterOptions } from './services/api';

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

  // Parse URL parameters with validation
  for (const [key, value] of searchParams.entries()) {
    // Skip invalid or problematic keys
    if (key === 'page' || key === 'reload' || !value || value.length > 50) {
      continue;
    }

    // Skip timestamp-like values
    if (/^\d{10,}$/.test(value)) {
      continue;
    }

    // Only process known filter keys
    if (filters.hasOwnProperty(key)) {
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
  }

  return filters;
};

function App() {
  // Initialize filters from URL parameters with cleanup
  const getInitialFilters = () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.toString()) {
      const filters = URLParamsToFilters(urlParams);

      // Clean up any problematic filter values
      const cleanFilters = { ...filters };

      // Remove any array filters with suspicious values (like timestamps)
      Object.keys(cleanFilters).forEach(key => {
        if (Array.isArray(cleanFilters[key])) {
          cleanFilters[key] = cleanFilters[key].filter(value => {
            // Remove values that look like timestamps or are unusually long
            return value && value.length < 20 && !(/^\d{10,}$/.test(value));
          });
        }
      });

      // If we cleaned anything, update the URL
      const originalString = filtersToURLParams(filters);
      const cleanedString = filtersToURLParams(cleanFilters);
      if (originalString !== cleanedString) {
        console.log('🧹 Cleaned up problematic filters');
        window.history.replaceState(null, '', cleanedString ? `?${cleanedString}` : window.location.pathname);
      }

      return cleanFilters;
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
  const resultsPerPage = 200; // Show all vehicles on one page

  // Update URL when filters or page change
  const updateURL = (newFilters, page = currentPage) => {
    const params = filtersToURLParams(newFilters, page);
    const newURL = params ? `${window.location.pathname}?${params}` : window.location.pathname;

    if (newURL !== window.location.pathname + window.location.search) {
      window.history.pushState(null, '', newURL);
    }
  };

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const newFilters = URLParamsToFilters(urlParams);
      const newPage = parseInt(urlParams.get('page') || '1', 10);

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

  // Clean up URL parameters on mount
  useEffect(() => {
    const currentUrl = new URL(window.location);
    let urlChanged = false;

    // List of problematic parameters to remove
    const problematicParams = ['reload', 'cache', 'timestamp', 'debug', 'test'];

    // Remove known problematic parameters
    problematicParams.forEach(param => {
      if (currentUrl.searchParams.has(param)) {
        currentUrl.searchParams.delete(param);
        urlChanged = true;
      }
    });

    // Remove any timestamp-like parameters or very long values
    const paramsToDelete = [];
    for (const [key, value] of currentUrl.searchParams.entries()) {
      // Remove timestamps, very long values, or parameters with numbers > 10 digits
      if (/^\d{10,}$/.test(value) || value.length > 30 || /reload|timestamp/i.test(key)) {
        paramsToDelete.push(key);
        urlChanged = true;
      }
    }

    // Also clean up multiple page parameters
    const allParams = Array.from(currentUrl.searchParams.entries());
    const pageParams = allParams.filter(([key]) => key === 'page');
    if (pageParams.length > 1) {
      // Keep only the last page parameter
      currentUrl.searchParams.delete('page');
      currentUrl.searchParams.set('page', pageParams[pageParams.length - 1][1]);
      urlChanged = true;
    }

    paramsToDelete.forEach(param => {
      currentUrl.searchParams.delete(param);
    });

    // Update URL if we removed anything
    if (urlChanged) {
      console.log('�� Cleaned up problematic URL parameters');
      window.history.replaceState(null, '', currentUrl.pathname + currentUrl.search);
    }
  }, []);

  // Suppress CORS-related console errors and handle uncaught promises
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      // Suppress known CORS/fetch errors to avoid confusing users
      if (message.includes('Failed to fetch') ||
          message.includes('CORS') ||
          message.includes('TypeError: NetworkError') ||
          message.includes('TypeError: Failed to fetch')) {
        return; // Don't log these errors
      }
      originalError.apply(console, args);
    };

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event) => {
      if (event.reason && event.reason.message &&
          event.reason.message.includes('Failed to fetch')) {
        event.preventDefault(); // Prevent the error from being logged
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      console.error = originalError; // Restore original error handler
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Connect to real WordPress API
  useEffect(() => {
    const connectToAPI = async () => {
      console.log('�� CONNECTING TO YOUR REAL WORDPRESS DATA...');
      setLoading(true);

      try {
        console.log('🔗 Testing WordPress API connection...');

        // Direct API test with simple fetch
        const testUrl = `${process.env.REACT_APP_WP_SITE_URL}/wp-json/wc/v3/products?per_page=200&consumer_key=${process.env.REACT_APP_WC_CONSUMER_KEY}&consumer_secret=${process.env.REACT_APP_WC_CONSUMER_SECRET}`;

        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const vehicles = await response.json();
        console.log('✅ API CONNECTED! Received vehicles:', vehicles.length);

        // DEBUG: Show ALL vehicles with their account numbers
        console.log('🔍 ALL VEHICLES WITH ACCOUNT NUMBERS:');
        vehicles.forEach((vehicle, index) => {
          const accountMeta = vehicle.meta_data?.find(m => m.key === 'account_number_seller');
          const accountNumber = accountMeta?.value || 'NO ACCOUNT';
          console.log(`   ${index + 1}. ${vehicle.name} - Account: ${accountNumber} - Has seller_data: ${!!vehicle.seller_data}`);

          if (vehicle.seller_data) {
            console.log(`      ✅ Seller: ${vehicle.seller_data.account_name}`);
          } else {
            console.log(`      ❌ No seller_data for account ${accountNumber}`);
          }
        });

        // Look for vehicles with seller_data (from your WordPress snippet)
        const vehiclesWithSeller = vehicles.filter(v => v.seller_data);
        console.log(`🎯 Found ${vehiclesWithSeller.length} vehicles with seller_data out of ${vehicles.length} total`);

        if (vehiclesWithSeller.length > 0) {
          console.log('✅ SELLER DATA WORKING:', vehiclesWithSeller[0].seller_data);
        }

        // Transform data for React
        const transformedVehicles = vehicles.map((vehicle, index) => ({
          id: vehicle.id || `vehicle-${index}`,
          featured: vehicle.featured || false,
          viewed: false,
          images: vehicle.images?.length > 0 ? vehicle.images.map(img => img.src) : ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=450&h=300&fit=crop'],
          badges: [],
          title: vehicle.name,
          mileage: "Contact Dealer",
          transmission: "Auto",
          doors: "4 doors",
          salePrice: vehicle.price ? `$${parseFloat(vehicle.price).toLocaleString()}` : 'Call for Price',
          payment: vehicle.price ? `$${Math.round(parseFloat(vehicle.price) * 0.02)}` : 'Call',
          dealer: vehicle.seller_data?.account_name || 'Carzino Auto Sales',
          location: vehicle.seller_data ? `${vehicle.seller_data.city || 'Seattle'}, ${vehicle.seller_data.state || 'WA'}` : 'Seattle, WA',
          phone: vehicle.seller_data?.phone || '(253) 555-0100',
          seller_data: vehicle.seller_data,
          meta_data: vehicle.meta_data || [],
          rawData: vehicle
        }));

        setVehicles(transformedVehicles);
        setTotalResults(vehicles.length);
        setLoading(false);
        setApiConnected(true);
        setError(null);

        console.log('✅ REAL WORDPRESS VEHICLES LOADED!');

      } catch (error) {
        console.error('❌ API CONNECTION FAILED:', error.message);
        setApiConnected(false);
        setLoading(false);

        // Detailed error handling for different failure types
        if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
          setError(`🔧 CORS Issue Detected!
            STEP 1: Ensure Snippet #5 (CORS Headers) is ACTIVE in WordPress WPCode plugin
            STEP 2: Verify your domain is in the allowed origins list
            STEP 3: Try refreshing this page
            Current domain: ${window.location.origin}`);
        } else if (error.message.includes('timed out')) {
          setError(`⏰ Connection Timeout - WordPress is slow to respond. Using demo data.`);
        } else if (error.message.includes('500')) {
          setError(`🔧 WordPress Server Error (500) - Check if WooCommerce is active and WordPress snippets are working.`);
        } else {
          setError(`❌ WordPress API Error: ${error.message}`);
        }

        // Load demo data so app works while fixing issues
        const demoData = getRealisticDemoVehicles();
        setVehicles(demoData);
        setTotalResults(demoData.length);

        console.log('🚀 FALLBACK: Loaded demo data to keep app functional');
      }
    };

    connectToAPI();
  }, []);

  // Load additional data when API is connected
  useEffect(() => {
    if (apiConnected && vehicles.length > 0) {
      updateFilterOptions();
    }
  }, [apiConnected, vehicles.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update filter options when filters change
  useEffect(() => {
    if (apiConnected && vehicles.length > 0 && !loading) {
      const timeoutId = setTimeout(() => {
        updateFilterOptions();
      }, 150); // Faster response for better UX

      return () => clearTimeout(timeoutId);
    }
  }, [filters, apiConnected, vehicles.length, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Function to update only filter options (for cascading filters)
  const updateFilterOptions = async () => {
    try {
      // Skip if already loading or not connected
      if (loading || !apiConnected) {
        return;
      }

      // If we have vehicles loaded, use client-side filtering for better performance
      if (vehicles.length > 0) {
        const { getFilteredOptions } = await import('./services/api');
        const cascadingOptions = getFilteredOptions(vehicles, filters);
        setFilterOptions(cascadingOptions);
        return;
      }

      // Fallback to API call if no vehicles loaded yet
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Filter update timeout')), 15000)
      );

      const filterData = await Promise.race([
        fetchFilterOptions(filters),
        timeoutPromise
      ]);

      setFilterOptions(filterData);
    } catch (err) {
      // Silently fail to prevent blocking the UI
    }
  };

  // Removed unused loadVehiclesAndFilters function

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

    // Handle unrealistic prices (over $500,000 or under $100)
    if (numPrice > 500000 || numPrice < 100) {
      return 'Call for Price';
    }

    return `$${numPrice.toLocaleString()}`;
  };

  const calculatePayment = (price) => {
    if (!price || price === '0') return 'Call';

    const numPrice = parseFloat(price);

    // Handle unrealistic prices
    if (numPrice > 500000 || numPrice < 100) {
      return 'Call';
    }

    // Simple payment calculation (real app would use proper finance calculations)
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

  // Realistic demo vehicles that match your WordPress inventory structure
  const getRealisticDemoVehicles = () => [
    {
      id: `demo-${Date.now()}-1`,
      featured: true,
      viewed: false,
      images: ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=450&h=300&fit=crop"],
      badges: ["Featured", "In Stock"],
      title: "2016 Hyundai Elantra SE",
      mileage: "89,456",
      transmission: "Auto",
      doors: "4 doors",
      salePrice: "$8,995",
      payment: "$199",
      dealer: "Carson Cars",
      location: "Seattle, WA",
      phone: "(253) 555-0100",
      meta_data: [
        { key: 'account_number_seller', value: '101' },
        { key: 'acount_name_seller', value: 'Carson Cars' },
        { key: 'city_seller', value: 'Seattle' },
        { key: 'state_seller', value: 'WA' },
        { key: 'zip_seller', value: '98101' }
      ],
      seller_data: {
        account_name: 'Carson Cars',
        account_number: '101',
        business_name: 'Carson Cars',
        city: 'Seattle',
        state: 'WA',
        zip: '98101',
        phone: '(253) 555-0100'
      },
      attributes: [],
      categories: [],
      stock_status: 'instock'
    },
    {
      id: `demo-${Date.now()}-2`,
      featured: false,
      viewed: true,
      images: ["https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=450&h=300&fit=crop"],
      badges: ["Recently Viewed", "In Stock"],
      title: "2020 Honda Civic Si",
      mileage: "32,123",
      transmission: "Manual",
      doors: "4 doors",
      salePrice: "$22,995",
      payment: "$329",
      dealer: "Del Sol Auto Sales",
      location: "Everett, WA 98204",
      phone: "(425) 555-0100",
      meta_data: [
        { key: 'account_number_seller', value: '73' },
        { key: 'acount_name_seller', value: 'Del Sol Auto Sales' },
        { key: 'city_seller', value: 'Everett' },
        { key: 'state_seller', value: 'WA' },
        { key: 'zip_seller', value: '98204' }
      ],
      seller_data: {
        account_name: 'Del Sol Auto Sales',
        account_number: '73',
        business_name: 'Del Sol Auto Sales',
        city: 'Everett',
        state: 'WA',
        zip: '98204',
        phone: '(425) 555-0100'
      },
      attributes: [],
      categories: [],
      stock_status: 'instock'
    },
    {
      id: `demo-${Date.now()}-3`,
      featured: false,
      viewed: false,
      images: ["https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=450&h=300&fit=crop"],
      badges: ["SUV", "In Stock"],
      title: "2019 Ford F-150 XLT",
      mileage: "65,432",
      transmission: "Auto",
      doors: "4 doors",
      salePrice: "$31,995",
      payment: "$449",
      dealer: "Northwest Auto Group",
      location: "Tacoma, WA 98402",
      phone: "(253) 555-0200",
      meta_data: [
        { key: 'account_number_seller', value: '205' },
        { key: 'acount_name_seller', value: 'Northwest Auto Group' },
        { key: 'city_seller', value: 'Tacoma' },
        { key: 'state_seller', value: 'WA' },
        { key: 'zip_seller', value: '98402' }
      ],
      seller_data: {
        account_name: 'Northwest Auto Group',
        account_number: '205',
        business_name: 'Northwest Auto Group',
        city: 'Tacoma',
        state: 'WA',
        zip: '98402',
        phone: '(253) 555-0200'
      },
      attributes: [],
      categories: [],
      stock_status: 'instock'
    },
    {
      id: `demo-${Date.now()}-4`,
      featured: true,
      viewed: false,
      images: ["https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=450&h=300&fit=crop"],
      badges: ["Featured", "Electric"],
      title: "2022 Tesla Model 3",
      mileage: "18,567",
      transmission: "Single Speed",
      doors: "4 doors",
      salePrice: "$39,995",
      payment: "$549",
      dealer: "Electric Auto Northwest",
      location: "Bellevue, WA 98004",
      phone: "(425) 555-0300",
      meta_data: [
        { key: 'account_number_seller', value: '312' },
        { key: 'acount_name_seller', value: 'Electric Auto Northwest' },
        { key: 'city_seller', value: 'Bellevue' },
        { key: 'state_seller', value: 'WA' },
        { key: 'zip_seller', value: '98004' }
      ],
      seller_data: {
        account_name: 'Electric Auto Northwest',
        account_number: '312',
        business_name: 'Electric Auto Northwest',
        city: 'Bellevue',
        state: 'WA',
        zip: '98004',
        phone: '(425) 555-0300'
      },
      attributes: [],
      categories: [],
      stock_status: 'instock'
    },
    {
      id: `demo-${Date.now()}-5`,
      featured: false,
      viewed: false,
      images: ["https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=450&h=300&fit=crop"],
      badges: ["Luxury", "In Stock"],
      title: "2021 BMW 3 Series 330i",
      mileage: "25,890",
      transmission: "Auto",
      doors: "4 doors",
      salePrice: "$34,995",
      payment: "$489",
      dealer: "Premium Motors Seattle",
      location: "Seattle, WA 98109",
      phone: "(206) 555-0400",
      meta_data: [
        { key: 'account_number_seller', value: '445' },
        { key: 'acount_name_seller', value: 'Premium Motors Seattle' },
        { key: 'city_seller', value: 'Seattle' },
        { key: 'state_seller', value: 'WA' },
        { key: 'zip_seller', value: '98109' }
      ],
      seller_data: {
        account_name: 'Premium Motors Seattle',
        account_number: '445',
        business_name: 'Premium Motors Seattle',
        city: 'Seattle',
        state: 'WA',
        zip: '98109',
        phone: '(206) 555-0400'
      },
      attributes: [],
      categories: [],
      stock_status: 'instock'
    }
  ];

  // Fallback sample data with unique IDs
  const getSampleVehicles = () => [
    {
      id: `sample-${Date.now()}-1`,
      featured: true,
      viewed: true,
      images: ["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=450&h=300&fit=crop"],
      badges: ["Demo Mode", "Featured"],
      title: "2021 Toyota RAV4 XLE (Demo Data)",
      mileage: "32,456",
      transmission: "Auto",
      doors: "4 doors",
      salePrice: "$26,995",
      payment: "$399",
      dealer: "Demo Dealer",
      location: "Seattle, WA",
      phone: "(253) 555-0100",
      meta_data: [],
      attributes: [],
      categories: [],
      stock_status: 'instock'
    },
    {
      id: `sample-${Date.now()}-2`,
      featured: false,
      viewed: false,
      images: ["https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=450&h=300&fit=crop"],
      badges: ["Demo Mode", "Available"],
      title: "2020 Honda Civic Si (Demo Data)",
      mileage: "24,567",
      transmission: "Manual",
      doors: "4 doors",
      salePrice: "$22,995",
      payment: "$329",
      dealer: "Demo Dealer",
      location: "Tacoma, WA",
      phone: "(253) 555-0200",
      meta_data: [],
      attributes: [],
      categories: [],
      stock_status: 'instock'
    },
    {
      id: `sample-${Date.now()}-3`,
      featured: false,
      viewed: true,
      images: ["https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=450&h=300&fit=crop"],
      badges: ["Demo Mode", "Recently Viewed"],
      title: "2019 Ford F-150 XLT (Demo Data)",
      mileage: "45,321",
      transmission: "Auto",
      doors: "4 doors",
      salePrice: "$31,995",
      payment: "$449",
      dealer: "Demo Dealer",
      location: "Everett, WA",
      phone: "(425) 555-0300",
      meta_data: [],
      attributes: [],
      categories: [],
      stock_status: 'instock'
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
    // Clear dependent filters when parent filter changes
    if (JSON.stringify(filters.make) !== JSON.stringify(newFilters.make)) {
      // If make changed, always clear model and trim selections for clean cascading
      newFilters.model = [];
      newFilters.trim = [];
    }

    // Clear trim when model changes
    if (JSON.stringify(filters.model) !== JSON.stringify(newFilters.model)) {
      newFilters.trim = [];
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
      newFilters.model = [];
      newFilters.trim = [];
    } else if (category === 'model') {
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
  };

  // Handle search
  const handleSearch = (query) => {
    // TODO: Implement search in API call
    setCurrentPage(1);
  };

  // Filter vehicles based on selected filters
  const getFilteredVehicles = () => {
    let filtered = vehicles;

    // Apply make filter
    if (filters.make && filters.make.length > 0) {
      filtered = filtered.filter((vehicle) => {
        const vehicleMake = extractMakeFromVehicle(vehicle);
        return vehicleMake && filters.make.includes(vehicleMake);
      });
    }

    // Apply model filter
    if (filters.model && filters.model.length > 0) {
      console.log(`��� Applying model filter for: [${filters.model.join(', ')}]`);

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
    let make = null;

    // Try meta_data first - ACF fields are directly in vehicle.meta_data from API
    const metaData = vehicle.meta_data || vehicle.rawData?.meta_data || [];
    if (Array.isArray(metaData)) {

      const makeMeta = metaData.find(meta =>
        meta.key === 'make' || meta.key === '_make' || meta.key === 'vehicle_make' || meta.key.includes('make')
      );
      if (makeMeta?.value) {
        make = makeMeta.value;
        return make;
      }
    }

    // Try attributes - they are directly in vehicle.attributes from API
    const attributes = vehicle.attributes || vehicle.rawData?.attributes || [];
    if (Array.isArray(attributes)) {
      const makeAttr = attributes.find(attr =>
        attr.name && attr.name.toLowerCase().includes('make')
      );
      if (makeAttr?.options?.[0]) {
        make = makeAttr.options[0];
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


    return make;
  };

  const extractModelFromVehicle = (vehicle) => {
    let model = null;

    // Try meta_data first - ACF fields are directly in vehicle.meta_data from API
    const metaData = vehicle.meta_data || vehicle.rawData?.meta_data || [];
    if (Array.isArray(metaData)) {
      const modelMeta = metaData.find(meta =>
        meta.key === 'model' || meta.key === '_model' || meta.key === 'vehicle_model'
      );
      if (modelMeta?.value) {
        model = modelMeta.value;
        return model;
      }
    }

    // Try attributes - they are directly in vehicle.attributes from API
    const attributes = vehicle.attributes || vehicle.rawData?.attributes || [];
    if (Array.isArray(attributes)) {
      const modelAttr = attributes.find(attr =>
        attr.name && attr.name.toLowerCase().includes('model')
      );
      if (modelAttr?.options?.[0]) {
        model = modelAttr.options[0];
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
      return model;
    }

    console.log(`�� No model found for ${vehicle.title}`);
    return null;
  };

  const extractConditionFromVehicle = (vehicle) => {
    const metaData = vehicle.meta_data || vehicle.rawData?.meta_data || [];
    const conditionMeta = metaData.find(meta => meta.key === 'condition');
    if (conditionMeta?.value) return conditionMeta.value;

    const stockStatus = vehicle.stock_status || vehicle.rawData?.stock_status;
    return stockStatus === 'instock' ? 'Available' : 'Sold';
  };

  const extractVehicleTypeFromVehicle = (vehicle) => {
    const metaData = vehicle.meta_data || vehicle.rawData?.meta_data || [];
    const typeMeta = metaData.find(meta => meta.key === 'body_type');
    if (typeMeta?.value) return typeMeta.value;

    const categories = vehicle.categories || vehicle.rawData?.categories || [];
    return categories.find(cat => cat.name !== 'Uncategorized')?.name || null;
  };

  const extractDriveTypeFromVehicle = (vehicle) => {
    const metaData = vehicle.meta_data || vehicle.rawData?.meta_data || [];
    const driveMeta = metaData.find(meta => meta.key === 'drivetrain');
    if (driveMeta?.value) return driveMeta.value;

    const attributes = vehicle.attributes || vehicle.rawData?.attributes || [];
    const driveAttr = attributes.find(attr =>
      attr.name.toLowerCase().includes('drive')
    );
    if (driveAttr?.options?.[0]) return driveAttr.options[0];
    return null;
  };

  const extractTransmissionFromVehicle = (vehicle) => {
    const metaData = vehicle.meta_data || vehicle.rawData?.meta_data || [];
    const transMeta = metaData.find(meta => meta.key === 'transmission');
    if (transMeta?.value) return transMeta.value;

    const attributes = vehicle.attributes || vehicle.rawData?.attributes || [];
    const transAttr = attributes.find(attr =>
      attr.name.toLowerCase().includes('transmission')
    );
    if (transAttr?.options?.[0]) return transAttr.options[0];
    return null;
  };

  const extractYearFromVehicle = (vehicle) => {
    const metaData = vehicle.meta_data || vehicle.rawData?.meta_data || [];
    const yearMeta = metaData.find(meta => meta.key === 'year');
    if (yearMeta?.value) return yearMeta.value;

    const attributes = vehicle.attributes || vehicle.rawData?.attributes || [];
    const yearAttr = attributes.find(attr =>
      attr.name.toLowerCase().includes('year')
    );
    if (yearAttr?.options?.[0]) return yearAttr.options[0];
    return null;
  };

  const extractPriceFromVehicle = (vehicle) => {
    return vehicle.price || vehicle.regular_price || vehicle.rawData?.price || vehicle.rawData?.regular_price;
  };

  // Get current page vehicles with filtering
  const favoritesCount = Object.keys(favorites).length;
  const allFilteredVehicles = showingFavorites
    ? vehicles.filter(vehicle => favorites[vehicle.id])
    : getFilteredVehicles();

  // Update total results to reflect filtered count
  const actualTotalResults = showingFavorites ? favoritesCount : allFilteredVehicles.length;

  // Apply pagination to filtered vehicles with bounds checking
  const maxPages = Math.ceil(actualTotalResults / resultsPerPage);
  const safePage = Math.min(Math.max(currentPage, 1), maxPages || 1);

  const startIndex = (safePage - 1) * resultsPerPage;
  const endIndex = Math.min(startIndex + resultsPerPage, actualTotalResults);
  const currentVehicles = showingFavorites
    ? allFilteredVehicles
    : allFilteredVehicles.slice(startIndex, endIndex);

  // Update current page if it was out of bounds
  if (safePage !== currentPage && maxPages > 0) {
    setCurrentPage(safePage);
  }

  // Calculate total pages based on filtered results
  const filteredTotalPages = showingFavorites
    ? Math.ceil(favoritesCount / resultsPerPage)
    : Math.ceil(actualTotalResults / resultsPerPage);

  console.log(`📄 Pagination: Page ${currentPage}, showing vehicles ${startIndex + 1}-${Math.min(endIndex, actualTotalResults)} of ${actualTotalResults} total (${filteredTotalPages} pages)`);
  console.log(`🚗 Total vehicles loaded: ${vehicles.length}`);
  console.log(`���� All filtered vehicles count: ${allFilteredVehicles.length}`);
  console.log(`��� Current vehicles to display: ${currentVehicles.length}`);
  console.log(`🎯 Current filters:`, filters);

  // Debug: Show first few filtered vehicles
  if (allFilteredVehicles.length > 0 && allFilteredVehicles.length !== vehicles.length) {
    console.log(`���� First 5 filtered vehicles:`, allFilteredVehicles.slice(0, 5).map(v => ({
      title: v.title,
      id: v.id
    })));
  }

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
              <div style={{ color: '#666', marginBottom: '1rem' }}>
                Loading vehicles from: {process.env.REACT_APP_WP_SITE_URL}
              </div>
              <div style={{ color: '#888', fontSize: '0.9rem' }}>
                ⏰ This may take 10-15 seconds for large inventories
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
            ? `✅ Connected to your WooCommerce inventory (${totalResults} vehicles loaded, ${actualTotalResults} shown)`
            : `🎯 Demo Mode: Showing ${actualTotalResults} sample vehicles`
          }
          {!apiConnected && (
            <span style={{ marginLeft: '10px' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: '#007cba',
                  color: 'white',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Retry Connection
              </button>
            </span>
          )}
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
            {error.includes('server error') && (
              <details style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#666' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  🔍 Troubleshooting Steps (Click to expand)
                </summary>
                <div style={{ marginTop: '0.5rem', paddingLeft: '1rem' }}>
                  <p><strong>Common causes of 500 errors:</strong></p>
                  <ul style={{ margin: '0.5rem 0', paddingLeft: '1rem' }}>
                    <li>WooCommerce plugin not active or properly configured</li>
                    <li>WordPress PHP errors or memory limits</li>
                    <li>Invalid API credentials or permissions</li>
                    <li>Database connection issues</li>
                  </ul>
                  <p><strong>Quick checks:</strong></p>
                  <ol style={{ margin: '0.5rem 0', paddingLeft: '1rem' }}>
                    <li>Visit your WordPress site: <a href={process.env.REACT_APP_WP_SITE_URL} target="_blank" rel="noopener noreferrer" style={{color: '#007cba'}}>{process.env.REACT_APP_WP_SITE_URL}</a></li>
                    <li>Check if WooCommerce is active in WordPress admin</li>
                    <li>Verify API keys in WooCommerce → Settings → Advanced → REST API</li>
                    <li>Check WordPress error logs or contact your hosting provider</li>
                  </ol>
                </div>
              </details>
            )}
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
                  ? (
                    <div>
                      <p>No vehicles found. Try adjusting your filters.</p>
                      <button
                        onClick={handleClearAllFilters}
                        style={{
                          background: '#007cba',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          marginTop: '10px'
                        }}
                      >
                        Clear All Filters & Show All Vehicles
                      </button>
                    </div>
                  )
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

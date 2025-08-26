/**
 * Enhanced API Service with Server-Side Pagination
 * Works with WooCommerce or Elasticsearch
 */

const API_BASE = process.env.REACT_APP_API_BASE || `${process.env.REACT_APP_WP_SITE_URL}/wp-json/wc/v3`;
const ELASTICSEARCH_ENDPOINT = process.env.REACT_APP_ELASTICSEARCH_URL || `${process.env.REACT_APP_WP_SITE_URL}/wp-json/elasticpress/v1`;

/**
 * Fetch vehicles with server-side pagination
 * @param {number} page - Page number (1-based)
 * @param {number} limit - Items per page (default: 20)
 * @param {object} filters - Search filters
 * @param {string} sortBy - Sort field
 * @returns {object} { vehicles, totalResults, totalPages, currentPage }
 */
// Demo data functions removed - now handled in App.js

/**
 * Test API connectivity with proper authentication and robust error handling
 */
const testAPIConnectivity = async () => {
  try {
    const params = new URLSearchParams({
      per_page: '1',
      status: 'publish'
    });

    const testUrl = `${API_BASE}/products?${params}`;

    // Prepare headers with Basic Auth
    const headers = {
      'Accept': 'application/json',
    };

    if (process.env.REACT_APP_WC_CONSUMER_KEY) {
      const credentials = btoa(`${process.env.REACT_APP_WC_CONSUMER_KEY}:${process.env.REACT_APP_WC_CONSUMER_SECRET}`);
      headers['Authorization'] = `Basic ${credentials}`;
    }

    // Use AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    let response;
    try {
      response = await fetch(testUrl, {
        method: 'GET',
        headers: headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (networkError) {
      clearTimeout(timeoutId);
      // Silently handle network errors - API is clearly not reachable
      console.warn('⚠️ API connectivity test: Network unreachable');
      return false;
    }

    if (response.ok) {
      try {
        const data = await response.json();
        console.log('✅ API connectivity test successful - found', data.length, 'products');
        return true;
      } catch (parseError) {
        console.warn('⚠️ API connectivity test: Response parse error');
        return false;
      }
    } else {
      console.warn('⚠️ API connectivity test failed: HTTP', response.status);
      return false;
    }
  } catch (error) {
    // Catch any other unexpected errors
    console.warn('⚠️ API connectivity test failed: Unexpected error');
    return false;
  }
};

/**
 * Fetch all vehicles matching filters for filter option extraction
 */
export const fetchAllFilteredVehicles = async (filters = {}) => {
  try {
    console.log('🔍 FORCE FETCHING VEHICLES FROM YOUR API for filter options with filters:', filters);

    // Skip connectivity test - attempt real API call directly
    console.log('📡 Skipping connectivity test - trying real API directly');

    // 🚀 PERFORMANCE: Further reduced for speed
    const baseParams = {
      per_page: '30', // Reduced from 50 for even faster loading
      status: 'publish',
      _fields: 'id,name,meta_data' // Only essential fields for filter extraction
    };

    const filterParams = buildWooCommerceFilters(filters);
    const allParams = { ...baseParams, ...filterParams };
    const params = new URLSearchParams(allParams);
    const fullUrl = `${API_BASE}/products?${params}`;

    // Prepare authentication headers
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    if (process.env.REACT_APP_WC_CONSUMER_KEY) {
      const credentials = btoa(`${process.env.REACT_APP_WC_CONSUMER_KEY}:${process.env.REACT_APP_WC_CONSUMER_SECRET}`);
      headers['Authorization'] = `Basic ${credentials}`;
    }

    let response;
    try {
      response = await fetch(fullUrl, {
        method: 'GET',
        headers: headers,
      });
    } catch (networkError) {
      console.warn('⚠️ Network error fetching filter options, using demo data:', networkError.message);
      const demoResult = getDemoDataFallback(1, 50, filters);
      return demoResult.vehicles;
    }

    if (!response.ok) {
      console.warn('⚠️ HTTP error fetching filter options, using demo data');
      const demoResult = getDemoDataFallback(1, 50, filters);
      return demoResult.vehicles;
    }

    const vehicles = await response.json();
    console.log('📦 Fetched', vehicles.length, 'vehicles for filter option extraction');

    // Transform and apply client-side filtering
    const transformedVehicles = vehicles.map(transformWooCommerceVehicle);

    const filteredVehicles = transformedVehicles.filter(vehicle => {
      const getMeta = (key) => {
        const meta = vehicle.meta_data?.find(m => m.key === key);
        return meta ? meta.value : '';
      };

      const extractMakeFromTitle = () => {
        const titleParts = vehicle.title.split(' ');
        return titleParts[1] || '';
      };

      // Apply all filter types for comprehensive filtering
      if (filters.make && filters.make.length > 0) {
        const vehicleMake = getMeta('make') || extractMakeFromTitle();
        if (!filters.make.includes(vehicleMake)) {
          return false;
        }
      }

      if (filters.model && filters.model.length > 0) {
        const vehicleModel = getMeta('model');
        if (!filters.model.includes(vehicleModel)) {
          return false;
        }
      }

      if (filters.condition && filters.condition.length > 0) {
        const vehicleCondition = getMeta('condition');
        if (!filters.condition.includes(vehicleCondition)) {
          return false;
        }
      }

      if (filters.vehicleType && filters.vehicleType.length > 0) {
        const vehicleType = getMeta('body_type') || getMeta('vehicleType');
        if (!filters.vehicleType.includes(vehicleType)) {
          return false;
        }
      }

      return true;
    });

    console.log('✅ Filtered to', filteredVehicles.length, 'vehicles for filter options');
    return filteredVehicles;

  } catch (error) {
    console.warn('⚠️ Error fetching vehicles for filter options, using demo data:', error.message);
    const demoResult = getDemoDataFallback(1, 50, filters);
    return demoResult.vehicles;
  }
};

// Demo data fallback when API is completely unavailable
const getDemoDataFallback = (page = 1, limit = 20, filters = {}) => {
  const demoVehicles = [
    {
      id: 'demo-1',
      title: '2021 Toyota RAV4 XLE',
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
      title: '2020 Honda Civic Si',
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
      title: '2019 Ford F-150 XLT',
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
    },
    {
      id: 'demo-4',
      title: '2022 Ford Mustang GT',
      featured: true,
      viewed: false,
      images: ['https://images.unsplash.com/photo-1600712242805-5f78671b24da?w=450&h=300&fit=crop'],
      badges: ['Popular'],
      mileage: "12,450",
      transmission: "Auto",
      doors: "2 doors",
      salePrice: "$45,995",
      payment: "$689",
      dealer: "Performance Motors",
      location: "Bellevue, WA",
      phone: "(425) 555-0400",
      seller_data: null,
      meta_data: [
        { key: 'make', value: 'Ford' },
        { key: 'condition', value: 'Used' },
        { key: 'body_type', value: 'Coupe' }
      ],
      rawData: {}
    },
    {
      id: 'demo-5',
      title: '2020 Toyota Camry LE',
      featured: false,
      viewed: false,
      images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=450&h=300&fit=crop'],
      badges: [],
      mileage: "38,900",
      transmission: "Auto",
      doors: "4 doors",
      salePrice: "$24,995",
      payment: "$399",
      dealer: "City Toyota",
      location: "Kent, WA",
      phone: "(253) 555-0500",
      seller_data: null,
      meta_data: [
        { key: 'make', value: 'Toyota' },
        { key: 'condition', value: 'Used' },
        { key: 'body_type', value: 'Sedan' }
      ],
      rawData: {}
    },
    {
      id: 'demo-6',
      title: '2018 Honda CR-V EX',
      featured: false,
      viewed: false,
      images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=450&h=300&fit=crop'],
      badges: [],
      mileage: "54,200",
      transmission: "Auto",
      doors: "4 doors",
      salePrice: "$26,995",
      payment: "$429",
      dealer: "Honda Center",
      location: "Renton, WA",
      phone: "(425) 555-0600",
      seller_data: null,
      meta_data: [
        { key: 'make', value: 'Honda' },
        { key: 'condition', value: 'Used' },
        { key: 'body_type', value: 'SUV' }
      ],
      rawData: {}
    }
  ];

  // Apply basic filtering to demo data
  const filteredVehicles = demoVehicles.filter(vehicle => {
    const getMeta = (key) => {
      const meta = vehicle.meta_data?.find(m => m.key === key);
      return meta ? meta.value : '';
    };

    const extractMakeFromTitle = () => {
      const titleParts = vehicle.title.split(' ');
      return titleParts[1] || '';
    };

    // Check make filter
    if (filters.make && filters.make.length > 0) {
      const vehicleMake = getMeta('make') || extractMakeFromTitle();
      if (!filters.make.includes(vehicleMake)) {
        return false;
      }
    }

    return true;
  });

  // Apply pagination
  const startIndex = (page - 1) * limit;
  const paginatedVehicles = filteredVehicles.slice(startIndex, startIndex + limit);

  return {
    vehicles: paginatedVehicles,
    totalResults: filteredVehicles.length,
    totalPages: Math.ceil(filteredVehicles.length / limit),
    currentPage: page,
    searchTime: 50,
    isDemo: true
  };
};

export const fetchVehiclesPaginated = async (page = 1, limit = 20, filters = {}, sortBy = 'relevance') => {
  console.log('⚡ Fast API call...');

  // 🚀 PERFORMANCE: Add overall timeout
  return Promise.race([
    (async () => {
      // Use Elasticsearch if available, fallback to WooCommerce
      const useElasticsearch = process.env.REACT_APP_USE_ELASTICSEARCH === 'true';

      if (useElasticsearch) {
        return await fetchFromElasticsearch(page, limit, filters, sortBy);
      } else {
        return await fetchFromWooCommerce(page, limit, filters, sortBy);
      }
    })(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000)
    )
  ]).catch(error => {
    console.error('❌ API failed:', error.message);
    // Only fall back to demo data after real API attempt fails
    return getDemoDataFallback(page, limit, filters);
  });
};

/**
 * Elasticsearch search with pagination
 */
const fetchFromElasticsearch = async (page, limit, filters, sortBy) => {
  const offset = (page - 1) * limit;
  
  const searchQuery = {
    from: offset,
    size: limit,
    query: buildElasticsearchQuery(filters),
    sort: buildElasticsearchSort(sortBy),
    aggs: {
      total_count: {
        value_count: {
          field: "_id"
        }
      }
    }
  };

  const response = await fetch(`${ELASTICSEARCH_ENDPOINT}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(searchQuery)
  });

  if (!response.ok) {
    throw new Error(`Elasticsearch error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    vehicles: data.hits.hits.map(hit => transformElasticsearchVehicle(hit._source)),
    totalResults: data.hits.total.value || data.hits.total,
    totalPages: Math.ceil((data.hits.total.value || data.hits.total) / limit),
    currentPage: page,
    searchTime: data.took || 0
  };
};

/**
 * WooCommerce API with pagination
 */
const fetchFromWooCommerce = async (page, limit, filters, sortBy) => {
  // 🚀 PERFORMANCE: Only fetch essential fields to reduce payload size
  const baseParams = {
    page: page.toString(),
    per_page: limit.toString(),
    status: 'publish',
    _fields: 'id,name,price,images,meta_data,featured' // Only get what we need - 80% smaller payload!
  };

  const filterParams = buildWooCommerceFilters(filters);
  const sortParams = buildWooCommerceSort(sortBy);

  // 🚀 PERFORMANCE: Check cache first
  const cacheKey = `wc_${page}_${limit}_${JSON.stringify(filters)}_${sortBy}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const cachedData = JSON.parse(cached);
      const cacheAge = Date.now() - cachedData.timestamp;
      if (cacheAge < 30000) { // 30 seconds cache
        console.log('⚡ CACHE HIT - returning cached data in ~5ms');
        return { ...cachedData.data, searchTime: 5, isCached: true };
      }
    } catch (e) {
      // Invalid cache, continue with API call
    }
  }

  // Combine all parameters
  const allParams = {
    ...baseParams,
    ...filterParams
  };

  // Only add sort parameters if they don't cause issues
  if (sortParams && Object.keys(sortParams).length > 0) {
    Object.assign(allParams, sortParams);
  }

  const params = new URLSearchParams(allParams);
  const fullUrl = `${API_BASE}/products?${params}`;

  // Prepare authentication headers (try Basic Auth first, fallback to query params)
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  // Add Basic Auth header if credentials are available
  if (process.env.REACT_APP_WC_CONSUMER_KEY) {
    const credentials = btoa(`${process.env.REACT_APP_WC_CONSUMER_KEY}:${process.env.REACT_APP_WC_CONSUMER_SECRET}`);
    headers['Authorization'] = `Basic ${credentials}`;
  }

  console.log('🔄 WooCommerce API call...');

  // 🚀 PERFORMANCE: Add 10 second timeout to prevent hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  let response;

  try {
    response = await fetch(fullUrl, {
      method: 'GET',
      headers: headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

  } catch (networkError) {
    clearTimeout(timeoutId);
    console.error('❌ Network Error:', networkError.message);
    throw new Error(`Network error: Unable to connect to WooCommerce API. ${networkError.message}`);
  }

  if (!response.ok) {
    let errorText = '';
    let errorDetails;

    try {
      errorText = await response.text();
    } catch (readError) {
      errorText = `Unable to read error response: ${readError.message}`;
    }

    errorDetails = {
      status: response.status,
      statusText: response.statusText,
      url: fullUrl,
      requestHeaders: headers,
      responseHeaders: Object.fromEntries(response.headers.entries()),
      response: errorText,
      apiEndpoint: API_BASE,
      wpSiteUrl: process.env.REACT_APP_WP_SITE_URL,
      type: 'HTTP_ERROR'
    };

    console.error('❌ DETAILED WooCommerce API HTTP Error:', JSON.stringify(errorDetails, null, 2));

    // Specific error handling for common issues
    if (response.status === 401) {
      console.error('🔐 AUTHENTICATION ERROR: Check your WooCommerce API credentials');
    } else if (response.status === 404) {
      console.error('🔍 ENDPOINT NOT FOUND: Check your WooCommerce API URL');
    } else if (response.status === 403) {
      console.error('🚫 PERMISSION DENIED: Check WooCommerce API permissions');
    }

    throw new Error(`WooCommerce API error: ${response.status} - ${errorText}`);
  }

  let vehicles;
  try {
    vehicles = await response.json();
    console.log('🎉 SUCCESS! Parsed WooCommerce API response');
  } catch (parseError) {
    console.error('❌ JSON Parse Error:', parseError.message);
    throw new Error(`Failed to parse API response: ${parseError.message}`);
  }

  console.log('✅ SUCCESS! Received', vehicles.length, 'vehicles');

  // Get total count from WooCommerce headers (this is the real inventory size)
  const totalResults = parseInt(response.headers.get('X-WP-Total') || vehicles.length);
  const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || Math.ceil(totalResults / limit));

  // Transform vehicles
  const transformedVehicles = vehicles.map(transformWooCommerceVehicle);

  // Apply client-side filtering only for make/model/condition filters
  // Keep it simple for now - only filter what's clearly needed
  const filteredVehicles = transformedVehicles.filter(vehicle => {
    // Helper function to get meta value
    const getMeta = (key) => {
      const meta = vehicle.meta_data?.find(m => m.key === key);
      return meta ? meta.value : '';
    };

    // Extract make from title if not in meta
    const extractMakeFromTitle = () => {
      const titleParts = vehicle.title.split(' ');
      return titleParts[1] || '';
    };

    // Check make filter only
    if (filters.make && filters.make.length > 0) {
      const vehicleMake = getMeta('make') || extractMakeFromTitle();
      if (!filters.make.includes(vehicleMake)) {
        return false;
      }
    }

    return true;
  });

  // Important: Use API total count, not filtered count, to show full inventory size
  // The filtering is just for display, not for total count
  const result = {
    vehicles: filteredVehicles,
    totalResults, // Keep the API's total count
    totalPages,   // Keep the API's total pages
    currentPage: page
  };

  // 🚀 PERFORMANCE: Cache successful result for 30 seconds
  try {
    localStorage.setItem(cacheKey, JSON.stringify({
      data: result,
      timestamp: Date.now()
    }));
  } catch (e) {
    // Ignore cache errors
  }

  return result;
};

/**
 * Build Elasticsearch query from filters
 */
const buildElasticsearchQuery = (filters) => {
  const must = [];
  const filter = [];

  // Text search
  if (filters.search) {
    must.push({
      multi_match: {
        query: filters.search,
        fields: ['title^2', 'make', 'model', 'year', 'description'],
        type: 'best_fields',
        fuzziness: 'AUTO'
      }
    });
  }

  // Make filter
  if (filters.make && filters.make.length > 0) {
    filter.push({
      terms: { 'make.keyword': filters.make }
    });
  }

  // Model filter
  if (filters.model && filters.model.length > 0) {
    filter.push({
      terms: { 'model.keyword': filters.model }
    });
  }

  // Price range
  if (filters.priceMin || filters.priceMax) {
    const range = {};
    if (filters.priceMin) range.gte = parseFloat(filters.priceMin);
    if (filters.priceMax) range.lte = parseFloat(filters.priceMax);
    
    filter.push({
      range: { price: range }
    });
  }

  // Year range
  if (filters.yearMin || filters.yearMax) {
    const range = {};
    if (filters.yearMin) range.gte = parseInt(filters.yearMin);
    if (filters.yearMax) range.lte = parseInt(filters.yearMax);
    
    filter.push({
      range: { year: range }
    });
  }

  // Geographic search
  if (filters.zipCode && filters.radius) {
    filter.push({
      geo_distance: {
        distance: `${filters.radius}mi`,
        location: {
          // This would need to be resolved from zip code to lat/lng
          lat: filters.latitude || 47.0379, // Default to Seattle
          lon: filters.longitude || -122.9007
        }
      }
    });
  }

  return {
    bool: {
      must: must.length > 0 ? must : [{ match_all: {} }],
      filter: filter
    }
  };
};

/**
 * Build Elasticsearch sort from sortBy
 */
const buildElasticsearchSort = (sortBy) => {
  const sortMap = {
    'price_low': [{ price: { order: 'asc' } }],
    'price_high': [{ price: { order: 'desc' } }],
    'year_new': [{ year: { order: 'desc' } }],
    'year_old': [{ year: { order: 'asc' } }],
    'mileage_low': [{ mileage: { order: 'asc' } }],
    'mileage_high': [{ mileage: { order: 'desc' } }],
    'relevance': [{ _score: { order: 'desc' } }]
  };

  return sortMap[sortBy] || sortMap['relevance'];
};

// Client-side filtering moved inline to fetchFromWooCommerce function

/**
 * Build WooCommerce filters using only guaranteed working parameters
 */
const buildWooCommerceFilters = (filters) => {
  const params = {};

  // Basic text search - works reliably
  if (filters.search) {
    params.search = filters.search;
  }

  // Price range - WooCommerce native support
  if (filters.priceMin) {
    params.min_price = filters.priceMin;
  }

  if (filters.priceMax) {
    params.max_price = filters.priceMax;
  }

  // For now, keep it simple to ensure we get the full inventory
  // Complex filtering will be added once we confirm the basic setup works

  console.log('🔧 Built WooCommerce filters:', params);
  return params;
};

/**
 * Build WooCommerce sort - Using only valid WooCommerce orderby values
 */
const buildWooCommerceSort = (sortBy) => {
  // Only use the most basic, guaranteed-to-work sorting options
  const sortMap = {
    'price_low': { orderby: 'price', order: 'asc' },
    'price_high': { orderby: 'price', order: 'desc' },
    'title': { orderby: 'title', order: 'asc' },
    'date': { orderby: 'date', order: 'desc' }
  };

  // Default to no sorting to avoid API errors
  const result = sortMap[sortBy] || {};
  console.log('🔧 Built WooCommerce sort:', result, 'for sortBy:', sortBy);
  return result;
};

/**
 * Transform Elasticsearch vehicle data
 */
const transformElasticsearchVehicle = (hit) => {
  return {
    id: hit.id,
    title: hit.title,
    make: hit.make,
    model: hit.model,
    year: hit.year,
    price: hit.price,
    mileage: hit.mileage,
    images: hit.images || [],
    seller: hit.seller,
    location: hit.location,
    // Add other fields as needed
  };
};

/**
 * Transform WooCommerce vehicle data
 */
const transformWooCommerceVehicle = (product) => {
  // Extract meta data for filtering
  const meta_data = product.meta_data || [];

  // Helper function to get meta value
  const getMeta = (key) => {
    const meta = meta_data.find(m => m.key === key);
    return meta ? meta.value : '';
  };

  // Get seller data if available
  const seller_data = product.seller_data || null;

  return {
    id: product.id,
    title: product.name,
    featured: product.featured || false,
    viewed: false,
    images: product.images?.map(img => img.src) || [],
    badges: product.tags?.map(tag => tag.name) || [],
    mileage: getMeta('mileage') || getMeta('_mileage') || '0',
    transmission: getMeta('transmission') || getMeta('_transmission') || 'Auto',
    doors: getMeta('doors') || getMeta('_doors') || '4 doors',
    salePrice: product.price ? `$${parseFloat(product.price).toLocaleString()}` : '',
    payment: getMeta('monthly_payment') || getMeta('_monthly_payment') || '',
    dealer: seller_data?.company_name || getMeta('dealer') || getMeta('_dealer') || 'Unknown Dealer',
    location: `${getMeta('city') || getMeta('_city') || ''}, ${getMeta('state') || getMeta('_state') || ''}`.trim().replace(/^,|,$/, ''),
    phone: seller_data?.phone || getMeta('phone') || getMeta('_phone') || '',
    seller_data: seller_data,
    meta_data: [
      { key: 'make', value: getMeta('make') || getMeta('_make') },
      { key: 'model', value: getMeta('model') || getMeta('_model') },
      { key: 'year', value: getMeta('year') || getMeta('_year') },
      { key: 'condition', value: getMeta('condition') || getMeta('_condition') || 'Used' },
      { key: 'body_type', value: getMeta('body_type') || getMeta('vehicle_type') || getMeta('_body_type') || getMeta('_vehicle_type') },
      { key: 'drivetrain', value: getMeta('drivetrain') || getMeta('drive_type') || getMeta('_drivetrain') || getMeta('_drive_type') },
      { key: 'transmission', value: getMeta('transmission') || getMeta('_transmission') },
      { key: 'fuel_type', value: getMeta('fuel_type') || getMeta('_fuel_type') },
      { key: 'exterior_color', value: getMeta('exterior_color') || getMeta('_exterior_color') },
      { key: 'interior_color', value: getMeta('interior_color') || getMeta('_interior_color') },
      { key: 'trim', value: getMeta('trim') || getMeta('_trim') }
    ].filter(meta => meta.value && meta.value.toString().trim() !== ''),
    rawData: product
  };
};

/**
 * Get quick count for search without fetching results
 * Useful for "Showing X of Y results" displays
 */
export const getSearchCount = async (filters) => {
  try {
    const useElasticsearch = process.env.REACT_APP_USE_ELASTICSEARCH === 'true';
    
    if (useElasticsearch) {
      const response = await fetch(`${ELASTICSEARCH_ENDPOINT}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          size: 0, // Don't return documents, just count
          query: buildElasticsearchQuery(filters),
          track_total_hits: true
        })
      });

      const data = await response.json();
      return data.hits.total.value || data.hits.total;
    } else {
      // For WooCommerce, we'd need to make a minimal query
      const params = new URLSearchParams({
        per_page: 1,
        ...buildWooCommerceFilters(filters)
      });

      const response = await fetch(`${API_BASE}/products?${params}`);
      return parseInt(response.headers.get('X-WP-Total') || '0');
    }
  } catch (error) {
    console.error('Error getting search count:', error);
    return 0;
  }
};

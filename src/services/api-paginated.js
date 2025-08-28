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

// API connectivity testing functionality removed - handled inline in main functions

/**
 * Fetch all vehicles matching filters for filter option extraction
 */
export const fetchAllFilteredVehicles = async (filters = {}) => {
  try {
    // 🚨 IMMEDIATE ENVIRONMENT CHECK: Prevent fetch errors when env vars are missing
    if (!process.env.REACT_APP_WP_SITE_URL || !process.env.REACT_APP_WC_CONSUMER_KEY || !process.env.REACT_APP_WC_CONSUMER_SECRET) {
      console.warn('⚠️ ENVIRONMENT VARIABLES MISSING - Using demo data for filter options');
      const demoResult = getDemoDataFallback(1, 50, filters);
      return demoResult.vehicles;
    }

    // 🚀 PERFORMANCE: Check cache first for filter options
    const filterCacheKey = `carzino_filters_${JSON.stringify(filters).substring(0, 80)}`;
    const cachedFilters = localStorage.getItem(filterCacheKey);

    if (cachedFilters) {
      try {
        const cachedData = JSON.parse(cachedFilters);
        const cacheAge = Date.now() - cachedData.timestamp;
        const maxCacheAge = 3 * 60 * 1000; // 3 minutes for filter options

        if (cacheAge < maxCacheAge) {
          console.log(`⚡ FILTER CACHE HIT: Loaded ${cachedData.data.length} vehicles for filter options in ~5ms`);
          return cachedData.data;
        } else {
          localStorage.removeItem(filterCacheKey);
        }
      } catch (e) {
        localStorage.removeItem(filterCacheKey);
      }
    }

    console.log('🔍 FETCHING VEHICLES FROM API for filter options with filters:', filters);
    console.log('📡 No cache available - making fresh API call');

    // 🚀 PERFORMANCE: Minimal fields for filter options only
    const baseParams = {
      per_page: '50', // Increased back to 50 since we're fetching much less data per item
      status: 'publish',
      // 🎯 FILTER-ONLY: Just what we need for make/model/condition counts
      _fields: 'id,name,meta_data.make,meta_data.model,meta_data.condition,meta_data.body_type'
    };

    const filterParams = buildWooCommerceFilters(filters);
    const allParams = { ...baseParams, ...filterParams };
    const params = new URLSearchParams(allParams);
    const fullUrl = `${API_BASE}/products?${params}`;

    // Prepare authentication headers with compression
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br',
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
      console.warn('��️ Network error fetching filter options, using demo data:', networkError.message);
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

    // 🚀 PERFORMANCE: Cache filter options result
    try {
      localStorage.setItem(filterCacheKey, JSON.stringify({
        data: filteredVehicles,
        timestamp: Date.now(),
        filters: filters
      }));
      console.log(`💾 FILTER CACHE: Stored ${filteredVehicles.length} vehicles for filter options`);
    } catch (e) {
      console.warn('⚠️ Filter cache storage failed:', e.message);
    }

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

  // 🚀 PERFORMANCE: Simulate realistic cache behavior in demo mode
  // First load is slower, subsequent loads are faster (like cache hits)
  const previousLoad = localStorage.getItem(`demo_cache_${JSON.stringify(filters)}_${page}`);
  let searchTime;

  if (previousLoad) {
    // Simulate cache hit - very fast
    searchTime = Math.floor(Math.random() * 10) + 2; // 2-12ms
    console.log(`⚡ DEMO CACHE HIT: Simulating fast cached load (${searchTime}ms)`);
  } else {
    // Simulate first load - slower
    searchTime = Math.floor(Math.random() * 2000) + 1000; // 1-3 seconds
    console.log(`🔄 DEMO FIRST LOAD: Simulating initial API call (${searchTime}ms)`);

    // Store in demo cache
    localStorage.setItem(`demo_cache_${JSON.stringify(filters)}_${page}`, Date.now().toString());
  }

  return {
    vehicles: paginatedVehicles,
    totalResults: filteredVehicles.length,
    totalPages: Math.ceil(filteredVehicles.length / limit),
    currentPage: page,
    searchTime: searchTime,
    isDemo: true
  };
};

// 🚀 PERFORMANCE: Cache management utilities
const cleanExpiredCache = () => {
  const maxAge = 5 * 60 * 1000; // 5 minutes
  let cleanedCount = 0;

  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith('carzino_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (Date.now() - data.timestamp > maxAge) {
          localStorage.removeItem(key);
          cleanedCount++;
        }
      } catch (e) {
        localStorage.removeItem(key);
        cleanedCount++;
      }
    }
  }

  if (cleanedCount > 0) {
    console.log(`🧹 CACHE CLEANUP: Removed ${cleanedCount} expired entries`);
  }
};

// 🚀 PERFORMANCE: Cache statistics for debugging
const getCacheStats = () => {
  const carzinoKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('carzino_')) {
      carzinoKeys.push(key);
    }
  }
  return {
    totalEntries: carzinoKeys.length,
    keys: carzinoKeys.map(k => k.substring(0, 50) + '...'),
    storageUsed: JSON.stringify(localStorage).length
  };
};

// Export cache utilities for debugging in browser console
if (typeof window !== 'undefined') {
  window.carzinoCacheStats = getCacheStats;
  window.carzinoClearCache = () => {
    let cleared = 0;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('carzino_') || key.startsWith('demo_cache_'))) {
        localStorage.removeItem(key);
        cleared++;
      }
    }
    console.log(`🗑️ Cleared ${cleared} cache entries (including demo cache)`);
  };

  // Clear demo cache on initial load for testing
  let demoCleared = 0;
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key && key.startsWith('demo_cache_')) {
      localStorage.removeItem(key);
      demoCleared++;
    }
  }
  if (demoCleared > 0) {
    console.log(`🧹 Cleared ${demoCleared} demo cache entries for fresh testing`);
  }
}

export const fetchVehiclesPaginated = async (page = 1, limit = 20, filters = {}, sortBy = 'relevance') => {
  // Clean expired cache entries periodically
  if (Math.random() < 0.1) { // 10% chance to run cleanup
    cleanExpiredCache();
  }

  console.log('🚀 Fetching vehicles page:', page);
  console.log('🔧 Environment check:');
  console.log('  - WP_SITE_URL:', process.env.REACT_APP_WP_SITE_URL);
  console.log('  - API_BASE:', API_BASE);
  console.log('  - Has credentials:', !!(process.env.REACT_APP_WC_CONSUMER_KEY && process.env.REACT_APP_WC_CONSUMER_SECRET));
  console.log('  - Page:', page, 'Limit:', limit, 'Filters:', Object.keys(filters).length, 'Sort:', sortBy);

  // 🚨 IMMEDIATE ENVIRONMENT CHECK: Prevent fetch errors when env vars are missing
  if (!process.env.REACT_APP_WP_SITE_URL || !process.env.REACT_APP_WC_CONSUMER_KEY || !process.env.REACT_APP_WC_CONSUMER_SECRET) {
    console.warn('⚠️ ENVIRONMENT VARIABLES MISSING - Using demo data immediately');
    console.warn('Missing variables:');
    if (!process.env.REACT_APP_WP_SITE_URL) console.warn('  - REACT_APP_WP_SITE_URL');
    if (!process.env.REACT_APP_WC_CONSUMER_KEY) console.warn('  - REACT_APP_WC_CONSUMER_KEY');
    if (!process.env.REACT_APP_WC_CONSUMER_SECRET) console.warn('  - REACT_APP_WC_CONSUMER_SECRET');
    console.warn('📝 Create .env.local file with your API credentials to connect to real data');

    return getDemoDataFallback(page, limit, filters);
  }

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
      setTimeout(() => reject(new Error('Request timeout after 20 seconds')), 20000)
    )
  ]).catch(error => {
    console.error('❌ API failed with error:', error.message);
    console.error('❌ Full error object:', error);

    // Check if it's a network connectivity issue
    if (error.message.includes('fetch') || error.message.includes('Network')) {
      console.warn('🌐 Network connectivity issue detected - falling back to demo data');
    } else {
      console.warn('🔧 API configuration issue - falling back to demo data');
    }

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
  // 🚀 PERFORMANCE: Ultra-optimized payload - only absolute essentials
  const baseParams = {
    page: page.toString(),
    per_page: limit.toString(),
    status: 'publish',
    // 🎯 CRITICAL: Include ALL image fields and embedded media for proper image loading
    _embed: 'true',  // Include embedded media objects (featured images)
    _fields: 'id,name,price,sale_price,regular_price,images,featured_media,meta_data,categories,attributes,description,short_description,date_created,featured,acf',
    // Include ACF fields and meta data
    acf: 'true',
    meta_data: 'true',
    include_meta: 'true'
  };

  const filterParams = buildWooCommerceFilters(filters);
  const sortParams = buildWooCommerceSort(sortBy);

  // 🚀 PERFORMANCE: Enhanced cache system with reliable key generation
  const startTime = Date.now();

  // Create deterministic cache key from filters
  const createCacheKey = (filters) => {
    const sortedKeys = Object.keys(filters).sort();
    const filterParts = sortedKeys.map(key => {
      const value = filters[key];
      if (Array.isArray(value)) {
        return `${key}:${value.sort().join(',')}`;
      }
      return `${key}:${value}`;
    });
    return filterParts.join('|');
  };

  const filterKey = createCacheKey(filters);
  const cacheKey = `carzino_wc_${page}_${limit}_${filterKey}_${sortBy}`;
  console.log(`🔑 Cache key: ${cacheKey.substring(0, 80)}...`);

  const cached = localStorage.getItem(cacheKey);

  if (cached) {
    try {
      const cachedData = JSON.parse(cached);
      const cacheAge = Date.now() - cachedData.timestamp;
      const maxCacheAge = 5 * 60 * 1000; // 5 minutes instead of 30 seconds

      if (cacheAge < maxCacheAge) {
        const cacheHitTime = Date.now() - startTime;
        console.log(`⚡ CACHE HIT: Loaded ${cachedData.data.vehicles?.length || 0} vehicles in ${cacheHitTime}ms (cached ${Math.round(cacheAge/1000)}s ago)`);
        console.log(`🎯 Using cached data - this should be VERY fast!`);
        return { ...cachedData.data, searchTime: cacheHitTime, isCached: true };
      } else {
        console.log(`🕒 CACHE EXPIRED: Removing stale data (${Math.round(cacheAge/1000)}s old)`);
        localStorage.removeItem(cacheKey);
      }
    } catch (e) {
      console.warn('⚠️ Invalid cache data, removing:', e.message);
      localStorage.removeItem(cacheKey);
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

  // Add authentication via query params as alternative method
  const shouldUseQueryAuth = process.env.REACT_APP_USE_QUERY_AUTH === 'true';
  if (shouldUseQueryAuth && process.env.REACT_APP_WC_CONSUMER_KEY) {
    allParams.consumer_key = process.env.REACT_APP_WC_CONSUMER_KEY;
    allParams.consumer_secret = process.env.REACT_APP_WC_CONSUMER_SECRET;
  }

  const params = new URLSearchParams(allParams);
  const fullUrl = `${API_BASE}/products?${params}`;

  // Prepare authentication headers (try Basic Auth first, fallback to query params)
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  // Prepare Basic Auth headers (unless using query auth)
  if (!shouldUseQueryAuth && process.env.REACT_APP_WC_CONSUMER_KEY) {
    const credentials = btoa(`${process.env.REACT_APP_WC_CONSUMER_KEY}:${process.env.REACT_APP_WC_CONSUMER_SECRET}`);
    headers['Authorization'] = `Basic ${credentials}`;
  }

  console.log('🔄 WooCommerce API call...');
  console.log('🌐 API_BASE:', API_BASE);
  console.log('📡 Full URL:', fullUrl);
  console.log('🔑 Auth headers:', headers.Authorization ? 'Present' : 'Missing');
  console.log('📝 Request params:', allParams);

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

    // Enhanced error logging
    console.error('❌ Network Error Details:');
    console.error('  - Message:', networkError.message);
    console.error('  - Name:', networkError.name);
    console.error('  - Stack:', networkError.stack);
    console.error('  - URL attempted:', fullUrl);
    console.error('  - Headers used:', headers);

    // Check if it's a CORS error and we can retry with query auth
    if ((networkError.message.includes('CORS') || networkError.message.includes('fetch'))
        && !shouldUseQueryAuth && process.env.REACT_APP_WC_CONSUMER_KEY) {
      console.warn('🔄 CORS Error - Retrying with query parameter authentication...');

      try {
        // Rebuild URL with query auth
        const retryParams = { ...allParams };
        retryParams.consumer_key = process.env.REACT_APP_WC_CONSUMER_KEY;
        retryParams.consumer_secret = process.env.REACT_APP_WC_CONSUMER_SECRET;

        const retryUrlParams = new URLSearchParams(retryParams);
        const retryUrl = `${API_BASE}/products?${retryUrlParams}`;

        console.log('🔄 Retry URL:', retryUrl);

        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), 10000);

        const retryResponse = await fetch(retryUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }, // No Authorization header for query auth
          signal: retryController.signal
        });

        clearTimeout(retryTimeoutId);

        if (retryResponse.ok) {
          console.log('✅ Query parameter authentication succeeded!');
          response = retryResponse; // Use this response instead
        } else {
          throw new Error(`Query auth also failed: ${retryResponse.status}`);
        }

      } catch (retryError) {
        console.error('❌ Query parameter authentication also failed:', retryError.message);
        throw new Error(`Both Basic Auth and Query Auth failed. Basic: ${networkError.message}, Query: ${retryError.message}`);
      }
    } else {
      // Check if it's a timeout
      if (networkError.name === 'AbortError') {
        console.error('⏰ Request Timeout - API took longer than 10 seconds');
      }

      throw new Error(`Network error: Unable to connect to WooCommerce API. ${networkError.message}`);
    }
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
      type: 'HTTP_ERROR',
      timestamp: new Date().toISOString()
    };

    // Enhanced HTTP error logging
    console.error('❌ HTTP Error Details:');
    console.error('  - Status:', response.status, response.statusText);
    console.error('  - URL:', fullUrl);
    console.error('  - Response:', errorText);
    console.error('  - Response Headers:', Object.fromEntries(response.headers.entries()));

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

  // 🚀 PERFORMANCE: Cache successful result for 5 minutes
  try {
    const cacheData = {
      data: result,
      timestamp: Date.now(),
      filters: filters,
      page: page
    };

    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log(`💾 CACHED: Stored ${result.vehicles.length} vehicles for 5min instant loading`);

    // Prevent localStorage from growing too large
    if (localStorage.length > 100) {
      cleanExpiredCache();
    }
  } catch (e) {
    console.warn('⚠️ Cache storage failed (localStorage full?):', e.message);
    // Try to free space by clearing old carzino cache
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('carzino_') && Math.random() < 0.5) {
          localStorage.removeItem(key);
        }
      }
    } catch (cleanupError) {
      console.warn('Cache cleanup also failed');
    }
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

  // Extract all possible image sources from WooCommerce product
  const extractImages = () => {
    const imageUrls = [];

    // PRIORITY 1: WordPress Featured Media from embedded objects (with _embed=true)
    if (product._embedded?.['wp:featuredmedia']?.[0]) {
      const featuredMedia = product._embedded['wp:featuredmedia'][0];
      if (featuredMedia.source_url) {
        imageUrls.push(featuredMedia.source_url);
      }
      // Try different size variations
      if (featuredMedia.media_details?.sizes?.full?.source_url) {
        imageUrls.push(featuredMedia.media_details.sizes.full.source_url);
      }
      if (featuredMedia.media_details?.sizes?.large?.source_url) {
        imageUrls.push(featuredMedia.media_details.sizes.large.source_url);
      }
    }

    // PRIORITY 2: Primary WooCommerce images array
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach(img => {
        if (img.src) imageUrls.push(img.src);
        if (img.url) imageUrls.push(img.url);
      });
    }

    // PRIORITY 3: Featured image URL
    if (product.featured_media_src) {
      imageUrls.push(product.featured_media_src);
    }

    // PRIORITY 4: Check ACF image fields
    if (product.acf) {
      const acfImageFields = ['featured_image', 'vehicle_image', 'main_image', 'product_image'];
      acfImageFields.forEach(fieldName => {
        const acfField = product.acf[fieldName];
        if (acfField) {
          const imageUrl = typeof acfField === 'object' ? acfField.url : acfField;
          if (imageUrl && imageUrl.includes('http')) {
            imageUrls.push(imageUrl);
          }
        }
      });
    }

    // PRIORITY 5: Check meta data for image URLs
    const imageFields = [
      'vehicle_image', '_vehicle_image',
      'featured_image', '_featured_image',
      'gallery_images', '_gallery_images',
      'main_image', '_main_image',
      'product_image', '_product_image'
    ];

    imageFields.forEach(field => {
      const imageFromMeta = getMeta(field);
      if (imageFromMeta) {
        if (Array.isArray(imageFromMeta)) {
          imageUrls.push(...imageFromMeta);
        } else if (typeof imageFromMeta === 'string' && imageFromMeta.includes('http')) {
          imageUrls.push(imageFromMeta);
        }
      }
    });

    // Remove duplicates and invalid URLs
    const uniqueUrls = [...new Set(imageUrls)].filter(url => url && url.includes('http') && !url.includes('/api/placeholder'));

    console.log(`🖼️ Extracted ${uniqueUrls.length} images for ${product.name}:`, uniqueUrls.slice(0, 2));

    return uniqueUrls;
  };

  return {
    id: product.id,
    title: product.name,
    featured: product.featured || false,
    viewed: false,
    images: extractImages(),
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
      // Include original meta_data from API response to preserve all ACF fields
      ...meta_data,
      // Add normalized meta_data for compatibility
      { key: 'mileage', value: getMeta('mileage') || getMeta('_mileage') },
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
    // Additional fields for compatibility with VehicleCard component
    image: extractImages()[0] || null,  // First image for simple access
    featured_media: product.featured_media || null,
    featured_media_url: product._embedded?.['wp:featuredmedia']?.[0]?.source_url || null,
    acf: product.acf || {},
    price: product.price || product.regular_price || '',
    sale_price: product.sale_price || '',
    stock_status: product.stock_status || 'instock',
    // Include complete raw data for debugging
    rawData: {
      ...product,
      has_images: !!(product.images && product.images.length > 0),
      has_featured_media: !!product.featured_media,
      has_embedded: !!product._embedded,
      embedded_media: product._embedded?.['wp:featuredmedia'] || null,
      extracted_images_count: extractImages().length
    }
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

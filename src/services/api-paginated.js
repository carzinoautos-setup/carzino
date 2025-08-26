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
 * Test API connectivity with proper authentication
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

    console.log('🔍 Testing API connectivity:', {
      url: testUrl,
      hasAuth: !!headers['Authorization']
    });

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: headers,
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API connectivity test successful - found', data.length, 'products');
      return true;
    } else {
      const errorText = await response.text();
      console.warn('⚠️ API connectivity test failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return false;
    }
  } catch (error) {
    console.warn('⚠️ API connectivity test failed:', error.message);
    return false;
  }
};

export const fetchVehiclesPaginated = async (page = 1, limit = 20, filters = {}, sortBy = 'relevance') => {
  // First check if the API is reachable
  const isAPIReachable = await testAPIConnectivity();

  if (!isAPIReachable) {
    console.error('❌ WooCommerce API authentication failed. Please check your API credentials.');
    // Let's try the actual API call anyway to get the real error
  }

  try {
    // Use Elasticsearch if available, fallback to WooCommerce
    const useElasticsearch = process.env.REACT_APP_USE_ELASTICSEARCH === 'true';

    if (useElasticsearch) {
      return await fetchFromElasticsearch(page, limit, filters, sortBy);
    } else {
      return await fetchFromWooCommerce(page, limit, filters, sortBy);
    }
  } catch (error) {
    const errorDetails = {
      message: error.message,
      filters,
      page,
      limit,
      sortBy,
      apiBase: API_BASE,
      credentials: process.env.REACT_APP_WC_CONSUMER_KEY ? 'Present' : 'Missing',
      timestamp: new Date().toISOString()
    };

    console.error('❌ API Error Details:', JSON.stringify(errorDetails, null, 2));

    // Don't fall back to demo data - let the error bubble up
    throw new Error(`WooCommerce API Error: ${error.message}`);
  }
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
  const baseParams = {
    page: page.toString(), // Use the actual requested page
    per_page: limit.toString(), // Use the actual requested limit
    status: 'publish'
  };

  const filterParams = buildWooCommerceFilters(filters);
  const sortParams = buildWooCommerceSort(sortBy);

  console.log('🔍 WooCommerce API request:', {
    baseParams,
    filterParams,
    sortParams,
    filters
  });

  // Combine all parameters
  const allParams = {
    ...baseParams,
    ...filterParams
  };

  // Only add sort parameters if they don't cause issues
  try {
    if (sortParams && Object.keys(sortParams).length > 0) {
      Object.assign(allParams, sortParams);
    }
  } catch (e) {
    console.warn('⚠️ Skipping sort parameters due to error:', e);
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

  console.log('🌐 WooCommerce Request:', {
    url: fullUrl,
    hasAuth: !!headers['Authorization'],
    method: 'GET'
  });

  let response;

  try {
    response = await fetch(fullUrl, {
      method: 'GET',
      headers: headers,
    });
  } catch (networkError) {
    console.error('❌ Network Error:', {
      message: networkError.message,
      url: fullUrl,
      type: 'NETWORK_ERROR'
    });
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
      response: errorText,
      type: 'HTTP_ERROR'
    };

    console.error('❌ WooCommerce API Error Details:', JSON.stringify(errorDetails, null, 2));
    throw new Error(`WooCommerce API error: ${response.status} - ${errorText}`);
  }

  let vehicles;
  try {
    vehicles = await response.json();
  } catch (parseError) {
    console.error('❌ JSON Parse Error:', parseError.message);
    throw new Error(`Failed to parse API response: ${parseError.message}`);
  }

  console.log('📦 Received vehicles from WooCommerce:', vehicles.length);

  // Get total count from WooCommerce headers (this is the real inventory size)
  const totalResults = parseInt(response.headers.get('X-WP-Total') || vehicles.length);
  const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || Math.ceil(totalResults / limit));

  console.log('📊 WooCommerce API Response:', {
    currentPageVehicles: vehicles.length,
    totalInventory: totalResults,
    totalPages: totalPages,
    currentPage: page
  });

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
  return {
    vehicles: filteredVehicles,
    totalResults, // Keep the API's total count
    totalPages,   // Keep the API's total pages
    currentPage: page
  };
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

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
/**
 * Demo data fallback for when API is unavailable
 */
const getDemoDataResponse = (page = 1, limit = 20, filters = {}) => {
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
    }
  ];

  // Apply basic filtering to demo data
  const filteredVehicles = demoVehicles.filter(vehicle => {
    const getMeta = (key) => {
      const meta = vehicle.meta_data?.find(m => m.key === key);
      return meta ? meta.value : '';
    };

    // Check make filter
    if (filters.make && filters.make.length > 0) {
      const vehicleMake = getMeta('make');
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

/**
 * Test API connectivity with proper authentication
 */
const testAPIConnectivity = async () => {
  try {
    const params = new URLSearchParams({
      per_page: '1',
      status: 'publish'
    });

    // Add authentication credentials
    if (process.env.REACT_APP_WC_CONSUMER_KEY) {
      params.append('consumer_key', process.env.REACT_APP_WC_CONSUMER_KEY);
      params.append('consumer_secret', process.env.REACT_APP_WC_CONSUMER_SECRET);
    }

    const testUrl = `${API_BASE}/products?${params}`;
    console.log('🔍 Testing API connectivity with auth:', testUrl.replace(/consumer_(key|secret)=[^&]*/g, 'consumer_$1=***'));

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      console.log('✅ API connectivity test successful');
      return true;
    } else {
      const errorText = await response.text();
      console.warn('⚠️ API connectivity test failed:', response.status, errorText);
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
  // Fetch more products for client-side filtering
  // We'll fetch up to 100 products and filter them client-side
  const fetchSize = Math.max(limit * 5, 100); // Get 5x the page size or 100, whichever is larger

  const baseParams = {
    page: '1', // Always get from first page since we're filtering client-side
    per_page: fetchSize.toString(),
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

  // Transform vehicles first
  const transformedVehicles = vehicles.map(transformWooCommerceVehicle);

  // Apply client-side filtering for unsupported WooCommerce parameters
  const filteredVehicles = applyClientSideFilters(transformedVehicles, filters);

  console.log('✅ Filtered vehicles count:', filteredVehicles.length);

  // Since we're doing client-side filtering, recalculate pagination
  const totalResults = filteredVehicles.length;
  const totalPages = Math.ceil(totalResults / limit);
  const startIndex = (page - 1) * limit;
  const paginatedVehicles = filteredVehicles.slice(startIndex, startIndex + limit);

  return {
    vehicles: paginatedVehicles,
    totalResults,
    totalPages,
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

/**
 * Apply client-side filters to vehicles (for unsupported WooCommerce parameters)
 */
const applyClientSideFilters = (vehicles, filters) => {
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

    // Check transmission filter
    if (filters.transmission && filters.transmission.length > 0) {
      const transmission = getMeta('transmission');
      if (!filters.transmission.includes(transmission)) {
        return false;
      }
    }

    // Check transmission speed filter
    if (filters.transmissionSpeed && filters.transmissionSpeed.length > 0) {
      const transmissionSpeed = getMeta('transmission_speed') || getMeta('transmission');
      if (!filters.transmissionSpeed.includes(transmissionSpeed)) {
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

    // Check trim filter
    if (filters.trim && filters.trim.length > 0) {
      const trim = getMeta('trim');
      if (!filters.trim.includes(trim)) {
        return false;
      }
    }

    // If all filters pass, include the vehicle
    return true;
  });
};

/**
 * Build WooCommerce filters - Using only basic WooCommerce supported parameters
 */
const buildWooCommerceFilters = (filters) => {
  const params = {};

  // Only use basic WooCommerce parameters to avoid 400 errors
  if (filters.search) {
    params.search = filters.search;
  }

  // Price range - WooCommerce supports these
  if (filters.priceMin) {
    params.min_price = filters.priceMin;
  }

  if (filters.priceMax) {
    params.max_price = filters.priceMax;
  }

  // For other filters, we'll handle them client-side in the transform function
  // This prevents 400 errors from unsupported parameters

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

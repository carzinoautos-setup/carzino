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
export const fetchVehiclesPaginated = async (page = 1, limit = 20, filters = {}, sortBy = 'relevance') => {
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
      stack: error.stack
    };

    console.error('❌ API Error Details:', JSON.stringify(errorDetails, null, 2));

    // Return a proper error structure that the calling code expects
    throw new Error(`API Error: ${error.message}`);
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

  const params = new URLSearchParams({
    ...baseParams,
    ...filterParams,
    ...sortParams
  });

  // Add authentication
  if (process.env.REACT_APP_WC_CONSUMER_KEY) {
    params.append('consumer_key', process.env.REACT_APP_WC_CONSUMER_KEY);
    params.append('consumer_secret', process.env.REACT_APP_WC_CONSUMER_SECRET);
  }

  const fullUrl = `${API_BASE}/products?${params}`;
  console.log('🌐 Full WooCommerce URL:', fullUrl);

  const response = await fetch(fullUrl);

  if (!response.ok) {
    const errorText = await response.text();
    const errorDetails = {
      status: response.status,
      statusText: response.statusText,
      url: fullUrl,
      response: errorText
    };

    console.error('❌ WooCommerce API Error Details:', JSON.stringify(errorDetails, null, 2));
    throw new Error(`WooCommerce API error: ${response.status} - ${errorText}`);
  }

  const vehicles = await response.json();

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
  const sortMap = {
    'price_low': { orderby: 'price', order: 'asc' },
    'price_high': { orderby: 'price', order: 'desc' },
    'year_new': { orderby: 'date', order: 'desc' }, // Use date as proxy for newest
    'year_old': { orderby: 'date', order: 'asc' },
    'relevance': { orderby: 'popularity', order: 'desc' }, // Use popularity as default
    'title': { orderby: 'title', order: 'asc' },
    'random': { orderby: 'random' }
  };

  const result = sortMap[sortBy] || sortMap['relevance'];
  console.log('🔧 Built WooCommerce sort:', result);
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

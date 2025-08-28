/**
 * Simplified API Service for debugging data display issues
 * This service prioritizes reliability and clear error reporting
 */

// Environment validation
const validateEnvironment = () => {
  const missing = [];
  const vars = {
    siteUrl: process.env.REACT_APP_WP_SITE_URL,
    consumerKey: process.env.REACT_APP_WC_CONSUMER_KEY,
    consumerSecret: process.env.REACT_APP_WC_CONSUMER_SECRET
  };

  if (!vars.siteUrl) missing.push('REACT_APP_WP_SITE_URL');
  if (!vars.consumerKey) missing.push('REACT_APP_WC_CONSUMER_KEY');
  if (!vars.consumerSecret) missing.push('REACT_APP_WC_CONSUMER_SECRET');

  return { 
    isValid: missing.length === 0, 
    missing, 
    vars 
  };
};

// Simple demo data for fallback
const getDemoData = () => ({
  vehicles: [
    {
      id: 'demo-1',
      title: '2021 Toyota RAV4 XLE',
      images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=450&h=300&fit=crop'],
      price: '$28,995',
      mileage: '32,456',
      transmission: 'Automatic',
      doors: '4',
      salePrice: '$28,995',
      dealer: 'Demo Dealer',
      location: 'Seattle, WA',
      featured: true,
      meta_data: [
        { key: 'make', value: 'Toyota' },
        { key: 'model', value: 'RAV4' },
        { key: 'year', value: '2021' },
        { key: 'condition', value: 'Used' },
        { key: 'body_type', value: 'SUV' }
      ]
    },
    {
      id: 'demo-2',
      title: '2020 Honda Civic Si',
      images: ['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=450&h=300&fit=crop'],
      price: '$22,995',
      mileage: '24,567',
      transmission: 'Manual',
      doors: '4',
      salePrice: '$22,995',
      dealer: 'Demo Dealer',
      location: 'Tacoma, WA',
      featured: false,
      meta_data: [
        { key: 'make', value: 'Honda' },
        { key: 'model', value: 'Civic' },
        { key: 'year', value: '2020' },
        { key: 'condition', value: 'Used' },
        { key: 'body_type', value: 'Sedan' }
      ]
    },
    {
      id: 'demo-3',
      title: '2019 Ford F-150 XLT',
      images: ['https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=450&h=300&fit=crop'],
      price: '$31,995',
      mileage: '45,321',
      transmission: 'Automatic',
      doors: '4',
      salePrice: '$31,995',
      dealer: 'Demo Dealer',
      location: 'Everett, WA',
      featured: false,
      meta_data: [
        { key: 'make', value: 'Ford' },
        { key: 'model', value: 'F-150' },
        { key: 'year', value: '2019' },
        { key: 'condition', value: 'Used' },
        { key: 'body_type', value: 'Truck' }
      ]
    }
  ],
  totalResults: 254,
  totalPages: 13,
  currentPage: 1,
  searchTime: 45,
  isDemo: true
});

// Extract filter options from vehicles
const extractFilterOptions = (vehicles) => {
  const counts = {
    makes: new Map(),
    models: new Map(),
    years: new Map(),
    conditions: new Map(),
    bodyTypes: new Map()
  };

  vehicles.forEach(vehicle => {
    const meta = vehicle.meta_data || [];
    const getMeta = (key) => meta.find(m => m.key === key)?.value;

    const make = getMeta('make');
    const model = getMeta('model');
    const year = getMeta('year');
    const condition = getMeta('condition');
    const bodyType = getMeta('body_type');

    if (make) counts.makes.set(make, (counts.makes.get(make) || 0) + 1);
    if (model) counts.models.set(model, (counts.models.get(model) || 0) + 1);
    if (year) counts.years.set(year, (counts.years.get(year) || 0) + 1);
    if (condition) counts.conditions.set(condition, (counts.conditions.get(condition) || 0) + 1);
    if (bodyType) counts.bodyTypes.set(bodyType, (counts.bodyTypes.get(bodyType) || 0) + 1);
  });

  return {
    makes: Array.from(counts.makes.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    models: Array.from(counts.models.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    years: Array.from(counts.years.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.name - a.name),
    conditions: Array.from(counts.conditions.entries()).map(([name, count]) => ({ name, count })),
    bodyTypes: Array.from(counts.bodyTypes.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    drivetrains: [],
    transmissions: [],
    exteriorColors: [],
    interiorColors: [],
    fuelTypes: [],
    trims: []
  };
};

// Simple API test
export const testConnection = async () => {
  const env = validateEnvironment();
  
  if (!env.isValid) {
    return {
      success: false,
      error: 'MISSING_ENV_VARS',
      details: `Missing: ${env.missing.join(', ')}`,
      shouldUseFallback: true
    };
  }

  try {
    const url = `${env.vars.siteUrl}/wp-json/wc/v3/products?per_page=1&consumer_key=${env.vars.consumerKey}&consumer_secret=${env.vars.consumerSecret}`;
    
    console.log('🔍 Testing API connection...');
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ API connection successful');
    
    return {
      success: true,
      data: data,
      message: 'API connection successful'
    };

  } catch (error) {
    console.error('❌ API connection failed:', error.message);
    
    return {
      success: false,
      error: error.message,
      details: error.message.includes('CORS') ? 'CORS configuration needed' : 'Check API credentials',
      shouldUseFallback: true
    };
  }
};

// Main fetch function with simple error handling
export const fetchVehiclesSimple = async (page = 1, limit = 20, filters = {}) => {
  console.log(`🚀 fetchVehiclesSimple: page=${page}, limit=${limit}`);
  
  const env = validateEnvironment();
  
  // Use demo data if environment not configured
  if (!env.isValid) {
    console.warn('⚠️ Environment not configured, using demo data');
    const demo = getDemoData();
    return {
      ...demo,
      filterOptions: extractFilterOptions(demo.vehicles)
    };
  }

  try {
    // Test connection first
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      console.warn('⚠️ API connection failed, using demo data');
      const demo = getDemoData();
      return {
        ...demo,
        error: connectionTest.error,
        filterOptions: extractFilterOptions(demo.vehicles)
      };
    }

    // Fetch vehicles with minimal parameters
    const url = `${env.vars.siteUrl}/wp-json/wc/v3/products`;
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: limit.toString(),
      status: 'publish',
      consumer_key: env.vars.consumerKey,
      consumer_secret: env.vars.consumerSecret
    });

    console.log('📡 Fetching vehicles from WooCommerce API...');
    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const vehicles = await response.json();
    console.log(`✅ Loaded ${vehicles.length} vehicles from API`);

    // Transform vehicles for display
    const transformedVehicles = vehicles.map(product => ({
      id: product.id,
      title: product.name,
      images: product.images?.map(img => img.src) || [],
      price: product.price ? `$${parseFloat(product.price).toLocaleString()}` : '',
      salePrice: product.price ? `$${parseFloat(product.price).toLocaleString()}` : '',
      featured: product.featured || false,
      meta_data: product.meta_data || [],
      attributes: product.attributes || [],
      categories: product.categories || [],
      // Add basic vehicle properties
      mileage: product.meta_data?.find(m => m.key === 'mileage')?.value || '0',
      transmission: product.meta_data?.find(m => m.key === 'transmission')?.value || 'Automatic',
      doors: product.meta_data?.find(m => m.key === 'doors')?.value || '4',
      dealer: 'Auto Dealer',
      location: 'WA'
    }));

    const totalResults = parseInt(response.headers.get('X-WP-Total') || vehicles.length);
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || 1);

    const result = {
      vehicles: transformedVehicles,
      totalResults,
      totalPages,
      currentPage: page,
      searchTime: 100,
      isDemo: false,
      filterOptions: extractFilterOptions(transformedVehicles)
    };

    console.log('✅ API data loaded successfully:', {
      vehicles: result.vehicles.length,
      totalResults: result.totalResults,
      filterOptions: Object.keys(result.filterOptions)
    });

    return result;

  } catch (error) {
    console.error('❌ API error, falling back to demo data:', error.message);
    
    const demo = getDemoData();
    return {
      ...demo,
      error: error.message,
      filterOptions: extractFilterOptions(demo.vehicles)
    };
  }
};

// Export for testing
export { validateEnvironment, getDemoData, extractFilterOptions };

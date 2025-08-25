/**
 * WooCommerce API Service
 * Connects to real vehicle inventory data
 */

const WC_API_BASE = `${process.env.REACT_APP_WP_SITE_URL}/wp-json/wc/v3`;
const WC_CONSUMER_KEY = process.env.REACT_APP_WC_CONSUMER_KEY;
const WC_CONSUMER_SECRET = process.env.REACT_APP_WC_CONSUMER_SECRET;

// Comprehensive environment variable validation
console.log('🔧 Environment Variables Status:');
console.log('  REACT_APP_WP_SITE_URL:', process.env.REACT_APP_WP_SITE_URL || '❌ NOT SET');
console.log('  REACT_APP_WC_CONSUMER_KEY:', WC_CONSUMER_KEY || '❌ NOT SET');
console.log('  REACT_APP_WC_CONSUMER_SECRET:', WC_CONSUMER_SECRET || '❌ NOT SET');
console.log('  API Base URL:', WC_API_BASE);

// Check for missing environment variables
const missingVars = [];
if (!process.env.REACT_APP_WP_SITE_URL) missingVars.push('REACT_APP_WP_SITE_URL');
if (!WC_CONSUMER_KEY) missingVars.push('REACT_APP_WC_CONSUMER_KEY');
if (!WC_CONSUMER_SECRET) missingVars.push('REACT_APP_WC_CONSUMER_SECRET');

if (missingVars.length > 0) {
  console.error('❌ Missing Environment Variables:', missingVars);
  console.error('   The API calls will fail because credentials are not loaded');
} else {
  console.log('✅ All environment variables are loaded');
}

// Validate credential format
if (WC_CONSUMER_KEY && !WC_CONSUMER_KEY.startsWith('ck_')) {
  console.warn('⚠️ Consumer key doesn\'t start with "ck_" - may be invalid');
}
if (WC_CONSUMER_SECRET && !WC_CONSUMER_SECRET.startsWith('cs_')) {
  console.warn('⚠️ Consumer secret doesn\'t start with "cs_" - may be invalid');
}

// Simple cache system for faster loading
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (url, params) => {
  return `${url}?${JSON.stringify(params)}`;
};

const getFromCache = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCache = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// Create authorization header for WooCommerce API
const getAuthHeaders = () => {
  const auth = btoa(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`);
  return {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
  };
};

// Fallback sample data for when API is not available
const getFallbackVehicles = () => ({
  results: [
    {
      id: 'fallback-1',
      title: '2021 Chevrolet Trax LT (CORS Error - Sample Data)',
      slug: 'sample-chevrolet-trax',
      url: '#',
      price: '25995',
      sale_price: '',
      stock_status: 'instock',
      images: {
        featured: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=450&h=300&fit=crop',
        gallery: ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=450&h=300&fit=crop']
      },
      categories: [{ id: 1, name: 'SUV', slug: 'suv' }],
      attributes: [
        { name: 'Make', options: ['Chevrolet'] },
        { name: 'Model', options: ['Trax'] },
        { name: 'Mileage', options: ['86784'] }
      ],
      meta_data: [],
      description: 'Sample vehicle due to API connection issue',
      date_created: new Date().toISOString(),
      featured: true
    },
    {
      id: 'fallback-2',
      title: '2020 Ford Mustang EcoBoost (CORS Error - Sample Data)',
      slug: 'sample-ford-mustang',
      url: '#',
      price: '32999',
      sale_price: '',
      stock_status: 'instock',
      images: {
        featured: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=450&h=300&fit=crop',
        gallery: ['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=450&h=300&fit=crop']
      },
      categories: [{ id: 2, name: 'Coupe', slug: 'coupe' }],
      attributes: [
        { name: 'Make', options: ['Ford'] },
        { name: 'Model', options: ['Mustang'] },
        { name: 'Mileage', options: ['45123'] }
      ],
      meta_data: [],
      description: 'Sample vehicle due to API connection issue',
      date_created: new Date().toISOString(),
      featured: false
    }
  ],
  total: 2,
  totalPages: 1
});

// Fetch all products (vehicles) from WooCommerce
export const fetchVehicles = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      per_page: params.per_page || 12, // Reduced from 20 to 12 for faster loading
      page: params.page || 1,
      status: 'publish',
      ...params
    });

    // Check cache first for faster loading
    const cacheKey = getCacheKey(`${WC_API_BASE}/products`, params);
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      console.log('📦 Loading vehicles from cache (faster!)');
      return cachedData;
    }

    console.log('🔄 Fetching fresh vehicle data from API...');

    // Try URL-based authentication first (more reliable)
    const urlWithAuth = `${WC_API_BASE}/products?${queryParams}&consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`;
    console.log('📍 Full API URL with auth:', urlWithAuth);

    const response = await fetch(urlWithAuth, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status);
    console.log('📄 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Response Error:', {
        status: response.status,
        statusText: response.statusText,
        responseText: errorText.substring(0, 200) + '...'
      });
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.error('❌ Expected JSON but got:', contentType);
      console.error('❌ Response text:', responseText.substring(0, 300));

      // If we get HTML, it means the API endpoint doesn't exist or has issues
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
        throw new Error('WooCommerce API returned HTML instead of JSON. Check if WooCommerce REST API is enabled and endpoint exists.');
      }

      throw new Error('Invalid response format - expected JSON');
    }

    const products = await response.json();
    
    const result = {
      results: products.map(product => ({
        id: product.id,
        title: product.name,
        slug: product.slug,
        url: product.permalink,
        price: product.price || product.regular_price,
        sale_price: product.sale_price,
        stock_status: product.stock_status,
        images: {
          featured: product.images[0]?.src || '',
          gallery: product.images.map(img => img.src) || []
        },
        categories: product.categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug
        })),
        attributes: product.attributes || [],
        meta_data: product.meta_data || [],
        description: product.description || product.short_description || '',
        date_created: product.date_created,
        featured: product.featured || false
      })),
      total: parseInt(response.headers.get('X-WP-Total') || '0'),
      totalPages: parseInt(response.headers.get('X-WP-TotalPages') || '1'),
    };

    // Cache the result for faster future loads
    setCache(cacheKey, result);

    return result;
  } catch (error) {
    console.error('Error fetching vehicles:', error);

    // Check if it's a CORS error or network error
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      console.warn('🚨 CORS Error detected. Using fallback sample data. To fix this:');
      console.warn('1. Enable CORS on your WordPress site');
      console.warn('2. Or create a proxy endpoint');

      // Return fallback data instead of throwing
      return getFallbackVehicles();
    }

    throw error;
  }
};

// Fallback filter options for when API is not available
const getFallbackFilterOptions = () => ({
  makes: [
    { name: 'Chevrolet', count: 1 },
    { name: 'Ford', count: 1 }
  ],
  models: [
    { name: 'Trax', count: 1 },
    { name: 'Mustang', count: 1 }
  ],
  years: [
    { name: '2021', count: 1 },
    { name: '2020', count: 1 }
  ],
  conditions: [
    { name: 'Available', count: 2 }
  ],
  bodyTypes: [
    { name: 'SUV', count: 1 },
    { name: 'Coupe', count: 1 }
  ],
  transmissions: [
    { name: 'Auto', count: 2 }
  ],
  drivetrains: [
    { name: 'FWD', count: 1 },
    { name: 'RWD', count: 1 }
  ],
  fuelTypes: [
    { name: 'Gas', count: 2 }
  ],
  trims: [
    { name: 'Base', count: 1 },
    { name: 'Sport', count: 1 }
  ],
  exteriorColors: [
    { name: 'Black', count: 1 },
    { name: 'White', count: 1 }
  ],
  interiorColors: [
    { name: 'Black', count: 2 }
  ],
  total: 2
});

// Fetch filter options based on real data
export const fetchFilterOptions = async () => {
  try {
    // Fetch all products to analyze for filter options
    const allProducts = await fetchVehicles({ per_page: 100 });
    
    // Extract unique data from ACF fields
    const makes = new Map();
    const models = new Map();
    const conditions = new Map();
    const bodyTypes = new Map();
    const years = new Map();
    const transmissions = new Map();
    const drivetrains = new Map();
    const fuelTypes = new Map();
    const trims = new Map();
    const exteriorColors = new Map();
    const interiorColors = new Map();
    
    allProducts.results.forEach(product => {
      // Extract ACF data from product meta_data
      const metaData = product.meta_data || [];
      const attributes = product.attributes || [];

      // Helper function to get ACF field value
      const getACFValue = (fieldName) => {
        const acfField = metaData.find(meta => meta.key === fieldName);
        return acfField?.value || null;
      };

      // Helper function to get attribute value
      const getAttributeValue = (attrName) => {
        const attr = attributes.find(attr =>
          attr.name.toLowerCase().includes(attrName.toLowerCase())
        );
        return attr?.options?.[0] || null;
      };

      // Extract MAKE from ACF field 'make'
      const make = getACFValue('make') || getAttributeValue('make');
      if (make) {
        makes.set(make, (makes.get(make) || 0) + 1);
      }

      // Extract MODEL from ACF field 'model'
      const model = getACFValue('model') || getAttributeValue('model');
      if (model) {
        models.set(model, (models.get(model) || 0) + 1);
      }

      // Extract YEAR from ACF field 'year'
      const year = getACFValue('year') || getAttributeValue('year');
      if (year) {
        years.set(year.toString(), (years.get(year.toString()) || 0) + 1);
      }

      // Extract CONDITION from ACF field 'condition'
      const condition = getACFValue('condition') ||
                       (product.stock_status === 'instock' ? 'Available' : 'Sold');
      if (condition) {
        conditions.set(condition, (conditions.get(condition) || 0) + 1);
      }

      // Extract BODY TYPE from categories or ACF 'body_type'
      const bodyType = getACFValue('body_type');
      if (bodyType) {
        bodyTypes.set(bodyType, (bodyTypes.get(bodyType) || 0) + 1);
      } else {
        // Fallback to categories
        product.categories.forEach(cat => {
          if (cat.name !== 'Uncategorized') {
            bodyTypes.set(cat.name, (bodyTypes.get(cat.name) || 0) + 1);
          }
        });
      }

      // Extract TRANSMISSION from ACF field 'transmission'
      const transmission = getACFValue('transmission') || getAttributeValue('transmission');
      if (transmission) {
        transmissions.set(transmission, (transmissions.get(transmission) || 0) + 1);
      }

      // Extract DRIVETRAIN from ACF field 'drivetrain'
      const drivetrain = getACFValue('drivetrain') || getAttributeValue('drivetrain');
      if (drivetrain) {
        drivetrains.set(drivetrain, (drivetrains.get(drivetrain) || 0) + 1);
      }

      // Extract FUEL TYPE from ACF field 'fuel_type'
      const fuelType = getACFValue('fuel_type') || getAttributeValue('fuel');
      if (fuelType) {
        fuelTypes.set(fuelType, (fuelTypes.get(fuelType) || 0) + 1);
      }

      // Extract TRIM from ACF field 'trim'
      const trim = getACFValue('trim');
      if (trim) {
        trims.set(trim, (trims.get(trim) || 0) + 1);
      }

      // Extract EXTERIOR COLOR from ACF field 'exterior_color'
      const exteriorColor = getACFValue('exterior_color');
      if (exteriorColor) {
        exteriorColors.set(exteriorColor, (exteriorColors.get(exteriorColor) || 0) + 1);
      }

      // Extract INTERIOR COLOR from ACF field 'interior_color'
      const interiorColor = getACFValue('interior_color');
      if (interiorColor) {
        interiorColors.set(interiorColor, (interiorColors.get(interiorColor) || 0) + 1);
      }
    });
    
    return {
      makes: Array.from(makes.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      models: Array.from(models.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      years: Array.from(years.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.name - a.name),
      conditions: Array.from(conditions.entries()).map(([name, count]) => ({ name, count })),
      bodyTypes: Array.from(bodyTypes.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      transmissions: Array.from(transmissions.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      drivetrains: Array.from(drivetrains.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      fuelTypes: Array.from(fuelTypes.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      trims: Array.from(trims.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      exteriorColors: Array.from(exteriorColors.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      interiorColors: Array.from(interiorColors.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      total: allProducts.total
    };
  } catch (error) {
    console.error('Error fetching filter options:', error);

    // Check if it's a CORS error
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      console.warn('🚨 CORS Error in filter options. Using fallback data.');
      return getFallbackFilterOptions();
    }

    // Return fallback empty data if other API error
    return {
      makes: [],
      models: [],
      years: [],
      conditions: [],
      bodyTypes: [],
      total: 0
    };
  }
};

// Fetch ACF fields for a specific product (if ACF data is available)
export const fetchProductACF = async (productId) => {
  try {
    // Try to fetch ACF data from custom endpoint or meta data
    const response = await fetch(`${process.env.REACT_APP_WP_SITE_URL}/wp-json/wp/v2/product/${productId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      const data = await response.json();
      return data.acf || data.meta || {};
    }
    
    return {};
  } catch (error) {
    console.error('Error fetching ACF data:', error);
    return {};
  }
};

// Test API connection with improved CORS handling
export const testAPIConnection = async () => {
  console.log('🔗 Testing API connection to:', WC_API_BASE);
  console.log('🔑 Using credentials:', {
    key: WC_CONSUMER_KEY ? WC_CONSUMER_KEY.substring(0, 10) + '...' : 'Missing',
    secret: WC_CONSUMER_SECRET ? WC_CONSUMER_SECRET.substring(0, 10) + '...' : 'Missing'
  });

  // Check if we're in dev vs production
  const isProduction = window.location.hostname === 'carzinoautos-setup.github.io';
  const currentDomain = window.location.origin;

  console.log('🌐 Environment:', {
    isProduction,
    currentDomain,
    expectedToWork: isProduction ? 'Yes (CORS configured)' : 'Maybe (depends on CORS setup)'
  });

  // Simple test - just try the main API endpoint
  try {
    const urlWithAuth = `${WC_API_BASE}/products?per_page=1&consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`;
    console.log('🧪 Testing API URL:', urlWithAuth);

    const response = await fetch(urlWithAuth, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('📡 API Response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });

    if (!response.ok) {
      return {
        success: false,
        message: `API Error: ${response.status} ${response.statusText}`
      };
    }

    // Check content type before reading
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {
        success: false,
        message: 'API returned non-JSON response - WooCommerce API may not be enabled'
      };
    }

    // Try to parse response
    const data = await response.json();

    return {
      success: true,
      message: 'API connection successful',
      productCount: response.headers.get('X-WP-Total') || data.length.toString(),
      data: data
    };

  } catch (error) {
    console.error('❌ API Connection Error:', error);

    // Enhanced CORS error handling
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      const corsMessage = isProduction
        ? `CORS Error: Connection failed from ${currentDomain}. This shouldn't happen on production.`
        : `CORS Error: Dev server (${currentDomain}) not allowed by WordPress. This is normal - GitHub Pages will work fine.`;

      console.log('💡 CORS Fix Instructions:');
      console.log('Add this to your WordPress functions.php:');
      console.log(`
// Allow CORS for both GitHub Pages and dev server
function carzino_enable_cors() {
    $allowed_origins = [
        'https://carzinoautos-setup.github.io',
        '${currentDomain}'
    ];

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, $allowed_origins)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Accept, Authorization, Content-Type, X-Requested-With');
    }

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        exit(0);
    }
}
add_action('init', 'carzino_enable_cors');
add_action('rest_api_init', 'carzino_enable_cors');
`);

      return {
        success: false,
        message: corsMessage,
        showInstructions: !isProduction
      };
    }

    return {
      success: false,
      message: `Connection Error: ${error.message}`
    };
  }
};

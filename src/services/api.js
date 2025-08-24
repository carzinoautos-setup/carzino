/**
 * WooCommerce API Service
 * Connects to real vehicle inventory data
 */

const WC_API_BASE = `${process.env.REACT_APP_WP_SITE_URL}/wp-json/wc/v3`;
const WC_CONSUMER_KEY = process.env.REACT_APP_WC_CONSUMER_KEY;
const WC_CONSUMER_SECRET = process.env.REACT_APP_WC_CONSUMER_SECRET;

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
    const fullUrl = `${WC_API_BASE}/products?${queryParams}`;
    console.log('📍 Full API URL:', fullUrl);
    console.log('🔐 Auth headers:', getAuthHeaders());

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: getAuthHeaders(),
      mode: 'cors', // Explicitly set CORS mode
    });

    console.log('📡 Response status:', response.status);
    console.log('📄 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
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
  total: 2
});

// Fetch filter options based on real data
export const fetchFilterOptions = async () => {
  try {
    // Fetch all products to analyze for filter options
    const allProducts = await fetchVehicles({ per_page: 100 });
    
    // Extract unique makes, models, etc. from product data
    const makes = new Map();
    const models = new Map();
    const conditions = new Map();
    const bodyTypes = new Map();
    const years = new Map();
    
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
    });
    
    return {
      makes: Array.from(makes.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      models: Array.from(models.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
      years: Array.from(years.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.name - a.name),
      conditions: Array.from(conditions.entries()).map(([name, count]) => ({ name, count })),
      bodyTypes: Array.from(bodyTypes.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
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

// Test API connection with detailed debugging
export const testAPIConnection = async () => {
  console.log('🔗 Testing API connection to:', WC_API_BASE);
  console.log('🔑 Using credentials:', {
    key: WC_CONSUMER_KEY ? WC_CONSUMER_KEY.substring(0, 10) + '...' : 'Missing',
    secret: WC_CONSUMER_SECRET ? WC_CONSUMER_SECRET.substring(0, 10) + '...' : 'Missing',
    fullKey: WC_CONSUMER_KEY,
    fullSecret: WC_CONSUMER_SECRET
  });
  console.log('🌐 Full API URL will be:', `${WC_API_BASE}/products?per_page=1`);

  try {
    const response = await fetch(`${WC_API_BASE}/products?per_page=1`, {
      method: 'GET',
      headers: getAuthHeaders(),
      mode: 'cors', // Explicitly set CORS mode
    });
    
    if (response.ok) {
      return {
        success: true,
        message: 'API connection successful',
        productCount: response.headers.get('X-WP-Total') || '0'
      };
    } else {
      return {
        success: false,
        message: `API Error: ${response.status} ${response.statusText}`
      };
    }
  } catch (error) {
    // Check if it's a CORS error
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      return {
        success: false,
        message: `CORS Error: Cannot connect to ${process.env.REACT_APP_WP_SITE_URL} from GitHub Pages. Enable CORS on your WordPress site.`
      };
    }

    return {
      success: false,
      message: `Connection Error: ${error.message}`
    };
  }
};

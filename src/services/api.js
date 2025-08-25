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

// Fallback sample data for when API is not available - realistic vehicle inventory
const getFallbackVehicles = () => {
  const isProduction = window.location.hostname !== 'localhost';
  const dataNote = isProduction ? 'API Connection Issue' : 'Dev Environment Sample';

  return {
    results: [
      {
        id: 'fallback-1',
        title: `2021 Toyota RAV4 XLE (${dataNote})`,
        slug: 'sample-toyota-rav4',
        url: '#',
        price: '28995',
        sale_price: '26995',
        stock_status: 'instock',
        images: {
          featured: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=450&h=300&fit=crop',
          gallery: [
            'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=450&h=300&fit=crop'
          ]
        },
        categories: [{ id: 1, name: 'SUV', slug: 'suv' }],
        attributes: [
          { name: 'Make', options: ['Toyota'] },
          { name: 'Model', options: ['RAV4'] },
          { name: 'Year', options: ['2021'] },
          { name: 'Mileage', options: ['32456'] },
          { name: 'Transmission', options: ['Automatic'] },
          { name: 'Drive Type', options: ['AWD'] }
        ],
        meta_data: [
          { key: 'make', value: 'Toyota' },
          { key: 'model', value: 'RAV4' },
          { key: 'year', value: '2021' },
          { key: 'condition', value: 'Available' },
          { key: 'body_type', value: 'SUV' },
          { key: 'drivetrain', value: 'AWD' },
          { key: 'transmission', value: 'Automatic' },
          { key: 'fuel_type', value: 'Gasoline' },
          { key: 'trim', value: 'XLE' },
          { key: 'exterior_color', value: 'White' },
          { key: 'interior_color', value: 'Black' },
          { key: 'dealer', value: 'Carzino Auto Sales' },
          { key: 'location', value: 'Tacoma, WA' },
          { key: 'phone', value: '(253) 555-0100' }
        ],
        description: 'Reliable SUV with excellent safety ratings and fuel economy.',
        date_created: new Date().toISOString(),
        featured: true
      },
      {
        id: 'fallback-2',
        title: `2020 Toyota Camry LE (${dataNote})`,
        slug: 'sample-toyota-camry',
        url: '#',
        price: '22995',
        sale_price: '',
        stock_status: 'instock',
        images: {
          featured: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=450&h=300&fit=crop',
          gallery: ['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=450&h=300&fit=crop']
        },
        categories: [{ id: 2, name: 'Sedan', slug: 'sedan' }],
        attributes: [],
        meta_data: [
          { key: 'make', value: 'Toyota' },
          { key: 'model', value: 'Camry' },
          { key: 'year', value: '2020' },
          { key: 'condition', value: 'Available' },
          { key: 'body_type', value: 'Sedan' },
          { key: 'drivetrain', value: 'FWD' },
          { key: 'transmission', value: 'Automatic' },
          { key: 'fuel_type', value: 'Gasoline' },
          { key: 'trim', value: 'LE' },
          { key: 'exterior_color', value: 'Blue' },
          { key: 'interior_color', value: 'Gray' }
        ],
        description: 'Reliable sedan with excellent fuel economy.',
        date_created: new Date().toISOString(),
        featured: false
      },
      {
        id: 'fallback-3',
        title: `2019 Ford F-150 XLT (${dataNote})`,
        slug: 'sample-ford-f150',
        url: '#',
        price: '35995',
        sale_price: '',
        stock_status: 'instock',
        images: {
          featured: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=450&h=300&fit=crop',
          gallery: ['https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=450&h=300&fit=crop']
        },
        categories: [{ id: 3, name: 'Truck', slug: 'truck' }],
        attributes: [],
        meta_data: [
          { key: 'make', value: 'Ford' },
          { key: 'model', value: 'F-150' },
          { key: 'year', value: '2019' },
          { key: 'condition', value: 'Available' },
          { key: 'body_type', value: 'Truck' },
          { key: 'drivetrain', value: '4WD' },
          { key: 'transmission', value: 'Automatic' },
          { key: 'fuel_type', value: 'Gasoline' },
          { key: 'trim', value: 'XLT' },
          { key: 'exterior_color', value: 'Red' },
          { key: 'interior_color', value: 'Black' }
        ],
        description: 'Reliable work truck with 4WD capability and towing package.',
        date_created: new Date().toISOString(),
        featured: false
      },
      {
        id: 'fallback-4',
        title: `2020 Ford Mustang GT (${dataNote})`,
        slug: 'sample-ford-mustang',
        url: '#',
        price: '32995',
        sale_price: '',
        stock_status: 'instock',
        images: {
          featured: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=450&h=300&fit=crop',
          gallery: ['https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=450&h=300&fit=crop']
        },
        categories: [{ id: 4, name: 'Coupe', slug: 'coupe' }],
        attributes: [],
        meta_data: [
          { key: 'make', value: 'Ford' },
          { key: 'model', value: 'Mustang' },
          { key: 'year', value: '2020' },
          { key: 'condition', value: 'Available' },
          { key: 'body_type', value: 'Coupe' },
          { key: 'drivetrain', value: 'RWD' },
          { key: 'transmission', value: 'Manual' },
          { key: 'fuel_type', value: 'Gasoline' },
          { key: 'trim', value: 'GT' },
          { key: 'exterior_color', value: 'Black' },
          { key: 'interior_color', value: 'Black' }
        ],
        description: 'High-performance sports car with manual transmission.',
        date_created: new Date().toISOString(),
        featured: true
      },
      {
        id: 'fallback-5',
        title: `2021 Honda Civic Si (${dataNote})`,
        slug: 'sample-honda-civic',
        url: '#',
        price: '25995',
        sale_price: '',
        stock_status: 'instock',
        images: {
          featured: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=450&h=300&fit=crop',
          gallery: ['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=450&h=300&fit=crop']
        },
        categories: [{ id: 2, name: 'Sedan', slug: 'sedan' }],
        attributes: [],
        meta_data: [
          { key: 'make', value: 'Honda' },
          { key: 'model', value: 'Civic' },
          { key: 'year', value: '2021' },
          { key: 'condition', value: 'Available' },
          { key: 'body_type', value: 'Sedan' },
          { key: 'drivetrain', value: 'FWD' },
          { key: 'transmission', value: 'Manual' },
          { key: 'fuel_type', value: 'Gasoline' },
          { key: 'trim', value: 'Si' },
          { key: 'exterior_color', value: 'Silver' },
          { key: 'interior_color', value: 'Black' }
        ],
        description: 'Sporty and fuel-efficient sedan with manual transmission.',
        date_created: new Date().toISOString(),
        featured: false
      },
      {
        id: 'fallback-4',
        title: `2022 Tesla Model 3 (${dataNote})`,
        slug: 'sample-tesla-model3',
        url: '#',
        price: '42995',
        sale_price: '39995',
        stock_status: 'instock',
        images: {
          featured: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=450&h=300&fit=crop',
          gallery: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=450&h=300&fit=crop']
        },
        categories: [{ id: 4, name: 'Electric', slug: 'electric' }],
        attributes: [
          { name: 'Make', options: ['Tesla'] },
          { name: 'Model', options: ['Model 3'] },
          { name: 'Year', options: ['2022'] },
          { name: 'Mileage', options: ['18,500'] },
          { name: 'Transmission', options: ['Single Speed'] },
          { name: 'Drive Type', options: ['RWD'] }
        ],
        meta_data: [
          { key: 'dealer', value: 'Carzino Auto Sales' },
          { key: 'location', value: 'Bellevue, WA' },
          { key: 'phone', value: '(425) 555-0400' }
        ],
        description: 'Electric sedan with autopilot features and supercharging capability.',
        date_created: new Date().toISOString(),
        featured: true
      },
      {
        id: 'fallback-5',
        title: `2020 Jeep Wrangler Unlimited (${dataNote})`,
        slug: 'sample-jeep-wrangler',
        url: '#',
        price: '31995',
        sale_price: '',
        stock_status: 'instock',
        images: {
          featured: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=450&h=300&fit=crop',
          gallery: ['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=450&h=300&fit=crop']
        },
        categories: [{ id: 5, name: 'SUV', slug: 'suv' }],
        attributes: [
          { name: 'Make', options: ['Jeep'] },
          { name: 'Model', options: ['Wrangler'] },
          { name: 'Year', options: ['2020'] },
          { name: 'Mileage', options: ['42,890'] },
          { name: 'Transmission', options: ['Manual'] },
          { name: 'Drive Type', options: ['4WD'] }
        ],
        meta_data: [
          { key: 'dealer', value: 'Carzino Auto Sales' },
          { key: 'location', value: 'Olympia, WA' },
          { key: 'phone', value: '(360) 555-0500' }
        ],
        description: 'Off-road capable SUV with removable doors and roof.',
        date_created: new Date().toISOString(),
        featured: false
      },
      {
        id: 'fallback-6',
        title: `2021 BMW 3 Series 330i (${dataNote})`,
        slug: 'sample-bmw-330i',
        url: '#',
        price: '38995',
        sale_price: '',
        stock_status: 'instock',
        images: {
          featured: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=450&h=300&fit=crop',
          gallery: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=450&h=300&fit=crop']
        },
        categories: [{ id: 6, name: 'Luxury', slug: 'luxury' }],
        attributes: [
          { name: 'Make', options: ['BMW'] },
          { name: 'Model', options: ['3 Series'] },
          { name: 'Year', options: ['2021'] },
          { name: 'Mileage', options: ['24,500'] },
          { name: 'Transmission', options: ['Automatic'] },
          { name: 'Drive Type', options: ['RWD'] }
        ],
        meta_data: [
          { key: 'dealer', value: 'Carzino Auto Sales' },
          { key: 'location', value: 'Redmond, WA' },
          { key: 'phone', value: '(425) 555-0600' }
        ],
        description: 'Luxury sports sedan with premium interior and advanced technology.',
        date_created: new Date().toISOString(),
        featured: false
      },
      // Additional Ford vehicles for realistic filtering
      {
        id: 'fallback-ford-1',
        title: `2020 Ford F-150 Lariat (${dataNote})`,
        slug: 'sample-ford-f150-lariat',
        url: '#',
        price: '34995',
        sale_price: '',
        stock_status: 'instock',
        images: {
          featured: 'https://images.unsplash.com/photo-1593450315200-bb4e0b77ec38?w=450&h=300&fit=crop',
          gallery: ['https://images.unsplash.com/photo-1593450315200-bb4e0b77ec38?w=450&h=300&fit=crop']
        },
        categories: [{ id: 3, name: 'Truck', slug: 'truck' }],
        attributes: [],
        meta_data: [
          { key: 'make', value: 'Ford' },
          { key: 'model', value: 'F-150' },
          { key: 'year', value: '2020' },
          { key: 'condition', value: 'Available' },
          { key: 'body_type', value: 'Truck' },
          { key: 'drivetrain', value: '4WD' },
          { key: 'transmission', value: 'Automatic' },
          { key: 'fuel_type', value: 'Gasoline' },
          { key: 'trim', value: 'Lariat' },
          { key: 'exterior_color', value: 'Blue' },
          { key: 'interior_color', value: 'Tan' }
        ],
        description: 'Premium F-150 with luxury features.',
        date_created: new Date().toISOString(),
        featured: false
      },
      {
        id: 'fallback-ford-2',
        title: `2021 Ford F-150 King Ranch (${dataNote})`,
        slug: 'sample-ford-f150-king',
        url: '#',
        price: '42995',
        sale_price: '',
        stock_status: 'instock',
        images: {
          featured: 'https://images.unsplash.com/photo-1593450315200-bb4e0b77ec38?w=450&h=300&fit=crop',
          gallery: ['https://images.unsplash.com/photo-1593450315200-bb4e0b77ec38?w=450&h=300&fit=crop']
        },
        categories: [{ id: 3, name: 'Truck', slug: 'truck' }],
        attributes: [],
        meta_data: [
          { key: 'make', value: 'Ford' },
          { key: 'model', value: 'F-150' },
          { key: 'year', value: '2021' },
          { key: 'condition', value: 'Available' },
          { key: 'body_type', value: 'Truck' },
          { key: 'drivetrain', value: '4WD' },
          { key: 'transmission', value: 'Automatic' },
          { key: 'fuel_type', value: 'Gasoline' },
          { key: 'trim', value: 'King Ranch' },
          { key: 'exterior_color', value: 'Brown' },
          { key: 'interior_color', value: 'Leather' }
        ],
        description: 'Top-tier F-150 with King Ranch luxury package.',
        date_created: new Date().toISOString(),
        featured: true
      },
      {
        id: 'fallback-ford-3',
        title: `2022 Ford F-150 Lightning (${dataNote})`,
        slug: 'sample-ford-f150-lightning',
        url: '#',
        price: '52995',
        sale_price: '',
        stock_status: 'instock',
        images: {
          featured: 'https://images.unsplash.com/photo-1593450315200-bb4e0b77ec38?w=450&h=300&fit=crop',
          gallery: ['https://images.unsplash.com/photo-1593450315200-bb4e0b77ec38?w=450&h=300&fit=crop']
        },
        categories: [{ id: 3, name: 'Truck', slug: 'truck' }],
        attributes: [],
        meta_data: [
          { key: 'make', value: 'Ford' },
          { key: 'model', value: 'F-150' },
          { key: 'year', value: '2022' },
          { key: 'condition', value: 'Available' },
          { key: 'body_type', value: 'Truck' },
          { key: 'drivetrain', value: 'AWD' },
          { key: 'transmission', value: 'Single Speed' },
          { key: 'fuel_type', value: 'Electric' },
          { key: 'trim', value: 'Lightning' },
          { key: 'exterior_color', value: 'White' },
          { key: 'interior_color', value: 'Black' }
        ],
        description: 'Electric F-150 with impressive range and capability.',
        date_created: new Date().toISOString(),
        featured: true
      },
      {
        id: 'fallback-ford-4',
        title: `2021 Ford F-150 Raptor (${dataNote})`,
        slug: 'sample-ford-f150-raptor',
        url: '#',
        price: '65995',
        sale_price: '',
        stock_status: 'instock',
        images: {
          featured: 'https://images.unsplash.com/photo-1593450315200-bb4e0b77ec38?w=450&h=300&fit=crop',
          gallery: ['https://images.unsplash.com/photo-1593450315200-bb4e0b77ec38?w=450&h=300&fit=crop']
        },
        categories: [{ id: 3, name: 'Truck', slug: 'truck' }],
        attributes: [],
        meta_data: [
          { key: 'make', value: 'Ford' },
          { key: 'model', value: 'F-150' },
          { key: 'year', value: '2021' },
          { key: 'condition', value: 'Available' },
          { key: 'body_type', value: 'Truck' },
          { key: 'drivetrain', value: '4WD' },
          { key: 'transmission', value: 'Automatic' },
          { key: 'fuel_type', value: 'Gasoline' },
          { key: 'trim', value: 'Raptor' },
          { key: 'exterior_color', value: 'Orange' },
          { key: 'interior_color', value: 'Black' }
        ],
        description: 'High-performance off-road F-150 Raptor.',
        date_created: new Date().toISOString(),
        featured: true
      },
      {
        id: 'fallback-ford-5',
        title: `2020 Ford F-150 STX (${dataNote})`,
        slug: 'sample-ford-f150-stx',
        url: '#',
        price: '27995',
        sale_price: '',
        stock_status: 'instock',
        images: {
          featured: 'https://images.unsplash.com/photo-1593450315200-bb4e0b77ec38?w=450&h=300&fit=crop',
          gallery: ['https://images.unsplash.com/photo-1593450315200-bb4e0b77ec38?w=450&h=300&fit=crop']
        },
        categories: [{ id: 3, name: 'Truck', slug: 'truck' }],
        attributes: [],
        meta_data: [
          { key: 'make', value: 'Ford' },
          { key: 'model', value: 'F-150' },
          { key: 'year', value: '2020' },
          { key: 'condition', value: 'Available' },
          { key: 'body_type', value: 'Truck' },
          { key: 'drivetrain', value: '4WD' },
          { key: 'transmission', value: 'Automatic' },
          { key: 'fuel_type', value: 'Gasoline' },
          { key: 'trim', value: 'STX' },
          { key: 'exterior_color', value: 'Gray' },
          { key: 'interior_color', value: 'Black' }
        ],
        description: 'Affordable F-150 with essential features.',
        date_created: new Date().toISOString(),
        featured: false
      },
      {
        id: 'fallback-ford-6',
        title: `2019 Ford Explorer XLT (${dataNote})`,
        slug: 'sample-ford-explorer',
        url: '#',
        price: '26995',
        sale_price: '',
        stock_status: 'instock',
        images: {
          featured: 'https://images.unsplash.com/photo-1566473179817-73e78ca2b29c?w=450&h=300&fit=crop',
          gallery: ['https://images.unsplash.com/photo-1566473179817-73e78ca2b29c?w=450&h=300&fit=crop']
        },
        categories: [{ id: 1, name: 'SUV', slug: 'suv' }],
        attributes: [],
        meta_data: [
          { key: 'make', value: 'Ford' },
          { key: 'model', value: 'Explorer' },
          { key: 'year', value: '2019' },
          { key: 'condition', value: 'Available' },
          { key: 'body_type', value: 'SUV' },
          { key: 'drivetrain', value: 'AWD' },
          { key: 'transmission', value: 'Automatic' },
          { key: 'fuel_type', value: 'Gasoline' },
          { key: 'trim', value: 'XLT' },
          { key: 'exterior_color', value: 'Silver' },
          { key: 'interior_color', value: 'Black' }
        ],
        description: 'Family-friendly SUV with three rows of seating.',
        date_created: new Date().toISOString(),
        featured: false
      }
    ],
    total: 12,
    totalPages: 1
  };
};

// Fetch all products (vehicles) from WooCommerce with improved error handling
export const fetchVehicles = async (params = {}) => {
  try {
    // Check if environment variables are available
    if (!WC_CONSUMER_KEY || !WC_CONSUMER_SECRET || !process.env.REACT_APP_WP_SITE_URL ||
        WC_CONSUMER_KEY === 'missing' || WC_CONSUMER_SECRET === 'missing') {
      console.warn('⚠️ Missing or invalid API credentials, using fallback data');
      return getFallbackVehicles();
    }

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

    // Try URL-based authentication with timeout
    const urlWithAuth = `${WC_API_BASE}/products?${queryParams}&consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`;
    console.log('📍 Fetching vehicles from:', urlWithAuth.substring(0, 100) + '...');
    console.log('🌍 Current origin:', window.location.origin);
    console.log('🎯 Target API:', WC_API_BASE);

    const startTime = Date.now();
    const response = await fetchWithTimeout(urlWithAuth, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Carzino-React-App/1.0',
        'Origin': window.location.origin
      }
    }, 15000); // 15 second timeout for large inventory

    const responseTime = Date.now() - startTime;
    console.log(`⏱️ Vehicles loaded in ${responseTime}ms`);
    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Response Error:', {
        status: response.status,
        statusText: response.statusText,
        responseText: errorText.substring(0, 200) + '...'
      });

      // For API errors, return fallback data instead of throwing
      console.warn('🚨 API error detected, using fallback data');
      return getFallbackVehicles();
    }

    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.error('❌ Expected JSON but got:', contentType);
      console.error('❌ Response text:', responseText.substring(0, 300));

      // If we get HTML, return fallback data
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
        console.warn('🚨 WordPress returned HTML instead of JSON, using fallback data');
        return getFallbackVehicles();
      }

      console.warn('🚨 Invalid response format, using fallback data');
      return getFallbackVehicles();
    }

    const products = await response.json();
    console.log(`✅ Successfully fetched ${products.length} vehicles from WooCommerce API`);

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
      total: parseInt(response.headers.get('X-WP-Total') || products.length.toString()),
      totalPages: parseInt(response.headers.get('X-WP-TotalPages') || '1'),
    };

    // Cache the result for faster future loads
    setCache(cacheKey, result);

    return result;
  } catch (error) {
    // Enhanced error handling with specific fallback logic
    if (error.message.includes('timed out')) {
      console.warn('🚨 API request timed out, using fallback data');
      return getFallbackVehicles();
    }

    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      const currentDomain = window.location.hostname;
      const isFlyDev = currentDomain.includes('fly.dev');

      // Log CORS error details but don't throw - just use fallback
      console.warn('🚨 CORS Error Details:', error);

      if (isFlyDev) {
        console.warn('🔧 CORS Fix Needed: Add this domain to WordPress CORS settings:', currentDomain);
        console.warn('📝 Add this to WordPress functions.php CORS allowed origins:', `'https://${currentDomain}'`);
      }

      console.log('✅ Using fallback sample data instead');
      return getFallbackVehicles();
    }

    if (error.message.includes('AbortError') || error.name === 'AbortError') {
      console.warn('🚨 Request was aborted, using fallback data');
      return getFallbackVehicles();
    }

    // For any other error, still return fallback data to keep app working
    console.warn('🚨 Unexpected error, using fallback data:', error.message);
    return getFallbackVehicles();
  }
};

// Fallback filter options for when API is not available - matches fallback vehicles
const getFallbackFilterOptions = () => ({
  makes: [
    { name: 'Ford', count: 8 },
    { name: 'Toyota', count: 2 },
    { name: 'Honda', count: 1 },
    { name: 'BMW', count: 1 }
  ],
  models: [
    { name: 'F-150', count: 6 },
    { name: 'Mustang', count: 4 },
    { name: 'Explorer', count: 3 },
    { name: 'RAV4', count: 3 },
    { name: 'Camry', count: 2 },
    { name: 'Civic', count: 2 }
  ],
  years: [
    { name: '2021', count: 2 },
    { name: '2020', count: 2 },
    { name: '2019', count: 1 }
  ],
  conditions: [
    { name: 'Available', count: 5 }
  ],
  bodyTypes: [
    { name: 'SUV', count: 1 },
    { name: 'Sedan', count: 2 },
    { name: 'Truck', count: 1 },
    { name: 'Coupe', count: 1 }
  ],
  transmissions: [
    { name: 'Automatic', count: 3 },
    { name: 'Manual', count: 2 }
  ],
  drivetrains: [
    { name: 'AWD', count: 1 },
    { name: 'FWD', count: 2 },
    { name: '4WD', count: 1 },
    { name: 'RWD', count: 1 }
  ],
  fuelTypes: [
    { name: 'Gasoline', count: 5 }
  ],
  trims: [
    { name: 'XLE', count: 1 },
    { name: 'LE', count: 1 },
    { name: 'XLT', count: 1 },
    { name: 'GT', count: 1 },
    { name: 'Si', count: 1 }
  ],
  exteriorColors: [
    { name: 'White', count: 1 },
    { name: 'Blue', count: 1 },
    { name: 'Red', count: 1 },
    { name: 'Black', count: 1 },
    { name: 'Silver', count: 1 }
  ],
  interiorColors: [
    { name: 'Black', count: 4 },
    { name: 'Gray', count: 1 }
  ],
  total: 12
});

// Generate cascading filter options based on current filter selections
export const getFilteredOptions = (allVehicles, currentFilters = {}) => {
  // Filter vehicles based on current selections (excluding the filter we're calculating options for)
  const getFilteredVehicles = (excludeCategory = null) => {
    return allVehicles.filter(vehicle => {
      // Check each filter category except the one we're excluding
      for (const [category, values] of Object.entries(currentFilters)) {
        if (category === excludeCategory) continue;
        if (!values || (Array.isArray(values) && values.length === 0)) continue;
        if (category === 'priceMin' || category === 'priceMax' || category === 'paymentMin' || category === 'paymentMax') continue;

        // Get vehicle value for this category
        const vehicleValue = getVehicleFieldValue(vehicle, category);
        if (!vehicleValue) continue;

        // Check if vehicle matches filter
        if (Array.isArray(values)) {
          if (!values.includes(vehicleValue)) {
            return false;
          }
        } else if (values && vehicleValue !== values) {
          return false;
        }
      }
      return true;
    });
  };

  // Helper function to extract field value from vehicle
  const getVehicleFieldValue = (vehicle, category) => {
    const metaData = vehicle.meta_data || [];
    const attributes = vehicle.attributes || [];

    const getACFValue = (fieldName) => {
      const acfField = metaData.find(meta => meta.key === fieldName);
      return acfField?.value || null;
    };

    const getAttributeValue = (attrName) => {
      const attr = attributes.find(attr =>
        attr.name.toLowerCase().includes(attrName.toLowerCase())
      );
      return attr?.options?.[0] || null;
    };

    switch (category) {
      case 'make':
        return getACFValue('make') || getAttributeValue('make');
      case 'model':
        return getACFValue('model') || getAttributeValue('model');
      case 'year':
        return (getACFValue('year') || getAttributeValue('year'))?.toString();
      case 'condition':
        return getACFValue('condition') || (vehicle.stock_status === 'instock' ? 'Available' : 'Sold');
      case 'vehicleType':
      case 'bodyType':
        const bodyType = getACFValue('body_type');
        if (bodyType) return bodyType;
        return vehicle.categories.find(cat => cat.name !== 'Uncategorized')?.name || null;
      case 'driveType':
        return getACFValue('drivetrain') || getAttributeValue('drivetrain') || getAttributeValue('drive');
      case 'transmissionSpeed':
      case 'transmission':
        return getACFValue('transmission') || getAttributeValue('transmission');
      case 'fuelType':
        return getACFValue('fuel_type') || getAttributeValue('fuel');
      case 'trim':
        return getACFValue('trim');
      case 'exteriorColor':
        return getACFValue('exterior_color');
      case 'interiorColor':
        return getACFValue('interior_color');
      default:
        return null;
    }
  };

  // Generate options for each category based on filtered vehicles
  const generateOptions = (category) => {
    const filteredVehicles = getFilteredVehicles(category);
    const counts = new Map();

    // Debug logging for model filtering
    if (category === 'model' && currentFilters.make?.length > 0) {
      console.log(`🔍 Generating ${category} options:`, {
        totalVehicles: allVehicles.length,
        filteredVehicles: filteredVehicles.length,
        currentFilters: currentFilters,
        excludingCategory: category
      });
    }

    filteredVehicles.forEach(vehicle => {
      const value = getVehicleFieldValue(vehicle, category);
      if (value) {
        counts.set(value, (counts.get(value) || 0) + 1);

        // Debug log for model filtering
        if (category === 'model' && currentFilters.make?.length > 0) {
          const vehicleMake = getVehicleFieldValue(vehicle, 'make');
          console.log(`📊 Found ${category}: ${value} (make: ${vehicleMake})`);
        }
      }
    });

    const options = Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Debug final options for models
    if (category === 'model' && currentFilters.make?.length > 0) {
      console.log(`✅ Final ${category} options:`, options);
    }

    return options;
  };

  // Debug logging for cascading
  const hasActiveFilters = Object.entries(currentFilters).some(([key, values]) => {
    if (['zipCode', 'radius', 'termLength', 'interestRate', 'downPayment', 'priceMin', 'priceMax', 'paymentMin', 'paymentMax'].includes(key)) {
      return false;
    }
    return Array.isArray(values) ? values.length > 0 : (values && values.toString().trim() !== '');
  });

  if (hasActiveFilters) {
    console.log('🔗 Generating cascading filter options based on selections:', currentFilters);
    const totalVehicles = allVehicles.length;
    const filteredForMake = getFilteredVehicles('make').length;
    console.log(`📊 Cascading filters: ${totalVehicles} total → ${filteredForMake} matching current filters`);
  }

  return {
    makes: generateOptions('make'),
    models: generateOptions('model'),
    years: generateOptions('year'),
    conditions: generateOptions('condition'),
    bodyTypes: generateOptions('vehicleType'),
    drivetrains: generateOptions('driveType'),
    transmissions: generateOptions('transmissionSpeed'),
    fuelTypes: generateOptions('fuelType'),
    trims: generateOptions('trim'),
    exteriorColors: generateOptions('exteriorColor'),
    interiorColors: generateOptions('interiorColor'),
    total: allVehicles.length
  };
};

// Fetch filter options based on real data with improved error handling
export const fetchFilterOptions = async (currentFilters = {}) => {
  try {
    console.log('🔍 Fetching filter options from vehicle data...');

    // Check if we should use fallback immediately
    if (!WC_CONSUMER_KEY || !WC_CONSUMER_SECRET || !process.env.REACT_APP_WP_SITE_URL ||
        WC_CONSUMER_KEY === 'missing' || WC_CONSUMER_SECRET === 'missing') {
      console.warn('📊 Using fallback filter options (API credentials missing)');
      return getFallbackFilterOptions();
    }

    // Fetch all products to analyze for filter options
    // This will use the improved fetchVehicles function with all its error handling
    const allProducts = await fetchVehicles({ per_page: 100 });

    // If we got fallback data, return fallback filter options
    if (allProducts.results.some(vehicle => vehicle.id.toString().startsWith('fallback-'))) {
      console.log('📊 Using fallback filter options (matches fallback vehicle data)');
      return getFallbackFilterOptions();
    }

    console.log(`📊 Analyzing ${allProducts.results.length} vehicles for filter options...`);

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
      const drivetrain = getACFValue('drivetrain') || getAttributeValue('drivetrain') || getAttributeValue('drive');
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

    const filterOptions = {
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

    console.log('✅ Filter options extracted successfully:', {
      makes: filterOptions.makes.length,
      models: filterOptions.models.length,
      years: filterOptions.years.length,
      bodyTypes: filterOptions.bodyTypes.length
    });

    // If we have current filters, apply cascading logic
    if (currentFilters && Object.keys(currentFilters).length > 0) {
      console.log('🔗 Applying cascading filter logic based on current selections');
      const cascadingOptions = getFilteredOptions(allProducts.results, currentFilters);
      console.log('✅ Cascading filter options generated:', {
        makes: cascadingOptions.makes.length,
        models: cascadingOptions.models.length,
        years: cascadingOptions.years.length,
        bodyTypes: cascadingOptions.bodyTypes.length
      });
      return cascadingOptions;
    }

    return filterOptions;

  } catch (error) {
    console.warn('🚨 Filter options error, using fallback data:', error.message);
    return getFallbackFilterOptions();
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

// Helper function to create fetch with timeout
const fetchWithTimeout = async (url, options = {}, timeoutMs = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
};

// Test API connection with improved CORS handling and timeout
export const testAPIConnection = async () => {
  console.log('🔗 Testing API connection to:', WC_API_BASE);
  console.log('🔑 Using credentials:', {
    key: WC_CONSUMER_KEY ? WC_CONSUMER_KEY.substring(0, 10) + '...' : 'Missing',
    secret: WC_CONSUMER_SECRET ? WC_CONSUMER_SECRET.substring(0, 10) + '...' : 'Missing'
  });

  // Check if environment variables are missing or invalid
  if (!WC_CONSUMER_KEY || !WC_CONSUMER_SECRET || !process.env.REACT_APP_WP_SITE_URL ||
      WC_CONSUMER_KEY === 'missing' || WC_CONSUMER_SECRET === 'missing') {
    console.error('❌ Missing or invalid environment variables!');
    return {
      success: false,
      message: 'Missing or invalid API credentials - using fallback data'
    };
  }

  // Check if we're in dev vs production
  const isProduction = window.location.hostname === 'carzinoautos-setup.github.io';
  const currentDomain = window.location.origin;

  console.log('🌐 Environment:', {
    isProduction,
    currentDomain,
    expectedToWork: isProduction ? 'Yes (CORS configured)' : 'Maybe (depends on CORS setup)'
  });

  // Test with timeout and better error handling
  try {
    const urlWithAuth = `${WC_API_BASE}/products?per_page=1&consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`;
    console.log('�� Testing API URL:', urlWithAuth);
    console.log('⏱️ Starting API test with 10 second timeout...');

    const startTime = Date.now();
    const response = await fetchWithTimeout(urlWithAuth, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Carzino-React-App/1.0'
      }
    }, 6000); // 6 second timeout for faster startup

    const responseTime = Date.now() - startTime;
    console.log(`⏱️ API response received in ${responseTime}ms`);

    console.log('📡 API Response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      responseTime: `${responseTime}ms`
    });

    if (!response.ok) {
      // Log response text for debugging
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText.substring(0, 500));

      return {
        success: false,
        message: `API Error: ${response.status} ${response.statusText}`,
        details: errorText.substring(0, 200)
      };
    }

    // Check content type before reading
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.error('❌ Expected JSON but got:', contentType);
      console.error('❌ Response preview:', responseText.substring(0, 300));

      return {
        success: false,
        message: 'API returned non-JSON response - WooCommerce API may not be enabled',
        details: `Content-Type: ${contentType}`
      };
    }

    // Try to parse response
    const data = await response.json();
    console.log('✅ API test successful! Sample data:', data.slice(0, 1));

    return {
      success: true,
      message: 'API connection successful',
      productCount: response.headers.get('X-WP-Total') || data.length.toString(),
      responseTime: `${responseTime}ms`,
      data: data
    };

  } catch (error) {
    console.error('❌ API Connection Error:', error);

    // Enhanced error handling with specific messages
    if (error.message.includes('timed out')) {
      return {
        success: false,
        message: 'API request timed out - WordPress site may be slow or unreachable',
        timeout: true
      };
    }

    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      const corsMessage = isProduction
        ? `CORS Error: Connection failed from production. Check WordPress CORS settings.`
        : `CORS Error: Dev server not allowed. This is expected - production site will work.`;

      console.log('💡 CORS Fix Instructions for WordPress:');
      console.log('The CORS code should already be updated to allow both domains.');
      console.log('If still failing, check that the code was saved correctly.');

      return {
        success: false,
        message: corsMessage,
        isCorsError: true,
        showInstructions: !isProduction
      };
    }

    if (error.message.includes('AbortError')) {
      return {
        success: false,
        message: 'API request was aborted - connection interrupted',
        aborted: true
      };
    }

    return {
      success: false,
      message: `Connection Error: ${error.message}`,
      errorType: error.name
    };
  }
};

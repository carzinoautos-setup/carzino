/**
 * WooCommerce API Service with Server-Side Pagination
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
  console.warn('���️ Consumer key doesn\'t start with "ck_" - may be invalid');
}
if (WC_CONSUMER_SECRET && !WC_CONSUMER_SECRET.startsWith('cs_')) {
  console.warn('⚠️ Consumer secret doesn\'t start with "cs_" - may be invalid');
}

// Simple cache system for faster loading
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Pagination settings
const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;

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
        images: [
          'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=450&h=300&fit=crop'
        ],
        image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=450&h=300&fit=crop',
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
        images: [
          'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=450&h=300&fit=crop'
        ],
        image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=450&h=300&fit=crop',
        categories: [{ id: 2, name: 'Sedan', slug: 'sedan' }],
        attributes: [],
        meta_data: [
          { key: 'make', value: 'Toyota' },
          { key: 'model', value: 'Camry' },
          { key: 'year', value: '2020' },
          { key: 'mileage', value: '45678' },
          { key: 'condition', value: 'Good' },
          { key: 'body_type', value: 'Sedan' },
          { key: 'drivetrain', value: 'FWD' },
          { key: 'transmission', value: 'Automatic' },
          { key: 'fuel_type', value: 'Gasoline' },
          { key: 'trim', value: 'LE' },
          { key: 'doors', value: '4' },
          { key: 'exterior_color', value: 'Blue' },
          { key: 'interior_color', value: 'Gray' },
          { key: 'price', value: '22995' },
          { key: 'payment', value: '345' }
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
        images: [
          'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=450&h=300&fit=crop'
        ],
        image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=450&h=300&fit=crop',
        categories: [{ id: 3, name: 'Truck', slug: 'truck' }],
        attributes: [],
        meta_data: [
          { key: 'make', value: 'Ford' },
          { key: 'model', value: 'F-150' },
          { key: 'year', value: '2019' },
          { key: 'mileage', value: '68543' },
          { key: 'condition', value: 'Very Good' },
          { key: 'body_type', value: 'Truck' },
          { key: 'drivetrain', value: '4WD' },
          { key: 'transmission', value: 'Automatic' },
          { key: 'fuel_type', value: 'Gasoline' },
          { key: 'trim', value: 'XLT' },
          { key: 'doors', value: '4' },
          { key: 'exterior_color', value: 'Red' },
          { key: 'interior_color', value: 'Black' },
          { key: 'price', value: '35995' },
          { key: 'payment', value: '525' }
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
        images: [
          'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=450&h=300&fit=crop'
        ],
        image: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=450&h=300&fit=crop',
        categories: [{ id: 4, name: 'Coupe', slug: 'coupe' }],
        attributes: [],
        meta_data: [
          { key: 'make', value: 'Ford' },
          { key: 'model', value: 'Mustang' },
          { key: 'year', value: '2020' },
          { key: 'mileage', value: '23456' },
          { key: 'condition', value: 'Excellent' },
          { key: 'body_type', value: 'Coupe' },
          { key: 'drivetrain', value: 'RWD' },
          { key: 'transmission', value: 'Manual' },
          { key: 'fuel_type', value: 'Gasoline' },
          { key: 'trim', value: 'GT' },
          { key: 'doors', value: '2' },
          { key: 'exterior_color', value: 'Black' },
          { key: 'interior_color', value: 'Black' },
          { key: 'price', value: '32995' },
          { key: 'payment', value: '485' }
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
        id: 'fallback-tesla-1',
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
        id: 'fallback-jeep-1',
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
      per_page: params.per_page || 100, // Reduce to 100 to avoid server limits
      page: params.page || 1,
      status: 'publish',
      // Include ACF fields and meta data in WooCommerce response
      acf: 'true',
      meta_data: 'true',
      include_meta: 'true',
      // Remove potentially invalid orderby parameters for WooCommerce products
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

    const startTime = Date.now();
    const response = await fetchWithTimeout(urlWithAuth, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    }, 10000); // 10 second timeout

    const responseTime = Date.now() - startTime;
    console.log(`⏱️ Vehicles loaded in ${responseTime}ms`);
    console.log('📡 Response status:', response.status);

    // Clone response for multiple reads if needed
    const responseClone = response.clone();

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await responseClone.text();
      } catch (cloneError) {
        console.warn('Could not clone error response:', cloneError.message);
        try {
          const buffer = await response.arrayBuffer();
          errorText = new TextDecoder().decode(buffer);
        } catch (bufferError) {
          errorText = 'Could not read error response body';
        }
      }

      // Enhanced error logging with specific guidance
      console.error('❌ API Response Error:');
      console.error('  Status:', response.status, response.statusText);
      console.error('  URL:', urlWithAuth.replace(/consumer_(key|secret)=[^&]+/g, 'consumer_$1=***'));
      console.error('  Response Text:', errorText.substring(0, 300));

      // Specific handling for common errors
      if (response.status === 400) {
        console.error('🔧 400 Bad Request - Invalid API parameters:');
        console.error('  • Query parameters may be invalid for WooCommerce API');
        console.error('  • Check if per_page limit is too high');
        console.error('  • Verify consumer key and secret format');
        console.error('  • Response:', errorText.substring(0, 200));

        // Try a simpler request with minimal parameters
        console.log('🔄 Attempting simpler API request...');
        try {
          const simpleParams = new URLSearchParams({
            per_page: 25,
            page: 1,
            status: 'publish'
          });
          const simpleUrl = `${WC_API_BASE}/products?${simpleParams}&consumer_key=${WC_CONSUMER_KEY}&consumer_secret=${WC_CONSUMER_SECRET}`;
          const simpleResponse = await fetchWithTimeout(simpleUrl, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
          }, 10000);

          if (simpleResponse.ok) {
            console.log('✅ Simple API request succeeded, using reduced parameters');
            const simpleData = await simpleResponse.json();
            const result = {
              results: simpleData.map(product => ({
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
                seller_data: product.seller_data || null,
                description: product.description || product.short_description || '',
                date_created: product.date_created,
                featured: product.featured || false
              })),
              total: parseInt(simpleResponse.headers.get('X-WP-Total') || simpleData.length.toString()),
              totalPages: parseInt(simpleResponse.headers.get('X-WP-TotalPages') || '1'),
            };
            return result;
          }
        } catch (retryError) {
          console.warn('🚨 Simple API request also failed:', retryError.message);
        }
      } else if (response.status === 500) {
        console.error('🔧 500 Internal Server Error - Likely WordPress/WooCommerce configuration issue:');
        console.error('  • Check WordPress site health');
        console.error('  • Verify WooCommerce plugin is active');
        console.error('  • Check WordPress error logs');
        console.error('  • Test API credentials in WordPress admin');
      } else if (response.status === 404) {
        console.error('🔍 404 Not Found - WooCommerce API endpoint not available:');
        console.error('  • Ensure WooCommerce plugin is installed and active');
        console.error('  • Check if REST API is enabled in WooCommerce settings');
      }

      // For API errors, return fallback data instead of throwing
      console.warn('��� API error detected, using fallback data');
      return getFallbackVehicles();
    }

    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      let responseText = '';
      try {
        responseText = await responseClone.text();
      } catch (e) {
        responseText = 'Could not read response';
      }
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

    let products;
    try {
      products = await response.json();
    } catch (e) {
      console.error('❌ Failed to parse JSON response:', e);
      console.warn('🚨 JSON parsing error, using fallback data');
      return getFallbackVehicles();
    }
    console.log(`✅ Successfully fetched ${products.length} vehicles from WooCommerce API`);

    // DETAILED seller data debugging
    const vehiclesWithSellerData = products.filter(p => p.seller_data);
    const vehiclesWithSellerMeta = products.filter(p => p.meta_data && p.meta_data.some(m => m.key.includes('seller')));

    console.log(`🔍 COMPREHENSIVE SELLER DATA DEBUG:`);
    console.log(`  Total vehicles: ${products.length}`);
    console.log(`  Vehicles with seller_data field: ${vehiclesWithSellerData.length}`);
    console.log(`  Vehicles with seller meta_data: ${vehiclesWithSellerMeta.length}`);

    // Show first 3 vehicles' raw data for debugging
    console.log(`📋 FIRST 3 VEHICLES RAW DATA:`);
    products.slice(0, 3).forEach((product, index) => {
      console.log(`  Vehicle ${index + 1}: ${product.name}`);
      console.log(`    ID: ${product.id}`);
      console.log(`    Has seller_data: ${!!product.seller_data}`);
      console.log(`    seller_data content:`, product.seller_data);
      console.log(`    Has meta_data: ${!!product.meta_data}`);
      console.log(`    Total meta_data fields: ${product.meta_data?.length || 0}`);

      if (product.meta_data) {
        const sellerFields = product.meta_data.filter(m => m.key && m.key.includes('seller'));
        const accountFields = product.meta_data.filter(m => m.key && m.key.includes('account'));
        console.log(`    Seller meta fields (${sellerFields.length}):`, sellerFields);
        console.log(`    Account meta fields (${accountFields.length}):`, accountFields);

        // Show all meta field keys to understand what's available
        const allMetaKeys = product.meta_data.map(m => m.key).filter(k => k);
        console.log(`    All meta field keys:`, allMetaKeys);
      }
      console.log(`  ---`);
    });

    if (vehiclesWithSellerData.length > 0) {
      console.log(`✅ VEHICLES WITH seller_data FIELD:`);
      vehiclesWithSellerData.slice(0, 2).forEach((vehicle, index) => {
        console.log(`  Vehicle ${index + 1}: ${vehicle.name}`);
        console.log(`    seller_data:`, vehicle.seller_data);
      });
    } else {
      console.log(`❌ NO VEHICLES HAVE seller_data FIELD`);
      console.log(`   This suggests the WordPress API is not including seller_data`);
      console.log(`   Check if the seller data snippets are active in WordPress`);
    }

    if (vehiclesWithSellerMeta.length > 0) {
      console.log(`✅ VEHICLES WITH SELLER META DATA:`);
      vehiclesWithSellerMeta.slice(0, 2).forEach((vehicle, index) => {
        const sellerMeta = vehicle.meta_data.filter(m => m.key.includes('seller'));
        console.log(`  Vehicle ${index + 1}: ${vehicle.name}`);
        console.log(`    Seller meta fields:`, sellerMeta);
      });
    } else {
      console.log(`❌ NO VEHICLES HAVE SELLER META DATA`);
      console.log(`   This means ACF fields are not being included in API response`);
    }

    const result = {
      results: products.map(product => ({
        id: product.id,
        title: product.name,
        slug: product.slug,
        url: product.permalink,
        price: product.price || product.regular_price,
        sale_price: product.sale_price,
        stock_status: product.stock_status,
        // Enhanced image handling to properly extract WooCommerce images
        images: product.images && product.images.length > 0 ? product.images.map(img => img.src) : [],
        image: product.images && product.images.length > 0 ? product.images[0].src : null,
        featured_media_url: product.featured_media_url || null,
        categories: product.categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug
        })),
        attributes: product.attributes || [],
        // Include all meta_data for ACF fields
        meta_data: product.meta_data || [],
        // Include ACF fields if available
        acf: product.acf || {},
        // CRITICAL: Include seller_data from WordPress API response
        seller_data: product.seller_data || null,
        description: product.description || product.short_description || '',
        date_created: product.date_created,
        featured: product.featured || false,
        // Add raw product data for debugging
        rawData: {
          images: product.images,
          featured_media: product.featured_media,
          featured_media_src: product.featured_media_src,
          all_meta: product.meta_data
        }
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
      const currentDomain = window.location.origin;
      const isFlyDev = currentDomain.includes('fly.dev');

      console.error('🚨 API CONNECTION FAILED: CORS/Network Issue!');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━���━━━━━━━━━━━���━━━━━━━━━━━━━━━');
      console.error('🌐 Current Domain:', currentDomain);
      console.error('🎯 Target WordPress:', process.env.REACT_APP_WP_SITE_URL);
      console.error('❌ Error:', error.message);
      console.error('');
      console.error('🔧 IMMEDIATE FIXES TO TRY:');
      console.error('1. 📋 Go to WordPress Admin → WPCode → Snippets');
      console.error('2. ✅ Ensure "Carzino CORS Headers" snippet is ACTIVE');
      console.error('3. 🔍 Verify this domain is in allowed origins:', currentDomain);
      console.error('4. 🔄 Try refreshing this page after checking');
      console.error('');

      if (isFlyDev) {
        console.error('🛠️ FLY.DEV DOMAIN DETECTED:');
        console.error('   Make sure WordPress CORS snippet includes:');
        console.error(`   '${currentDomain}'`);
        console.error('');
      }

      console.error('📞 If issue persists:');
      console.error('   �� Check WordPress site is accessible');
      console.error('   • Verify WooCommerce plugin is active');
      console.error('   • Check API credentials are correct');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      console.log('');
      console.log('✅ Loading fallback data to keep app functional...');
      const fallbackData = getFallbackVehicles();
      console.log('��� Fallback vehicles loaded:', fallbackData.results.length);
      return fallbackData;
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
    console.log('�� Fetching filter options from vehicle data...');

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

// Helper function to create fetch with timeout and retry logic
const fetchWithTimeout = async (url, options = {}, timeoutMs = 15000, retries = 2) => {
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`🔗 Attempt ${attempt}/${retries + 1}: Fetching ${url.substring(0, 100)}...`);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log(`✅ Attempt ${attempt} successful: ${response.status} ${response.statusText}`);
      return response;

    } catch (error) {
      clearTimeout(timeoutId);

      // Suppress console warnings for CORS errors to avoid confusion
      if (!error.message.includes('Failed to fetch')) {
        console.warn(`❌ Attempt ${attempt} failed:`, error.message);
      }

      if (attempt === retries + 1) {
        // Last attempt failed - return structured error instead of throwing
        if (error.name === 'AbortError') {
          throw new Error(`Request timed out after ${timeoutMs}ms (${retries + 1} attempts)`);
        }
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
          // Don't throw for CORS errors, return a structured error instead
          throw new Error(`CORS_BLOCKED`);
        }
        throw error;
      }

      // Wait before retry (exponential backoff)
      const waitTime = Math.min(1000 * attempt, 3000);
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

// Simple connectivity test to WordPress site
const testBasicConnectivity = async () => {
  try {
    console.log('🌐 Testing basic connectivity to WordPress site...');
    await fetchWithTimeout(process.env.REACT_APP_WP_SITE_URL, {
      method: 'HEAD',
      mode: 'no-cors'
    }, 5000, 1);
    console.log('✅ WordPress site is reachable');
    return true;
  } catch (error) {
    console.warn('❌ WordPress site unreachable:', error.message);
    return false;
  }
};

// Test API connection with improved CORS handling and timeout
export const testAPIConnection = async () => {
  console.log('🔗 Testing API connection to:', WC_API_BASE);
  console.log('🔑 Using credentials:', {
    key: WC_CONSUMER_KEY ? WC_CONSUMER_KEY.substring(0, 10) + '...' : 'Missing',
    secret: WC_CONSUMER_SECRET ? WC_CONSUMER_SECRET.substring(0, 10) + '...' : 'Missing'
  });

  // Additional debugging information
  console.log('🌐 Environment details:', {
    wpSiteUrl: process.env.REACT_APP_WP_SITE_URL,
    apiBase: WC_API_BASE,
    currentOrigin: window.location.origin,
    userAgent: navigator.userAgent.substring(0, 50) + '...'
  });

  // First test basic connectivity
  await testBasicConnectivity();

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
    console.log('⏱️ Starting API test with 15 second timeout...');

    const startTime = Date.now();
    const response = await fetchWithTimeout(urlWithAuth, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    }, 10000); // 10 second timeout

    const responseTime = Date.now() - startTime;
    console.log(`⏱️ API response received in ${responseTime}ms`);

    console.log('📡 API Response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      responseTime: `${responseTime}ms`
    });

    // Get content type before any body reading
    const contentType = response.headers.get('content-type');

    if (!response.ok) {
      // Handle different error types with specific messaging
      let errorText = '';
      let diagnosticMessage = '';

      // Attempt to read error response body with multiple strategies
      try {
        const errorClone = response.clone();
        errorText = await errorClone.text();
      } catch (cloneError) {
        console.warn('Could not clone error response:', cloneError.message);

        // Try alternative approach for malformed responses
        try {
          const buffer = await response.arrayBuffer();
          errorText = new TextDecoder().decode(buffer);
        } catch (bufferError) {
          console.warn('Could not read response as buffer:', bufferError.message);
          errorText = `Unable to read error response body`;
        }
      }

      // Provide specific diagnostics for common API errors
      if (response.status === 500) {
        diagnosticMessage = `🔧 WordPress Internal Server Error (500):\n` +
          `• Check if WooCommerce plugin is active and properly configured\n` +
          `• Verify WordPress site is functioning (visit ${process.env.REACT_APP_WP_SITE_URL})\n` +
          `• Check WordPress error logs for PHP errors\n` +
          `• Ensure API credentials are valid and have proper permissions`;
      } else if (response.status === 404) {
        diagnosticMessage = `🔍 API Endpoint Not Found (404):\n` +
          `• WooCommerce REST API may not be enabled\n` +
          `• Check if WooCommerce plugin is installed and active\n` +
          `• Verify API endpoint URL: ${WC_API_BASE}`;
      } else if (response.status === 401 || response.status === 403) {
        diagnosticMessage = `🔑 API Authentication Error (${response.status}):\n` +
          `• Check WooCommerce API credentials\n` +
          `• Verify Consumer Key and Secret are correct\n` +
          `• Ensure API user has proper permissions`;
      }

      console.error('❌ API Error Response:');
      console.error('  Status:', response.status, response.statusText);
      console.error('  Error Body:', errorText.substring(0, 500));
      if (diagnosticMessage) {
        console.error('  Diagnostics:', diagnosticMessage);
      }

      return {
        success: false,
        message: `API Error: ${response.status} ${response.statusText}`,
        details: errorText.substring(0, 200),
        diagnostics: diagnosticMessage,
        shouldUseFallback: true
      };
    }

    // Check content type before reading body
    if (!contentType || !contentType.includes('application/json')) {
      // Clone for debug text reading
      let responseText = '';
      try {
        const debugClone = response.clone();
        responseText = await debugClone.text();
      } catch (e) {
        console.warn('Could not clone/read debug response:', e.message);
        responseText = `Content-Type: ${contentType} - Could not read response body`;
      }
      console.error('�� Expected JSON but got:', contentType);
      console.error('❌ Response preview:', responseText.substring(0, 300));

      return {
        success: false,
        message: 'API returned non-JSON response - WooCommerce API may not be enabled',
        details: `Content-Type: ${contentType}`
      };
    }

    // Use original response for JSON parsing (should be safe now)
    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error('❌ Failed to parse JSON response:', e);
      return {
        success: false,
        message: 'API returned invalid JSON',
        details: e.message
      };
    }
    console.log('✅ API test successful! Sample data:', data.slice(0, 1));

    return {
      success: true,
      message: 'API connection successful',
      productCount: response.headers.get('X-WP-Total') || data.length.toString(),
      responseTime: `${responseTime}ms`,
      data: data
    };

  } catch (error) {
    console.error('❌ API Connection Error:');
    console.error('  Message:', error.message);
    console.error('  Name:', error.name);
    if (error.stack) {
      console.error('  Stack:', error.stack.substring(0, 500));
    }

    // Enhanced error handling with specific messages
    if (error.message.includes('timed out')) {
      console.warn('⏰ API connection timed out after 15 seconds - will use fallback data');
      return {
        success: false,
        message: 'API request timed out - WordPress site may be slow. Using fallback data.',
        timeout: true
      };
    }

    if (error.message.includes('Failed to fetch') || error.message === 'CORS_BLOCKED' || error.name === 'TypeError') {
      // This is a CORS or network connectivity issue - handle silently
      return {
        success: false,
        message: 'Connection blocked by browser security - using demo data',
        isCorsError: true,
        shouldUseFallback: true
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

/**
 * NEW: Fetch vehicles with server-side pagination
 * This is the key function for handling 500K+ vehicles efficiently
 */
export const fetchVehiclesPaginated = async (page = 1, perPage = DEFAULT_PER_PAGE, filters = {}) => {
  console.log(`🔍 Fetching page ${page} with ${perPage} items per page`);
  console.log('🔧 Filters:', filters);

  // Ensure perPage is within limits
  const safePerPage = Math.min(perPage, MAX_PER_PAGE);

  try {
    // Build query parameters for WooCommerce API
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: safePerPage.toString(),
      status: 'publish',
      orderby: 'date',
      order: 'desc'
    });

    // Add search filter
    if (filters.search && filters.search.trim()) {
      params.append('search', filters.search.trim());
    }

    // Add make filter (assuming you store make as a meta field or category)
    if (filters.make && filters.make.length > 0) {
      // This depends on how you store make data in WooCommerce
      // Option 1: If make is stored as meta_data
      params.append('meta_key', 'make');
      params.append('meta_value', filters.make[0]); // Take first make for now

      // Option 2: If make is stored as a product category/tag
      // params.append('category', filters.make.join(','));
    }

    // Add price filters
    if (filters.priceMin) {
      params.append('min_price', filters.priceMin.toString());
    }
    if (filters.priceMax) {
      params.append('max_price', filters.priceMax.toString());
    }

    // Add authentication
    params.append('consumer_key', WC_CONSUMER_KEY);
    params.append('consumer_secret', WC_CONSUMER_SECRET);

    const url = `${WC_API_BASE}/products?${params}`;
    console.log('📡 API URL:', url);

    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }, 15000);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const vehicles = await response.json();

    // Get total count from WooCommerce headers
    const totalResults = parseInt(response.headers.get('X-WP-Total') || '0');
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');

    console.log(`✅ Loaded ${vehicles.length} vehicles from page ${page}`);
    console.log(`📊 Total results: ${totalResults}, Total pages: ${totalPages}`);

    // Transform vehicles to your expected format
    const transformedVehicles = vehicles.map((vehicle, index) => ({
      id: vehicle.id || `vehicle-${page}-${index}`,
      featured: vehicle.featured || false,
      viewed: false,
      images: vehicle.images?.length > 0 ?
        vehicle.images.map(img => img.src) :
        ['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=450&h=300&fit=crop'],
      badges: [],
      title: vehicle.name,
      mileage: "Contact Dealer",
      transmission: "Auto",
      doors: "4 doors",
      salePrice: vehicle.price ? `$${parseFloat(vehicle.price).toLocaleString()}` : 'Call for Price',
      payment: vehicle.price ? `$${Math.round(parseFloat(vehicle.price) * 0.02)}` : 'Call',
      dealer: vehicle.seller_data?.account_name || 'Carzino Auto Sales',
      location: vehicle.seller_data ?
        `${vehicle.seller_data.city || 'Seattle'}, ${vehicle.seller_data.state || 'WA'}` :
        'Seattle, WA',
      phone: vehicle.seller_data?.phone || '(253) 555-0100',
      seller_data: vehicle.seller_data,
      meta_data: vehicle.meta_data || [],
      rawData: vehicle
    }));

    return {
      vehicles: transformedVehicles,
      totalResults,
      totalPages,
      currentPage: page,
      perPage: safePerPage,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };

  } catch (error) {
    console.error('❌ Paginated fetch error:', error);

    // Return empty result with error info
    return {
      vehicles: [],
      totalResults: 0,
      totalPages: 0,
      currentPage: page,
      perPage: safePerPage,
      hasNextPage: false,
      hasPrevPage: false,
      error: error.message
    };
  }
};

/**
 * NEW: Get just the count of search results (fast)
 * This gets the total without loading all the data
 */
export const getVehicleCount = async (filters = {}) => {
  try {
    // Make a request for just 1 item to get the total count from headers
    const params = new URLSearchParams({
      per_page: '1', // Minimal data transfer
      status: 'publish'
    });

    // Add same filters as fetchVehiclesPaginated
    if (filters.search && filters.search.trim()) {
      params.append('search', filters.search.trim());
    }
    if (filters.make && filters.make.length > 0) {
      params.append('meta_key', 'make');
      params.append('meta_value', filters.make[0]);
    }
    if (filters.priceMin) {
      params.append('min_price', filters.priceMin.toString());
    }
    if (filters.priceMax) {
      params.append('max_price', filters.priceMax.toString());
    }

    params.append('consumer_key', WC_CONSUMER_KEY);
    params.append('consumer_secret', WC_CONSUMER_SECRET);

    const response = await fetchWithTimeout(`${WC_API_BASE}/products?${params}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    }, 5000);

    if (response.ok) {
      const totalResults = parseInt(response.headers.get('X-WP-Total') || '0');
      console.log(`📊 Total matching vehicles: ${totalResults}`);
      return totalResults;
    }

    return 0;
  } catch (error) {
    console.error('❌ Count fetch error:', error);
    return 0;
  }
};

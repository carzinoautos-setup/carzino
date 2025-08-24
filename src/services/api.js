/**
 * WooCommerce API Service
 * Connects to real vehicle inventory data
 */

const WC_API_BASE = `${process.env.REACT_APP_WP_SITE_URL}/wp-json/wc/v3`;
const WC_CONSUMER_KEY = process.env.REACT_APP_WC_CONSUMER_KEY;
const WC_CONSUMER_SECRET = process.env.REACT_APP_WC_CONSUMER_SECRET;

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
      per_page: params.per_page || 20,
      page: params.page || 1,
      status: 'publish',
      ...params
    });

    const response = await fetch(`${WC_API_BASE}/products?${queryParams}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      mode: 'cors', // Explicitly set CORS mode
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const products = await response.json();
    
    return {
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
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    throw error;
  }
};

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
      // Extract data from product attributes
      const attributes = product.attributes || [];
      
      // Look for make in attributes or extract from title
      const makeAttr = attributes.find(attr => 
        attr.name.toLowerCase().includes('make') || 
        attr.name.toLowerCase().includes('brand')
      );
      
      let make = makeAttr?.options?.[0];
      if (!make && product.title) {
        // Extract make from title (first word usually)
        const titleParts = product.title.split(' ');
        if (titleParts.length > 1) {
          make = titleParts[1]; // Skip year, get make
        }
      }
      
      if (make) {
        makes.set(make, (makes.get(make) || 0) + 1);
      }
      
      // Extract year from title (first 4 digits)
      const yearMatch = product.title.match(/(\d{4})/);
      if (yearMatch) {
        const year = yearMatch[1];
        years.set(year, (years.get(year) || 0) + 1);
      }
      
      // Extract model from title (third word usually)
      if (product.title) {
        const titleParts = product.title.split(' ');
        if (titleParts.length > 2) {
          const model = titleParts[2];
          models.set(model, (models.get(model) || 0) + 1);
        }
      }
      
      // Get categories for body types
      product.categories.forEach(cat => {
        if (cat.name !== 'Uncategorized') {
          bodyTypes.set(cat.name, (bodyTypes.get(cat.name) || 0) + 1);
        }
      });
      
      // Default conditions based on stock status
      const condition = product.stock_status === 'instock' ? 'Available' : 'Sold';
      conditions.set(condition, (conditions.get(condition) || 0) + 1);
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
    
    // Return fallback empty data if API fails
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

// Test API connection
export const testAPIConnection = async () => {
  try {
    const response = await fetch(`${WC_API_BASE}/products?per_page=1`, {
      method: 'GET',
      headers: getAuthHeaders(),
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
    return {
      success: false,
      message: `Connection Error: ${error.message}`
    };
  }
};

/**
 * Scalable Vehicle API Service
 * Phase 1: Replace WooCommerce with purpose-built vehicle API
 */

// Configuration for different environments
const API_CONFIG = {
  development: {
    baseUrl: 'http://localhost:3001/api/v1',
    timeout: 10000
  },
  production: {
    baseUrl: 'https://api.carzino.com/v1',
    timeout: 5000
  }
};

class ScalableVehicleAPI {
  constructor() {
    this.config = API_CONFIG[process.env.NODE_ENV] || API_CONFIG.development;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Search vehicles with server-side filtering and pagination
   */
  async searchVehicles(filters = {}, page = 1, perPage = 25) {
    const cacheKey = this.generateCacheKey('search', filters, page, perPage);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('🎯 Cache hit for vehicle search');
        return cached.data;
      }
    }

    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...this.buildFilterParams(filters)
    });

    try {
      const response = await this.fetchWithTimeout(
        `${this.config.baseUrl}/vehicles/search?${params}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error('❌ Vehicle search API error:', error);
      
      // Return fallback data to keep app functional
      return this.getFallbackSearchResults(filters, page, perPage);
    }
  }

  /**
   * Get vehicle details by ID
   */
  async getVehicleById(vehicleId) {
    const cacheKey = `vehicle:${vehicleId}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const response = await this.fetchWithTimeout(
        `${this.config.baseUrl}/vehicles/${vehicleId}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        }
      );

      if (!response.ok) {
        throw new Error(`Vehicle not found: ${vehicleId}`);
      }

      const vehicle = await response.json();
      
      this.cache.set(cacheKey, {
        data: vehicle,
        timestamp: Date.now()
      });

      return vehicle;
    } catch (error) {
      console.error('❌ Get vehicle error:', error);
      throw error;
    }
  }

  /**
   * Get filter options (makes, models, etc.)
   */
  async getFilterOptions(currentFilters = {}) {
    const cacheKey = this.generateCacheKey('filters', currentFilters);
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const params = new URLSearchParams(this.buildFilterParams(currentFilters));
      const response = await this.fetchWithTimeout(
        `${this.config.baseUrl}/vehicles/filter-options?${params}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch filter options');
      }

      const options = await response.json();
      
      this.cache.set(cacheKey, {
        data: options,
        timestamp: Date.now()
      });

      return options;
    } catch (error) {
      console.error('❌ Filter options error:', error);
      return this.getFallbackFilterOptions();
    }
  }

  /**
   * Search suggestions for autocomplete
   */
  async getSearchSuggestions(query) {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const response = await this.fetchWithTimeout(
        `${this.config.baseUrl}/vehicles/suggest?q=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        }
      );

      if (!response.ok) {
        return [];
      }

      const suggestions = await response.json();
      return suggestions.slice(0, 10); // Limit to 10 suggestions
    } catch (error) {
      console.warn('⚠️ Search suggestions error:', error);
      return [];
    }
  }

  /**
   * Report vehicle view for analytics
   */
  async reportVehicleView(vehicleId, userId = null) {
    try {
      // Fire and forget - don't wait for response
      fetch(`${this.config.baseUrl}/vehicles/${vehicleId}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          timestamp: new Date().toISOString(),
          referrer: document.referrer,
          user_agent: navigator.userAgent
        })
      }).catch(() => {}); // Silently ignore errors
    } catch (error) {
      // Analytics failures shouldn't break the app
    }
  }

  // Private helper methods
  
  buildFilterParams(filters) {
    const params = {};
    
    // Handle array filters
    if (filters.make?.length > 0) params.make = filters.make.join(',');
    if (filters.model?.length > 0) params.model = filters.model.join(',');
    if (filters.year?.length > 0) params.year = filters.year.join(',');
    
    // Handle range filters
    if (filters.priceMin) params.price_min = filters.priceMin;
    if (filters.priceMax) params.price_max = filters.priceMax;
    if (filters.mileageMax) params.mileage_max = filters.mileageMax;
    
    // Handle location filters
    if (filters.zipCode) params.zip = filters.zipCode;
    if (filters.radius) params.radius = filters.radius;
    
    // Handle other filters
    if (filters.condition?.length > 0) params.condition = filters.condition.join(',');
    if (filters.bodyType?.length > 0) params.body_type = filters.bodyType.join(',');
    if (filters.fuelType?.length > 0) params.fuel_type = filters.fuelType.join(',');
    
    return params;
  }

  generateCacheKey(...args) {
    return btoa(JSON.stringify(args)).replace(/[^a-zA-Z0-9]/g, '');
  }

  async fetchWithTimeout(url, options, timeout = this.config.timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  getFallbackSearchResults(filters, page, perPage) {
    // Return demo data when API is unavailable
    return {
      vehicles: [
        {
          id: 'demo-1',
          vin: 'DEMO123456789',
          make: 'Toyota',
          model: 'Camry',
          year: 2022,
          price: 25999,
          mileage: 15000,
          images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=450&h=300&fit=crop'],
          dealer: {
            name: 'Demo Dealer',
            location: 'Seattle, WA',
            phone: '(253) 555-0100'
          }
        }
      ],
      pagination: {
        current_page: page,
        per_page: perPage,
        total: 1,
        total_pages: 1
      },
      filters: this.getFallbackFilterOptions()
    };
  }

  getFallbackFilterOptions() {
    return {
      makes: [
        { name: 'Toyota', count: 150 },
        { name: 'Ford', count: 120 },
        { name: 'Honda', count: 100 }
      ],
      models: [
        { name: 'Camry', count: 45 },
        { name: 'F-150', count: 40 },
        { name: 'Civic', count: 35 }
      ],
      years: [
        { name: '2023', count: 50 },
        { name: '2022', count: 75 },
        { name: '2021', count: 90 }
      ]
    };
  }

  // Clear cache when needed
  clearCache() {
    this.cache.clear();
    console.log('🗑️ API cache cleared');
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.cache.size,
      hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0
    };
  }
}

// Export singleton instance
export const vehicleAPI = new ScalableVehicleAPI();
export default vehicleAPI;

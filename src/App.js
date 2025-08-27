import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import './App.css';
import VehicleSearchFilter from './components/VehicleSearchFilter';
import VehicleCardSkeleton from './components/VehicleCardSkeleton';
import LazyVehicleCard from './components/LazyVehicleCard';
import SearchResultsHeader from './components/SearchResultsHeader';
import { fetchVehiclesPaginated, fetchAllFilteredVehicles } from './services/api-paginated';
import ErrorBoundary from './components/ErrorBoundary';
import {
  VehicleGridErrorBoundary,
  FilterErrorBoundary,
  PaginationErrorBoundary,
  VehicleCardErrorBoundary
} from './components/SpecializedErrorBoundaries';
// Removed batch loading import
import { useDebouncedFilters } from './hooks/useDebounce';
import { optimizeChunkLoading } from './utils/bundleAnalyzer';
import BundleAnalysisPanel from './components/BundleAnalysisPanel';
import { performanceMonitor } from './services/performanceMonitor';

// Lazy load heavy components for better performance
const Pagination = lazy(() => import('./components/Pagination'));

// URL parameter helpers
const filtersToURLParams = (filters, page = 1) => {
  try {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (!value ||
          (Array.isArray(value) && value.length === 0) ||
          ['zipCode', 'radius', 'termLength', 'interestRate', 'downPayment'].includes(key)) {
        return;
      }

      // Sanitize key and values
      const safeKey = encodeURIComponent(key);

      if (Array.isArray(value)) {
        value.forEach(item => {
          if (item && item.toString().trim()) {
            const safeValue = encodeURIComponent(item.toString().trim());
            params.append(safeKey, safeValue);
          }
        });
      } else if (value.toString().trim() !== '') {
        const safeValue = encodeURIComponent(value.toString().trim());
        params.set(safeKey, safeValue);
      }
    });

    if (page > 1) {
      params.set('page', page.toString());
    }

    return params.toString();
  } catch (error) {
    console.warn('URL params creation failed:', error);
    return '';
  }
};

const URLParamsToFilters = (searchParams) => {
  try {
    const filters = {
      condition: [],
      make: [],
      model: [],
      trim: [],
      year: [],
      vehicleType: [],
      bodyType: [],
      driveType: [],
      transmission: [],
      transmissionSpeed: [],
      fuelType: [],
      exteriorColor: [],
      interiorColor: [],
      mileage: '',
      sellerType: [],
      dealer: [],
      state: [],
      city: [],
      zipCodeFilter: [],
      priceMin: '',
      priceMax: '',
      paymentMin: '',
      paymentMax: '',
      zipCode: '98498',
      radius: '200',
      termLength: '72',
      interestRate: '8',
      downPayment: '2000'
    };

    for (const [key, value] of searchParams.entries()) {
      // Skip invalid or dangerous parameters
      if (key === 'page' || key === 'reload' || !value || value.length > 100) {
        continue;
      }

      // Skip extremely long numbers (potential attack)
      if (/^\d{10,}$/.test(value)) {
        continue;
      }

      // Decode URI components safely
      let safeKey, safeValue;
      try {
        safeKey = decodeURIComponent(key);
        safeValue = decodeURIComponent(value);
      } catch (decodeError) {
        console.warn('Failed to decode URL parameter:', key, value);
        continue;
      }

      if (filters.hasOwnProperty(safeKey)) {
        if (Array.isArray(filters[safeKey])) {
          if (!filters[safeKey].includes(safeValue)) {
            filters[safeKey].push(safeValue);
          }
        } else {
          filters[safeKey] = safeValue;
        }
      }
    }

    return filters;
  } catch (error) {
    console.warn('Failed to parse URL parameters, using defaults:', error);
    return {
      condition: [],
      make: [],
      model: [],
      trim: [],
      year: [],
      vehicleType: [],
      bodyType: [],
      driveType: [],
      transmission: [],
      transmissionSpeed: [],
      fuelType: [],
      exteriorColor: [],
      interiorColor: [],
      mileage: '',
      sellerType: [],
      dealer: [],
      state: [],
      city: [],
      zipCodeFilter: [],
      priceMin: '',
      priceMax: '',
      paymentMin: '',
      paymentMax: '',
      zipCode: '98498',
      radius: '200',
      termLength: '72',
      interestRate: '8',
      downPayment: '2000'
    };
  }
};

// Demo data functions moved to API service for better organization

function App() {
  // Initialize filters from URL parameters
  const getInitialFilters = () => {
    try {
      const urlParams = new URLSearchParams(window.location.search || '');
      if (urlParams.toString()) {
        return URLParamsToFilters(urlParams);
      }
    } catch (error) {
      console.warn('Failed to parse URL parameters:', error);
    }

    return {
      condition: [],
      make: [],
      model: [],
      trim: [],
      year: [],
      vehicleType: [],
      bodyType: [],
      driveType: [],
      transmission: [],
      transmissionSpeed: [],
      fuelType: [],
      exteriorColor: [],
      interiorColor: [],
      mileage: '',
      sellerType: [],
      dealer: [],
      state: [],
      city: [],
      zipCodeFilter: [],
      priceMin: '',
      priceMax: '',
      paymentMin: '',
      paymentMax: '',
      zipCode: '98498',
      radius: '200',
      termLength: '72',
      interestRate: '8',
      downPayment: '2000'
    };
  };

  // State management with debounced filters
  const initialFilters = getInitialFilters();
  const {
    filters,
    debouncedFilters,
    updateFilter,
    resetFilters,
    forceUpdate: forceUpdateFilters,
    isPending: filtersArePending
  } = useDebouncedFilters(initialFilters, 500, (newFilters) => {
    console.log('🔄 Debounced filters updated:', newFilters);
    debouncedFilterChange(newFilters);
  });

  // Data state
  const [vehicles, setVehicles] = useState([]);
  const [filterOptions, setFilterOptions] = useState({});
  const [fullInventory, setFullInventory] = useState([]); // Store full inventory for accurate filter counts
  const [loading, setLoading] = useState(true);
  const [optimisticLoading, setOptimisticLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiConnected, setApiConnected] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState(Date.now());

  // Caching state for sequential filtering performance
  const [cachedVehicles, setCachedVehicles] = useState(new Map());

  // Page preloading cache for instant pagination
  const [preloadedPages, setPreloadedPages] = useState(new Map());

  const [favorites, setFavorites] = useState({});
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search || '');
      const pageParam = urlParams.get('page');
      const parsedPage = pageParam ? parseInt(pageParam, 10) : 1;
      return (parsedPage > 0 && parsedPage < 10000) ? parsedPage : 1; // Reasonable bounds
    } catch (error) {
      console.warn('Failed to parse page parameter:', error);
      return 1;
    }
  });
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('relevance');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showingFavorites, setShowingFavorites] = useState(false);

  // Bundle analysis state (development only)
  const [showBundleAnalysis, setShowBundleAnalysis] = useState(false);

  // Pagination state
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(19); // 🚀 PERFORMANCE: Show 19 results as requested
  const [searchTime, setSearchTime] = useState(0);

  // Removed batch loading - using standard pagination

  // Update URL when filters or page change
  const updateURL = useCallback((newFilters, page = currentPage) => {
    try {
      const params = filtersToURLParams(newFilters, page);

      // Ensure we have a valid pathname
      const pathname = window.location.pathname || '/';

      // Construct the new URL properly
      const newURL = params ? `${pathname}?${params}` : pathname;

      // Validate the URL before pushing to history
      const currentURL = window.location.pathname + window.location.search;

      if (newURL !== currentURL && newURL.length < 2048) { // URL length limit
        // Use replaceState instead of pushState to avoid history buildup
        window.history.replaceState(null, '', newURL);
      }
    } catch (error) {
      console.warn('URL update failed:', error);
      // Fallback: don't update URL if there's an error
    }
  }, [currentPage]);

  // Helper function to check if we can use cached data for sequential filtering
  const canUseSequentialCache = useCallback((newFilters, currentFilters) => {
    // Check if this is a Ford → Explorer type scenario
    const newMake = newFilters.make || [];
    const currentMake = currentFilters.make || [];
    const newModel = newFilters.model || [];
    const currentModel = currentFilters.model || [];

    // Scenario: User selected Ford, now adding Explorer model
    if (newMake.length === 1 && currentMake.length === 1 &&
        newMake[0] === currentMake[0] && // Same make (Ford)
        newModel.length > currentModel.length) { // Adding model filter

      const cacheKey = `make_${newMake[0]}`;
      return cachedVehicles.has(cacheKey);
    }

    return false;
  }, [cachedVehicles]);

  // Helper function to filter cached vehicles client-side
  const filterCachedVehicles = useCallback((cacheKey, newFilters) => {
    const cached = cachedVehicles.get(cacheKey);
    if (!cached) return null;

    // Apply model filter to cached Ford vehicles
    const filteredVehicles = cached.vehicles.filter(vehicle => {
      if (newFilters.model && newFilters.model.length > 0) {
        const getMeta = (key) => {
          const meta = vehicle.meta_data?.find(m => m.key === key);
          return meta ? meta.value : '';
        };

        const vehicleModel = getMeta('model') || vehicle.title.split(' ')[2];
        return newFilters.model.includes(vehicleModel);
      }
      return true;
    });

    return {
      vehicles: filteredVehicles,
      totalResults: filteredVehicles.length,
      totalPages: Math.ceil(filteredVehicles.length / itemsPerPage),
      currentPage: 1,
      searchTime: 10, // Ultra-fast client-side filtering
      isCached: true
    };
  }, [cachedVehicles, itemsPerPage]);

  // Cache for filter options to avoid expensive recalculations
  const filterOptionsCache = useRef(new Map());

  // Extract filter options from vehicle data with memoization - now uses FULL inventory
  const extractFilterOptions = useCallback((vehicles) => {
    console.log('📊 Calculating filter options from', vehicles.length, 'vehicles (FULL INVENTORY)');

    // DEBUG: Show comprehensive vehicle data structure to identify real field names
    console.log('🔍 COMPREHENSIVE WOOCOMMERCE DATA DEBUGGING:');
    vehicles.slice(0, 3).forEach((vehicle, i) => {
      console.log(`\n=== VEHICLE ${i + 1}: ${vehicle.title} ===`);
      console.log('📋 Meta Data Fields (', vehicle.meta_data?.length || 0, 'total):');
      if (vehicle.meta_data && vehicle.meta_data.length > 0) {
        vehicle.meta_data.forEach((meta, idx) => {
          console.log(`  [${idx}] ${meta.key} = "${meta.value}"`);
        });
      } else {
        console.log('  ❌ NO META DATA FOUND');
      }

      console.log('🏷️ Attributes (', vehicle.attributes?.length || 0, 'total):');
      if (vehicle.attributes && vehicle.attributes.length > 0) {
        vehicle.attributes.forEach((attr, idx) => {
          console.log(`  [${idx}] ${attr.name} = [${attr.options?.join(', ')}]`);
        });
      } else {
        console.log('  ❌ NO ATTRIBUTES FOUND');
      }

      console.log('📂 Categories:', vehicle.categories?.map(c => `${c.name} (${c.slug})`));
      console.log('🆔 Vehicle ID:', vehicle.id);
      console.log('💰 Price:', vehicle.price);
      console.log('📸 Images:', vehicle.images?.length || 0);
    });

    // Show ALL unique meta field keys across all vehicles to understand field naming
    const allMetaKeys = new Set();
    vehicles.forEach(vehicle => {
      vehicle.meta_data?.forEach(meta => {
        if (meta.key) allMetaKeys.add(meta.key);
      });
    });
    console.log('\n🔑 ALL UNIQUE META FIELD KEYS FOUND:');
    console.log(Array.from(allMetaKeys).sort());

    // Create cache key based on vehicle IDs and count
    const cacheKey = vehicles.map(v => v.id).sort().join('-') + '-' + vehicles.length;

    // Return cached result if available
    if (filterOptionsCache.current.has(cacheKey)) {
      console.log('🚀 Using cached filter options');
      return filterOptionsCache.current.get(cacheKey);
    }

    const options = {
      makes: [],
      models: [],
      conditions: [],
      bodyTypes: [],
      drivetrains: [],
      transmissions: [],
      exteriorColors: [],
      interiorColors: [],
      years: [],
      trims: [],
      fuelTypes: []
    };

    const counts = {};

    vehicles.forEach(vehicle => {
      // ENHANCED: Better extraction of make/model/year from both title and meta data
      const title = vehicle.title || '';
      const titleParts = title.split(' ');
      const metaData = vehicle.meta_data || [];

      // Helper to get meta value
      const getMeta = (key) => {
        const meta = metaData.find(m => m.key === key);
        return meta ? meta.value : null;
      };

      // Extract YEAR (prefer meta, fallback to title)
      let year = getMeta('year') || getMeta('_year');
      if (!year && titleParts[0] && !isNaN(titleParts[0]) && titleParts[0].length === 4) {
        year = titleParts[0];
      }
      if (year) {
        counts[`year_${year}`] = (counts[`year_${year}`] || 0) + 1;
      }

      // Extract MAKE (prefer meta, fallback to title)
      let make = getMeta('make') || getMeta('_make');
      if (!make && titleParts[1]) {
        make = titleParts[1];
      }
      if (make && make.trim() !== '') {
        counts[`make_${make}`] = (counts[`make_${make}`] || 0) + 1;
      }

      // Extract MODEL (prefer meta, fallback to title)
      let model = getMeta('model') || getMeta('_model');
      if (!model && titleParts.length > 2) {
        // Get everything after year and make, up to first common words
        const modelParts = titleParts.slice(2);
        const stopWords = ['sedan', 'suv', 'truck', 'coupe', 'wagon', 'hatchback', 'convertible'];
        const modelWords = [];
        for (const word of modelParts) {
          if (stopWords.includes(word.toLowerCase())) break;
          modelWords.push(word);
        }
        model = modelWords.join(' ');
      }
      if (model && model.trim() !== '') {
        counts[`model_${model}`] = (counts[`model_${model}`] || 0) + 1;
      }

      // COMPREHENSIVE field extraction from meta_data with flexible matching
      metaData.forEach(meta => {
        const key = (meta.key || '').toLowerCase();
        const value = meta.value;

        if (value && value.toString().trim() !== '') {
          const cleanValue = value.toString().trim();

          // CONDITION field mapping - cast wider net
          if (key.includes('condition') || key.includes('status') || key === 'vehicle_condition' ||
              key === 'listing_status' || key === 'car_condition') {
            counts[`condition_${cleanValue}`] = (counts[`condition_${cleanValue}`] || 0) + 1;
            console.log(`✅ Found condition: ${key} = ${cleanValue}`);
          }

          // VEHICLE TYPE / BODY TYPE - try multiple patterns
          else if (key.includes('body') || key.includes('type') || key === 'vehicletype' ||
                   key === 'vehicle_type' || key === 'body_style' || key === 'category' ||
                   key === 'car_type' || key === 'auto_type') {
            counts[`bodyType_${cleanValue}`] = (counts[`bodyType_${cleanValue}`] || 0) + 1;
            console.log(`✅ Found body type: ${key} = ${cleanValue}`);
          }

          // DRIVETRAIN / DRIVE TYPE - comprehensive patterns
          else if (key.includes('drive') || key.includes('drivetrain') || key.includes('wheel') ||
                   key === 'drive_type' || key === 'drivetrain_type' || key === 'transmission_type' ||
                   key === 'drive_wheels' || key === 'wheel_drive') {
            counts[`drivetrain_${cleanValue}`] = (counts[`drivetrain_${cleanValue}`] || 0) + 1;
            console.log(`✅ Found drivetrain: ${key} = ${cleanValue}`);
          }

          // TRANSMISSION - various patterns
          else if (key.includes('transmission') || key.includes('gearbox') || key === 'trans_type') {
            counts[`transmission_${cleanValue}`] = (counts[`transmission_${cleanValue}`] || 0) + 1;
            console.log(`✅ Found transmission: ${key} = ${cleanValue}`);
          }

          // EXTERIOR COLOR - multiple patterns
          else if ((key.includes('exterior') && key.includes('color')) || key === 'exterior_color' ||
                   key === 'paint_color' || key === 'car_color' || key === 'vehicle_color' ||
                   key === 'ext_color' || key === 'color_exterior') {
            counts[`exteriorColor_${cleanValue}`] = (counts[`exteriorColor_${cleanValue}`] || 0) + 1;
            console.log(`✅ Found exterior color: ${key} = ${cleanValue}`);
          }

          // INTERIOR COLOR - multiple patterns
          else if ((key.includes('interior') && key.includes('color')) || key === 'interior_color' ||
                   key === 'upholstery_color' || key === 'int_color' || key === 'color_interior') {
            counts[`interiorColor_${cleanValue}`] = (counts[`interiorColor_${cleanValue}`] || 0) + 1;
            console.log(`✅ Found interior color: ${key} = ${cleanValue}`);
          }

          // FUEL TYPE - comprehensive patterns
          else if (key.includes('fuel') || key.includes('engine') || key === 'fuel_type' ||
                   key === 'engine_type' || key === 'power_type' || key.includes('gas')) {
            counts[`fuelType_${cleanValue}`] = (counts[`fuelType_${cleanValue}`] || 0) + 1;
            console.log(`✅ Found fuel type: ${key} = ${cleanValue}`);
          }

          // TRIM LEVEL - various patterns
          else if (key.includes('trim') || key === 'trim_level' || key === 'grade' ||
                   key === 'edition' || key === 'variant' || key === 'trim_name') {
            counts[`trim_${cleanValue}`] = (counts[`trim_${cleanValue}`] || 0) + 1;
            console.log(`✅ Found trim: ${key} = ${cleanValue}`);
          }

          // Log unmatched fields for debugging
          else if (!key.includes('price') && !key.includes('image') && !key.includes('url') &&
                   !key.includes('id') && !key.includes('_') && key.length > 2) {
            console.log(`❓ Unmatched field: ${key} = ${cleanValue}`);
          }
        }
      });

      // Extract from ACF (Advanced Custom Fields) if available
      if (vehicle.acf && typeof vehicle.acf === 'object') {
        Object.entries(vehicle.acf).forEach(([acfKey, acfValue]) => {
          if (acfValue && acfValue.toString().trim() !== '') {
            const key = acfKey.toLowerCase();
            const cleanValue = acfValue.toString().trim();

            console.log(`🔧 ACF Field: ${acfKey} = ${cleanValue}`);

            // Apply same field matching logic to ACF fields
            if (key.includes('condition') || key.includes('status')) {
              counts[`condition_${cleanValue}`] = (counts[`condition_${cleanValue}`] || 0) + 1;
            } else if (key.includes('body') || key.includes('type') || key.includes('category')) {
              counts[`bodyType_${cleanValue}`] = (counts[`bodyType_${cleanValue}`] || 0) + 1;
            } else if (key.includes('drive') || key.includes('drivetrain')) {
              counts[`drivetrain_${cleanValue}`] = (counts[`drivetrain_${cleanValue}`] || 0) + 1;
            } else if (key.includes('transmission')) {
              counts[`transmission_${cleanValue}`] = (counts[`transmission_${cleanValue}`] || 0) + 1;
            } else if (key.includes('fuel')) {
              counts[`fuelType_${cleanValue}`] = (counts[`fuelType_${cleanValue}`] || 0) + 1;
            } else if (key.includes('trim')) {
              counts[`trim_${cleanValue}`] = (counts[`trim_${cleanValue}`] || 0) + 1;
            } else if (key.includes('color')) {
              if (key.includes('exterior')) {
                counts[`exteriorColor_${cleanValue}`] = (counts[`exteriorColor_${cleanValue}`] || 0) + 1;
              } else if (key.includes('interior')) {
                counts[`interiorColor_${cleanValue}`] = (counts[`interiorColor_${cleanValue}`] || 0) + 1;
              }
            }
          }
        });
      }

      // Extract from WooCommerce Attributes
      if (vehicle.attributes && vehicle.attributes.length > 0) {
        vehicle.attributes.forEach(attr => {
          if (attr.options && attr.options.length > 0) {
            const attrName = (attr.name || '').toLowerCase();
            attr.options.forEach(option => {
              if (option && option.toString().trim() !== '') {
                const cleanValue = option.toString().trim();

                console.log(`🏷️ Attribute: ${attr.name} = ${cleanValue}`);

                // Apply field matching to attributes
                if (attrName.includes('condition') || attrName.includes('status')) {
                  counts[`condition_${cleanValue}`] = (counts[`condition_${cleanValue}`] || 0) + 1;
                } else if (attrName.includes('body') || attrName.includes('type') || attrName.includes('category')) {
                  counts[`bodyType_${cleanValue}`] = (counts[`bodyType_${cleanValue}`] || 0) + 1;
                } else if (attrName.includes('drive') || attrName.includes('drivetrain')) {
                  counts[`drivetrain_${cleanValue}`] = (counts[`drivetrain_${cleanValue}`] || 0) + 1;
                } else if (attrName.includes('transmission')) {
                  counts[`transmission_${cleanValue}`] = (counts[`transmission_${cleanValue}`] || 0) + 1;
                } else if (attrName.includes('fuel')) {
                  counts[`fuelType_${cleanValue}`] = (counts[`fuelType_${cleanValue}`] || 0) + 1;
                } else if (attrName.includes('trim')) {
                  counts[`trim_${cleanValue}`] = (counts[`trim_${cleanValue}`] || 0) + 1;
                } else if (attrName.includes('color')) {
                  if (attrName.includes('exterior')) {
                    counts[`exteriorColor_${cleanValue}`] = (counts[`exteriorColor_${cleanValue}`] || 0) + 1;
                  } else if (attrName.includes('interior')) {
                    counts[`interiorColor_${cleanValue}`] = (counts[`interiorColor_${cleanValue}`] || 0) + 1;
                  }
                }
              }
            });
          }
        });
      }

      // Extract from categories for body types
      if (vehicle.categories && vehicle.categories.length > 0) {
        vehicle.categories.forEach(category => {
          if (category.name && category.name !== 'Uncategorized') {
            counts[`bodyType_${category.name}`] = (counts[`bodyType_${category.name}`] || 0) + 1;
            console.log(`📂 Category: ${category.name}`);
          }
        });
      }

      // Add some defaults based on WooCommerce stock status
      if (vehicle.stock_status === 'instock') {
        counts['condition_In Stock'] = (counts['condition_In Stock'] || 0) + 1;
      } else if (vehicle.stock_status === 'outofstock') {
        counts['condition_Sold'] = (counts['condition_Sold'] || 0) + 1;
      }
    });

    // Convert counts to filter options format
    Object.keys(counts).forEach(key => {
      const [category, value] = key.split('_');
      const count = counts[key];

      if (category === 'make') {
        options.makes.push({ name: value, count });
      } else if (category === 'model') {
        options.models.push({ name: value, count });
      } else if (category === 'year') {
        options.years.push({ name: value, count });
      } else if (category === 'condition') {
        options.conditions.push({ name: value, count });
      } else if (category === 'bodyType') {
        options.bodyTypes.push({ name: value, count });
      } else if (category === 'drivetrain') {
        options.drivetrains.push({ name: value, count });
      } else if (category === 'transmission') {
        options.transmissions.push({ name: value, count });
      } else if (category === 'exteriorColor') {
        options.exteriorColors.push({ name: value, count });
      } else if (category === 'interiorColor') {
        options.interiorColors.push({ name: value, count });
      } else if (category === 'fuelType') {
        options.fuelTypes.push({ name: value, count });
      } else if (category === 'trim') {
        options.trims.push({ name: value, count });
      }
    });

    // Sort each category by count (most popular first)
    Object.keys(options).forEach(category => {
      options[category].sort((a, b) => b.count - a.count);
    });

    // DEBUG: Show extracted filter options
    console.log('📊 EXTRACTED FILTER OPTIONS:');
    console.log('  Makes found:', options.makes.length, '→', options.makes.slice(0, 5).map(m => `${m.name} (${m.count})`));
    console.log('  Models found:', options.models.length, '→', options.models.slice(0, 5).map(m => `${m.name} (${m.count})`));
    console.log('  Conditions found:', options.conditions.length, '→', options.conditions.map(c => `${c.name} (${c.count})`));

    // DEBUG: Show what was extracted before any fallbacks
    console.log('📊 EXTRACTION RESULTS BEFORE FALLBACKS:');
    console.log('  Makes extracted:', options.makes.length);
    console.log('  Models extracted:', options.models.length);
    console.log('  Conditions extracted:', options.conditions.length);
    console.log('  Body types extracted:', options.bodyTypes.length);
    console.log('  Drivetrains extracted:', options.drivetrains.length);
    console.log('  Transmissions extracted:', options.transmissions.length);

    // Only add minimal fallbacks if absolutely no data found
    if (options.makes.length === 0 && options.models.length === 0 && options.conditions.length === 0) {
      console.log('⚠️ NO DATA EXTRACTED AT ALL - WooCommerce field mapping failed completely');
      console.log('🔧 This means your WooCommerce products may not have the expected meta fields');

      // Add basic stock status as condition if no other conditions found
      if (options.conditions.length === 0) {
        options.conditions = [
          { name: 'In Stock', count: vehicles.length },
        ];
      }
    }

    // Cache the result for future use
    filterOptionsCache.current.set(cacheKey, options);

    // Limit cache size to prevent memory leaks
    if (filterOptionsCache.current.size > 10) {
      const firstKey = filterOptionsCache.current.keys().next().value;
      filterOptionsCache.current.delete(firstKey);
    }

    console.log('✅ Filter options calculated:', {
      makes: options.makes.length,
      models: options.models.length,
      conditions: options.conditions.length,
      bodyTypes: options.bodyTypes.length,
      fromVehicles: vehicles.length
    });

    return options;
  }, []);

  // Request deduplication map
  const activeRequests = useRef(new Map());

  // Preload next page for instant pagination
  const preloadNextPage = useCallback(async (currentPage, currentFilters) => {
    const nextPage = currentPage + 1;

    // Don't preload if we're already on the last page
    if (nextPage > totalPages) return;

    const preloadKey = `page_${nextPage}_${JSON.stringify(currentFilters)}`;

    // Don't preload if already cached
    if (preloadedPages.has(preloadKey)) {
      console.log(`🚀 Page ${nextPage} already preloaded`);
      return;
    }

    try {
      console.log(`🚀 PRELOADING page ${nextPage} in background...`);
      const preloadedData = await fetchVehiclesPaginated(nextPage, itemsPerPage, currentFilters);

      setPreloadedPages(prev => {
        const updated = new Map(prev);
        updated.set(preloadKey, {
          data: preloadedData,
          timestamp: Date.now()
        });

        // Limit cache size to prevent memory issues
        if (updated.size > 5) {
          const firstKey = updated.keys().next().value;
          updated.delete(firstKey);
        }

        return updated;
      });

      // Preload images for instant display
      preloadedData.vehicles.forEach((vehicle) => {
        const imageUrl = vehicle.images?.[0] || vehicle.image;
        if (imageUrl && !imageUrl.includes('/api/placeholder')) {
          const img = new Image();
          img.src = imageUrl;
        }
      });

      console.log(`✅ Page ${nextPage} preloaded with ${preloadedData.vehicles.length} vehicles`);
    } catch (error) {
      console.warn(`⚠️ Failed to preload page ${nextPage}:`, error.message);
    }
  }, [totalPages, itemsPerPage, preloadedPages]);

  // Fetch full inventory for accurate filter counts (separate from pagination)
  const fetchFullInventoryForFilters = useCallback(async () => {
    try {
      console.log('📊 Fetching FULL inventory for accurate filter counts...');
      const fullVehicles = await fetchAllFilteredVehicles({});

      console.log('🔍 FULL INVENTORY DEBUG:', {
        vehicleCount: fullVehicles.length,
        firstVehicle: fullVehicles[0]?.title,
        hasMetaData: fullVehicles[0]?.meta_data?.length || 0,
        sampleMeta: fullVehicles[0]?.meta_data?.slice(0, 3).map(m => `${m.key}: ${m.value}`)
      });

      setFullInventory(fullVehicles);

      // Calculate filter options from FULL inventory
      const fullFilterOptions = extractFilterOptions(fullVehicles);

      console.log('🎯 SETTING FILTER OPTIONS:', {
        makes: fullFilterOptions.makes.length,
        models: fullFilterOptions.models.length,
        firstMake: fullFilterOptions.makes[0]?.name,
        firstModel: fullFilterOptions.models[0]?.name
      });

      setFilterOptions(fullFilterOptions);

      console.log(`✅ Full inventory loaded: ${fullVehicles.length} vehicles for accurate filter counts`);
    } catch (error) {
      console.warn('⚠️ Could not fetch full inventory for filters:', error.message);

      // Don't override with demo data - let real data extraction work
      console.log('❌ Failed to fetch full inventory, but NOT setting demo data');
      console.log('🔍 This will help us see what real data (if any) is being extracted');

      // Set empty filter options so we can debug the real extraction
      setFilterOptions({
        makes: [],
        models: [],
        conditions: [],
        bodyTypes: [],
        years: [],
        trims: [],
        drivetrains: [],
        transmissions: [],
        exteriorColors: [],
        interiorColors: [],
        fuelTypes: []
      });
    }
  }, [extractFilterOptions]);

  // Function to fetch vehicles with server-side pagination
  const fetchVehiclesPage = useCallback(async (page = currentPage, newFilters = filters) => {
    // Create unique request key for deduplication
    const requestKey = JSON.stringify({ page, filters: newFilters, itemsPerPage });

    // Check if same request is already in progress
    if (activeRequests.current.has(requestKey)) {
      return activeRequests.current.get(requestKey);
    }

    setLoading(true);
    setLoadingStartTime(Date.now());
    setError(null);

    try {
      const startTime = Date.now();

      // 🚀 SMART SEQUENTIAL FILTERING: Check if we can use cached data (Ford → Explorer)
      if (apiConnected && canUseSequentialCache(newFilters, filters)) {
        const makeFilter = newFilters.make[0];
        const cacheKey = `make_${makeFilter}`;
        const cachedResult = filterCachedVehicles(cacheKey, newFilters);

        if (cachedResult) {
          console.log(`⚡ ULTRA-FAST: Using cached ${makeFilter} vehicles for model filtering`);

          // Apply pagination to cached results
          const startIndex = (page - 1) * itemsPerPage;
          const paginatedVehicles = cachedResult.vehicles.slice(startIndex, startIndex + itemsPerPage);

          const fastResult = {
            ...cachedResult,
            vehicles: paginatedVehicles,
            currentPage: page
          };

          // Update state immediately with cached data
          setVehicles(fastResult.vehicles);
          setTotalResults(fastResult.totalResults);
          setTotalPages(fastResult.totalPages);
          setCurrentPage(fastResult.currentPage);
          setSearchTime(fastResult.searchTime);
          setApiConnected(true);
          setError(null);

          updateURL(newFilters, page);
          setLoading(false);

          console.log(`🎯 CACHED RESULT: ${fastResult.vehicles.length} vehicles in ${fastResult.searchTime}ms`);
          return;
        }
      }

      // Create and store request promise for deduplication
      const requestPromise = fetchVehiclesPaginated(page, itemsPerPage, newFilters);
      activeRequests.current.set(requestKey, requestPromise);

      // Regular API call when cache not available with reasonable timeout
      const result = await Promise.race([
        requestPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('API timeout after 20 seconds')), 20000))
      ]);

      // Clean up completed request from deduplication map
      activeRequests.current.delete(requestKey);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (result.error) {
        throw new Error(result.error);
      }

      // Update state with paginated results
      setVehicles(result.vehicles);
      setTotalResults(result.totalResults);
      setTotalPages(result.totalPages);
      setCurrentPage(result.currentPage);
      setSearchTime(result.searchTime || responseTime);

      // Track search performance
      performanceMonitor.trackSearch(
        result.searchTime || responseTime,
        result.totalResults,
        result.isCached || false
      );

      // Batch loading removed - using standard pagination

      // Properly detect if we're using real API data vs demo data
      const isRealAPIData = !result.isDemo;
      setApiConnected(isRealAPIData);
      setError(null);
      setOptimisticLoading(false); // Clear any optimistic loading states

      // 🚀 CRITICAL FIX: Don't update filter options from current page!
      // Filter options should come from FULL inventory, not current page
      // This was the main cause of incorrect filter counts

      // Only update full inventory and filter options on initial load or filter changes
      if (page === 1 || fullInventory.length === 0) {
        fetchFullInventoryForFilters();
      }

      console.log(`🎯 Page ${page}: ${result.vehicles.length} vehicles loaded in ${result.searchTime || responseTime}ms`);
      console.log(`📊 Total inventory: ${result.totalResults.toLocaleString()} vehicles`);

      // 🚀 SMART CACHING: Store make-specific data for Ford → Explorer scenarios
      if (isRealAPIData && newFilters.make && newFilters.make.length === 1 && !newFilters.model?.length) {
        const makeFilter = newFilters.make[0];
        const cacheKey = `make_${makeFilter}`;

        setCachedVehicles(prev => {
          const updated = new Map(prev);
          updated.set(cacheKey, {
            vehicles: result.allVehicles || result.vehicles,
            timestamp: Date.now(),
            totalResults: result.totalResults
          });
          console.log(`💾 CACHED: ${makeFilter} vehicles (${result.totalResults} total)`);
          return updated;
        });
      }

      // Update URL
      updateURL(newFilters, page);

      // 🚀 PRELOAD NEXT PAGE for instant pagination
      if (page < totalPages && !loading) {
        // Small delay to not interfere with current page loading
        setTimeout(() => {
          preloadNextPage(page, newFilters);
        }, 500);
      }

    } catch (error) {
      console.error('❌ Unexpected error in fetchVehiclesPage:', error);
      performanceMonitor.trackError(error, 'fetchVehiclesPage');

      // Clean up failed request from deduplication map
      activeRequests.current.delete(requestKey);

      // Specific handling for timeout errors with retry logic
      if (error.message.includes('timeout')) {
        console.warn('⏰ API TIMEOUT: WooCommerce API is taking too long to respond');
        console.warn('   This is usually due to:');
        console.warn('   • WordPress server being slow or under load');
        console.warn('   • Large inventory taking time to process');
        console.warn('   • Network connectivity issues');

        // Show user-friendly message about the timeout
        setError('API is taking longer than expected. Loading backup data...');

        // Auto-clear the error message and loading states after a few seconds
        setTimeout(() => {
          setError(null);
          setOptimisticLoading(false);
        }, 5000);

        console.warn('   ✅ Loading fallback data to keep app functional...');
      } else {
        console.log('🎯 API failed, loading fallback demo data to keep app functional');

        // Show brief error message for other failures
        setError('Unable to connect to vehicle database. Using demo data.');
        setTimeout(() => {
          setError(null);
          setOptimisticLoading(false);
        }, 3000);
      }

      // Use fallback demo data
      const fallbackData = {
        vehicles: [
          {
            id: 'demo-1',
            title: '2008 Hyundai Elantra GLS',
            images: ['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=450&h=300&fit=crop'],
            price: '$4,995',
            mileage: '120,000',
            transmission: 'Automatic',
            doors: '4',
            salePrice: '$4,995',
            dealer: 'Demo Dealer',
            location: 'Tacoma, WA',
            meta_data: [
              { key: 'make', value: 'Hyundai' },
              { key: 'model', value: 'Elantra' },
              { key: 'year', value: '2008' },
              { key: 'condition', value: 'Used' }
            ]
          },
          {
            id: 'demo-2',
            title: '2021 Ford F-150 XLT',
            images: ['https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=450&h=300&fit=crop'],
            price: '$35,995',
            mileage: '45,000',
            transmission: 'Automatic',
            doors: '4',
            salePrice: '$35,995',
            dealer: 'Demo Dealer',
            location: 'Seattle, WA',
            meta_data: [
              { key: 'make', value: 'Ford' },
              { key: 'model', value: 'F-150' },
              { key: 'year', value: '2021' },
              { key: 'condition', value: 'Used' }
            ]
          },
          {
            id: 'demo-3',
            title: '2020 Toyota Camry LE',
            images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=450&h=300&fit=crop'],
            price: '$22,995',
            mileage: '32,000',
            transmission: 'Automatic',
            doors: '4',
            salePrice: '$22,995',
            dealer: 'Demo Dealer',
            location: 'Bellevue, WA',
            meta_data: [
              { key: 'make', value: 'Toyota' },
              { key: 'model', value: 'Camry' },
              { key: 'year', value: '2020' },
              { key: 'condition', value: 'Used' }
            ]
          }
        ],
        totalResults: 254, // Show realistic count to match your inventory
        totalPages: 14,
        currentPage: page,
        searchTime: 50,
        isDemo: true
      };

      // Update state with fallback data
      setVehicles(fallbackData.vehicles);
      setTotalResults(fallbackData.totalResults);
      setTotalPages(fallbackData.totalPages);
      setCurrentPage(fallbackData.currentPage);
      setSearchTime(fallbackData.searchTime);
      setApiConnected(false); // Show demo mode
      setError(null); // Clear error to avoid error state

      // Don't set demo filter options - let real data extraction show results
      console.log('📊 Not setting demo filter options - will use real data extraction from fallback vehicles');

      console.log('✅ Fallback data loaded - app is functional with demo inventory');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filters, updateURL, canUseSequentialCache, filterCachedVehicles, apiConnected, fullInventory.length, fetchFullInventoryForFilters, totalPages, loading, preloadNextPage]);

  // Handle page changes with preloaded data for instant loading
  const handlePageChange = useCallback((newPage) => {
    console.log(`📄 Page changed to: ${newPage}`);
    const startTime = performance.now();

    const preloadKey = `page_${newPage}_${JSON.stringify(debouncedFilters)}`;
    const preloadedData = preloadedPages.get(preloadKey);

    // Use preloaded data if available for INSTANT page changes
    if (preloadedData && (Date.now() - preloadedData.timestamp < 30000)) {
      console.log(`⚡ INSTANT LOAD: Using preloaded data for page ${newPage}`);

      const data = preloadedData.data;
      setVehicles(data.vehicles);
      setTotalResults(data.totalResults);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
      setSearchTime(data.searchTime || 1); // Show as very fast
      setError(null);

      updateURL(debouncedFilters, newPage);

      // Remove used preloaded data to save memory
      setPreloadedPages(prev => {
        const updated = new Map(prev);
        updated.delete(preloadKey);
        return updated;
      });

      // Preload the NEXT page now
      setTimeout(() => {
        preloadNextPage(newPage, debouncedFilters);
      }, 100);

    } else {
      // Fallback to regular loading if no preloaded data
      console.log(`🔄 Regular load for page ${newPage} (no preloaded data)`);
      setCurrentPage(newPage);
      fetchVehiclesPage(newPage, debouncedFilters);
    }

    // Smooth scroll to results
    const resultsElement = document.querySelector('.vehicle-grid');
    if (resultsElement) {
      resultsElement.scrollIntoView({ behavior: 'smooth' });
    }

    // Track page change performance
    const endTime = performance.now();
    performanceMonitor.trackPageChange(newPage, endTime - startTime);
  }, [debouncedFilters, fetchVehiclesPage, preloadedPages, updateURL, preloadNextPage]);

  // Debounced filter handler to prevent rapid API calls
  const debouncedFilterChange = useCallback((newFilters) => {
    setCurrentPage(1);
    fetchVehiclesPage(1, newFilters);
  }, [fetchVehiclesPage]);

  // Handle individual filter changes (for text inputs, etc.)
  const handleSingleFilterChange = useCallback((key, value, immediate = false) => {
    console.log(`🔄 Single filter changed: ${key} = ${value} (immediate: ${immediate})`);

    // Track filter change
    performanceMonitor.trackFilterChange(key, value);

    // Show optimistic loading for text inputs only
    if (!immediate && ['priceMin', 'priceMax', 'paymentMin', 'paymentMax', 'zipCode', 'interestRate', 'downPayment'].includes(key)) {
      setOptimisticLoading(true);
    }

    // Update filter using debounced system
    updateFilter(key, value, immediate);
  }, [updateFilter]);

  // Handle complete filter object changes (from VehicleSearchFilter)
  const handleFilterChange = useCallback((newFilters) => {
    console.log('🔄 Complete filter object changed:', newFilters);

    // Find what changed and track it
    const oldFilters = filters;
    Object.keys(newFilters).forEach(key => {
      if (JSON.stringify(oldFilters[key]) !== JSON.stringify(newFilters[key])) {
        console.log(`  Changed: ${key} from`, oldFilters[key], 'to', newFilters[key]);
        performanceMonitor.trackFilterChange(key, newFilters[key]);
      }
    });

    // Force update all filters immediately
    Object.keys(newFilters).forEach(key => {
      updateFilter(key, newFilters[key], true);
    });
  }, [filters, updateFilter]);

  // Handle sort changes
  const handleSortChange = useCallback((newSortBy) => {
    console.log(`🔄 Sort changed to: ${newSortBy}`);
    setSortBy(newSortBy);
    setCurrentPage(1);
    fetchVehiclesPage(1, debouncedFilters);
  }, [debouncedFilters, fetchVehiclesPage]);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    console.log(`📋 Items per page changed to: ${newItemsPerPage}`);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    fetchVehiclesPage(1, debouncedFilters);
  }, [debouncedFilters, fetchVehiclesPage]);

  // Initial data load and bundle optimization
  useEffect(() => {
    console.log('🚀 App initialized - loading first page and full inventory for filters');

    // Clear cache to force fresh data with new image extraction
    const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('carzino_'));
    cacheKeys.forEach(key => {
      console.log(`🗑️ Clearing cache key: ${key}`);
      localStorage.removeItem(key);
    });

    // Add fallback timer - if loading takes too long, load demo data
    const fallbackTimer = setTimeout(() => {
      if (loading && vehicles.length === 0) {
        console.log('⏰ API taking longer than expected, switching to demo data for better UX');
        setLoading(false);
        setApiConnected(false);

        // Load demo data immediately
        const demoVehicles = [
          {
            id: 'demo-1',
            title: '2008 Hyundai Elantra GLS',
            images: ['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=450&h=300&fit=crop'],
            price: '$4,995',
            mileage: '120,000',
            transmission: 'Automatic',
            doors: '4',
            salePrice: '$4,995',
            dealer: 'Demo Dealer',
            location: 'Tacoma, WA',
            meta_data: [
              { key: 'make', value: 'Hyundai' },
              { key: 'model', value: 'Elantra' },
              { key: 'year', value: '2008' },
              { key: 'condition', value: 'Used' }
            ]
          },
          {
            id: 'demo-2',
            title: '2021 Ford F-150 XLT',
            images: ['https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=450&h=300&fit=crop'],
            price: '$35,995',
            mileage: '45,000',
            transmission: 'Automatic',
            doors: '4',
            salePrice: '$35,995',
            dealer: 'Demo Dealer',
            location: 'Seattle, WA',
            meta_data: [
              { key: 'make', value: 'Ford' },
              { key: 'model', value: 'F-150' },
              { key: 'year', value: '2021' },
              { key: 'condition', value: 'Used' }
            ]
          },
          {
            id: 'demo-3',
            title: '2020 Toyota Camry LE',
            images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=450&h=300&fit=crop'],
            price: '$22,995',
            mileage: '32,000',
            transmission: 'Automatic',
            doors: '4',
            salePrice: '$22,995',
            dealer: 'Demo Dealer',
            location: 'Bellevue, WA',
            meta_data: [
              { key: 'make', value: 'Toyota' },
              { key: 'model', value: 'Camry' },
              { key: 'year', value: '2020' },
              { key: 'condition', value: 'Used' }
            ]
          }
        ];

        setVehicles(demoVehicles);
        setTotalResults(254);
        setTotalPages(14);
        setSearchTime(50);

        // Extract filter options from demo vehicles using the same logic
        const demoFilterOptions = extractFilterOptions(demoVehicles);
        setFilterOptions(demoFilterOptions);

        console.log('📊 Using extracted filter options from demo vehicles:', demoFilterOptions);

        console.log('✅ Demo data loaded due to timeout');
      }
    }, 8000); // 8 second fallback timer - balance between UX and giving API time

    fetchVehiclesPage(currentPage, debouncedFilters).finally(() => {
      clearTimeout(fallbackTimer);
    });
    // Note: fetchFullInventoryForFilters is called within fetchVehiclesPage for page 1

    // Optimize chunk loading for better performance
    optimizeChunkLoading();

    // Start performance monitoring in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Performance monitoring started');
      // Log bundle info periodically in development
      setTimeout(() => {
        const { logBundleInfo } = require('./utils/bundleAnalyzer');
        logBundleInfo();
      }, 5000);
    }

    // Cleanup fallback timer on unmount
    return () => clearTimeout(fallbackTimer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      try {
        const urlParams = new URLSearchParams(window.location.search || '');
        const newFilters = URLParamsToFilters(urlParams);
        const pageParam = urlParams.get('page') || '1';
        const newPage = parseInt(pageParam, 10);
        const safePage = (newPage > 0 && newPage < 10000) ? newPage : 1;

        forceUpdateFilters(newFilters); // Force immediate update for navigation
        setCurrentPage(safePage);
        fetchVehiclesPage(safePage, newFilters);
      } catch (error) {
        console.warn('Failed to handle browser navigation:', error);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [fetchVehiclesPage, forceUpdateFilters]);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Toggle favorites
  const toggleFavorite = (vehicleId, vehicle) => {
    setFavorites(prev => ({
      ...prev,
      [vehicleId]: !prev[vehicleId]
    }));
  };

  // Calculate display metrics
  const startResult = totalResults > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endResult = Math.min(currentPage * itemsPerPage, totalResults);

  // Handle favorites toggle
  const handleToggleFavorites = () => {
    setShowingFavorites(!showingFavorites);
    if (!showingFavorites) {
      const favoriteVehicles = vehicles.filter(v => favorites[v.id]);
      setVehicles(favoriteVehicles);
    } else {
      fetchVehiclesPage(currentPage, debouncedFilters);
    }
  };

  return (
    <ErrorBoundary
      level="app"
      onReset={() => {
        // Complete app reset
        const initial = getInitialFilters();
        resetFilters(initial);
        setVehicles([]);
        setCachedVehicles(new Map());
        setPreloadedPages(new Map());
        setCurrentPage(1);
        setError(null);
        fetchVehiclesPage(1, initial);
      }}
    >
      <div className="App">
        <header className="app-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <h1>Carzino Vehicle Search</h1>
          </div>
          <div className="connection-status">
            {loading ? (
              <div>
                <p>🔄 Loading vehicles...</p>
                {/* Show progressive loading messages based on time elapsed */}
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  {(() => {
                    const elapsed = Date.now() - loadingStartTime;
                    if (elapsed > 15000) {
                      return '⏳ WooCommerce is responding slowly, please wait...';
                    } else if (elapsed > 8000) {
                      return '🔗 Connecting to vehicle database...';
                    } else if (elapsed > 3000) {
                      return '📡 Fetching from WooCommerce API...';
                    }
                    return '';
                  })()}
                </div>
              </div>
            ) : error ? (
              <p className="error">❌ {error}</p>
            ) : (
              <div className="status-info">
                <p>{apiConnected ? '✅ Connected to WooCommerce inventory' : '🎯 Demo Mode - WooCommerce API unreachable'} ({totalResults.toLocaleString()} {apiConnected ? 'vehicles' : 'sample vehicles'})</p>
                <div className="search-stats">
                  <span>📄 Showing {startResult.toLocaleString()}-{endResult.toLocaleString()}</span>
                  <span>⏱️ Search: {searchTime}ms{searchTime < 50 ? ' ⚡ CACHED' : ''}</span>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="main-container">
          {/* Search and Filter Section - Sidebar */}
          <FilterErrorBoundary
          onRetry={() => fetchVehiclesPage(currentPage, debouncedFilters)}
          onReset={() => {
            const initial = getInitialFilters();
            resetFilters(initial);
            fetchVehiclesPage(1, initial);
          }}
        >
            <VehicleSearchFilter
              filters={filters}
              onFiltersChange={handleFilterChange}
              loading={loading}
              filterOptions={filterOptions}
              isOpen={isMobileFiltersOpen}
              onClose={isMobile ? () => setIsMobileFiltersOpen(false) : null}
              isMobile={isMobile}
            />

            {/* DEBUG: Filter status for testing */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{
                position: 'fixed',
                bottom: '10px',
                left: '10px',
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '10px',
                borderRadius: '5px',
                fontSize: '12px',
                maxWidth: '300px',
                zIndex: 1000
              }}>
                <div><strong>🔧 Filter Debug:</strong></div>
                <div>API Connected: {apiConnected ? '✅ Yes' : '❌ No'}</div>
                <div>Filter Options Available: {Object.keys(filterOptions).length}</div>
                <div>Makes Available: {filterOptions.makes?.length || 0}</div>
                <div>Active Filters: {JSON.stringify(filters, null, 1)}</div>
              </div>
            )}
          </FilterErrorBoundary>


          {/* Main Content Area */}
          <div className="main-content">

            {/* 🚀 Fast Loading Indicator for Filter Updates */}
          {(optimisticLoading || filtersArePending) && (
            <div style={{
              position: 'fixed',
              top: '10px',
              right: '10px',
              background: filtersArePending ? 'rgba(59, 130, 246, 0.9)' : 'rgba(34, 197, 94, 0.9)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '500',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
              animation: 'pulse 1s infinite'
            }}>
              {filtersArePending ? '⏳ Processing filters...' : '⚡ Updating filters...'}
            </div>
          )}
            {/* Results Header with Sort and View Options */}
            <SearchResultsHeader
            totalResults={totalResults}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            startResult={startResult}
            endResult={endResult}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            searchTime={optimisticLoading || filtersArePending ? 'Updating...' : (searchTime < 100 && searchTime > 0 ? `${searchTime}ms ⚡ CACHED` : searchTime)}
            currentFilters={debouncedFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onMobileFiltersOpen={isMobile ? () => setIsMobileFiltersOpen(true) : null}
            favoritesCount={Object.values(favorites).filter(Boolean).length}
            showingFavorites={showingFavorites}
            onToggleFavorites={handleToggleFavorites}
            isMobile={isMobile}
            mobileFiltersOpen={isMobileFiltersOpen}
          />

            {/* Vehicle Grid */}
            <VehicleGridErrorBoundary
            onRetry={() => fetchVehiclesPage(currentPage, debouncedFilters)}
            onReset={() => {
              // Clear cache and reset to first page
              setCachedVehicles(new Map());
              setPreloadedPages(new Map());
              fetchVehiclesPage(1, debouncedFilters);
            }}
          >
              {loading ? (
                <div className={`vehicle-grid ${viewMode}-view p-2`}>
                  {Array.from({ length: itemsPerPage }, (_, index) => (
                    <VehicleCardSkeleton key={`skeleton-${index}`} />
                  ))}
                </div>
              ) : error ? (
                <div className="error-container">
                  <p>Error loading vehicles: {error}</p>
                  <button onClick={() => fetchVehiclesPage(currentPage, debouncedFilters)}>Try Again</button>
                </div>
              ) : vehicles.length === 0 ? (
                <div className="no-results" style={isMobile ? {paddingLeft: '20px', paddingRight: '20px'} : {}}>
                  <h3>No vehicles found</h3>
                  <p>Try adjusting your search filters</p>
                </div>
              ) : (
                <div className={`vehicle-grid ${viewMode}-view p-2`}>
                  {vehicles.map((vehicle, index) => (
                    <VehicleCardErrorBoundary
                      key={`boundary-${vehicle.id}-${currentPage}-${index}`}
                      vehicleId={vehicle.id}
                    >
                      <LazyVehicleCard
                        key={`${vehicle.id}-${currentPage}-${index}`}
                        vehicle={vehicle}
                        favorites={favorites}
                        onFavoriteToggle={toggleFavorite}
                        index={index}
                        priority={index < 3} // First 3 cards load immediately
                      />
                    </VehicleCardErrorBoundary>
                  ))}
                </div>
              )}
            </VehicleGridErrorBoundary>

            {/* Pagination */}
            {totalPages > 1 && (
              <PaginationErrorBoundary onRetry={() => fetchVehiclesPage(currentPage, debouncedFilters)}>
                <Suspense fallback={<div className="flex justify-center py-4"><div className="loading-spinner"></div></div>}>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalResults={totalResults}
                    resultsPerPage={itemsPerPage}
                    onPageChange={handlePageChange}
                  />
                </Suspense>
              </PaginationErrorBoundary>
            )}
          </div>
        </div>
      </div>

      {/* Bundle Analysis Panel (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <BundleAnalysisPanel
            isVisible={showBundleAnalysis}
            onClose={() => setShowBundleAnalysis(false)}
          />

        </>
      )}
    </ErrorBoundary>
  );
}

export default App;

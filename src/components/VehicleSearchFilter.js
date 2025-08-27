import React, { useState, memo, useCallback, useMemo, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

// ============================================
// STYLES
// ============================================
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Albert+Sans:wght@300;400;500;600;700;800&display=swap');

  .carzino-filter-container {
    font-family: 'Albert Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  /* Typography Classes */
  .carzino-filter-title { 
    font-size: 16px !important; 
    font-weight: 600 !important; 
  }
  
  .carzino-filter-option { 
    font-size: 14px !important; 
    font-weight: 400 !important; 
  }
  
  .carzino-filter-count { 
    font-size: 14px !important; 
    font-weight: 400 !important; 
    color: #6B7280 !important; 
  }
  
  .carzino-search-input { 
    font-size: 14px !important; 
    font-weight: 400 !important; 
  }
  
  .carzino-location-label { 
    font-size: 14px !important; 
    font-weight: 500 !important; 
  }
  
  .carzino-dropdown-option { 
    font-size: 14px !important; 
    font-weight: 400 !important; 
  }
  
  .carzino-vehicle-type-name { 
    font-size: 12px !important; 
    font-weight: 500 !important; 
  }
  
  .carzino-vehicle-type-count { 
    font-size: 11px !important; 
    font-weight: 400 !important; 
    color: #6B7280 !important; 
  }
  
  .carzino-show-more { 
    font-size: 14px !important; 
    font-weight: 500 !important; 
  }

  /* Mobile Typography */
  @media (max-width: 640px) {
    .carzino-filter-title { font-size: 18px !important; }
    .carzino-filter-option { font-size: 16px !important; }
    .carzino-filter-count { font-size: 16px !important; }
    .carzino-search-input { font-size: 16px !important; }
    .carzino-location-label { font-size: 16px !important; }
    .carzino-dropdown-option { font-size: 16px !important; }
    .carzino-vehicle-type-name { font-size: 14px !important; }
    .carzino-vehicle-type-count { font-size: 13px !important; }
    .carzino-show-more { font-size: 16px !important; }
  }

  /* Custom Checkbox */
  .carzino-checkbox {
    appearance: none;
    width: 16px;
    height: 16px;
    border: 1px solid #d1d5db;
    border-radius: 3px;
    background-color: white;
    position: relative;
    cursor: pointer;
    transition: all 150ms ease;
    flex-shrink: 0;
  }
  
  .carzino-checkbox:hover {
    border-color: #6b7280;
    background-color: #f9fafb;
  }
  
  .carzino-checkbox:checked {
    background-color: #dc2626;
    border-color: #dc2626;
  }
  
  .carzino-checkbox:checked::after {
    content: '✓';
    position: absolute;
    color: white;
    font-size: 12px;
    top: -2px;
    left: 2px;
  }

  .carzino-checkbox:focus {
    outline: 2px solid #dc2626;
    outline-offset: 2px;
  }

  /* Inputs and Selects */
  .carzino-input,
  .carzino-select {
    transition: all 150ms ease;
  }

  .carzino-input:focus,
  .carzino-select:focus {
    outline: none;
    border-color: #dc2626;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
  }

  /* Applied Filter Pills */
  .carzino-filter-pill {
    background-color: #000000;
    color: #ffffff;
    border-radius: 9999px;
    font-size: 12px;
    padding: 4px 10px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  /* Mobile specific */
  @media (max-width: 640px) {
    .carzino-filter-pill {
      font-size: 12px;
      padding: 6px 12px;
    }
  }

  /* Animations */
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-slide-down {
    animation: slideDown 200ms ease-out;
  }
`;

// ============================================
// FILTER SECTION COMPONENTS
// ============================================

const FilterSection = memo(({ title, isCollapsed, onToggle, children, count, isMobile = false }) => {
  return (
    <div className={`border-b border-gray-200 mb-4 ${isMobile ? 'pb-4' : 'pb-3'}`}>
      <div
        className={`flex items-center justify-between cursor-pointer hover:bg-gray-50 px-2 -mx-2 rounded-lg ${isMobile ? 'py-4' : 'py-2'}`}
        onClick={onToggle}
      >
        <h3 className={`font-semibold pointer-events-none ${isMobile ? 'text-lg' : 'text-base'}`}>{title}</h3>
        <div className="flex items-center gap-2 pointer-events-none">
          <ChevronDown
            className={`text-red-600 transition-transform ${isMobile ? 'w-6 h-6' : 'w-5 h-5'} ${
              !isCollapsed ? 'rotate-180' : ''
            }`}
            style={{ color: '#dc2626' }}
          />
        </div>
      </div>
      {!isCollapsed && (
        <div className={`animate-slide-down ${isMobile ? 'mt-3' : 'mt-2'}`} onClick={(e) => e.stopPropagation()}>
          {children}
        </div>
      )}
    </div>
  );
});

const CheckboxOption = memo(({
  label,
  count,
  checked,
  onChange,
  value,
  category,
  isMobile = false
}) => {
  return (
    <label className={`flex items-center hover:bg-gray-50 rounded-lg cursor-pointer transition-colors ${isMobile ? 'p-3' : 'p-1'}`}>
      <input
        type="checkbox"
        className={`carzino-checkbox ${isMobile ? 'mr-3' : 'mr-2'}`}
        checked={checked}
        onChange={(e) => onChange(category, value, e.target.checked)}
      />
      <span className={`flex-1 ${isMobile ? 'text-lg' : 'text-sm'}`}>{label}</span>
      {count !== undefined && (
        <span className={`ml-2 text-gray-500 ${isMobile ? 'text-base' : 'text-sm'}`}>({count.toLocaleString()})</span>
      )}
    </label>
  );
});

const PriceRangeInput = memo(({ min, max, onMinChange, onMaxChange }) => {
  const [localMin, setLocalMin] = useState(min || '');
  const [localMax, setLocalMax] = useState(max || '');

  const handleMinBlur = useCallback(() => {
    onMinChange(localMin);
  }, [localMin, onMinChange]);

  const handleMaxBlur = useCallback(() => {
    onMaxChange(localMax);
  }, [localMax, onMaxChange]);

  return (
    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="$10,000"
          value={localMin}
          onChange={(e) => setLocalMin(e.target.value.replace(/[^0-9]/g, ''))}
          onBlur={handleMinBlur}
          className="carzino-search-input carzino-input w-1/2 px-2 py-2 border border-gray-300 rounded focus:outline-none"
        />
        <input
          type="text"
          placeholder="$100,000"
          value={localMax}
          onChange={(e) => setLocalMax(e.target.value.replace(/[^0-9]/g, ''))}
          onBlur={handleMaxBlur}
          className="carzino-search-input carzino-input w-1/2 px-2 py-2 border border-gray-300 rounded focus:outline-none"
        />
      </div>
    </div>
  );
});

const PaymentCalculator = memo(({ filters, onChange }) => {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
          <input
            type="text"
            placeholder="100"
            value={filters.paymentMin || ''}
            onChange={(e) => onChange('paymentMin', e.target.value.replace(/[^0-9]/g, ''), true)}
            className="carzino-search-input carzino-input w-full pl-6 pr-8 py-2 border border-gray-300 rounded focus:outline-none"
          />
          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">/mo</span>
        </div>
        <div className="relative flex-1">
          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
          <input
            type="text"
            placeholder="2,000"
            value={filters.paymentMax || ''}
            onChange={(e) => onChange('paymentMax', e.target.value.replace(/[^0-9]/g, ''), true)}
            className="carzino-search-input carzino-input w-full pl-6 pr-8 py-2 border border-gray-300 rounded focus:outline-none"
          />
          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">/mo</span>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Term Length
        </label>
        <select
          value={filters.termLength || '72'}
          onChange={(e) => onChange('termLength', e.target.value, true)}
          className="carzino-select w-full px-2 py-2 border border-gray-300 rounded focus:outline-none"
        >
          <option value="36">36 months</option>
          <option value="48">48 months</option>
          <option value="60">60 months</option>
          <option value="72">72 months</option>
          <option value="84">84 months</option>
        </select>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Interest Rate
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="8"
              value={filters.interestRate || ''}
              onChange={(e) => onChange('interestRate', e.target.value.replace(/[^0-9.]/g, ''), true)}
              className="carzino-search-input carzino-input w-full pr-6 px-2 py-2 border border-gray-300 rounded focus:outline-none"
            />
            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">%</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Down Payment
          </label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
            <input
              type="text"
              placeholder="2,000"
              value={filters.downPayment || ''}
              onChange={(e) => onChange('downPayment', e.target.value.replace(/[^0-9]/g, ''), true)}
              className="carzino-search-input carzino-input w-full pl-6 px-2 py-2 border border-gray-300 rounded focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

const ColorSwatch = memo(({ color, name, count, checked, onChange, category }) => (
  <label className="flex items-center text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
    <input 
      type="checkbox" 
      className="carzino-checkbox mr-2"
      checked={checked}
      onChange={(e) => onChange(category, name, e.target.checked)}
    />
    <div 
      className="w-4 h-4 rounded border border-gray-300 mr-2" 
      style={{ backgroundColor: color }}
    />
    <span className="carzino-filter-option flex-1">{name}</span>
    <span className="carzino-filter-count ml-1">({count.toLocaleString()})</span>
  </label>
));

// ============================================
// MAIN FILTER COMPONENT
// ============================================

const VehicleSearchFilter = ({ 
  filters = {},
  onFiltersChange,
  filterOptions = {},
  isLoading = false,
  isMobile = false,
  isOpen = false,
  onClose
}) => {
  // Lock body scroll when mobile filter is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isMobile, isOpen]);

  // Local state
  const [showMoreMakes, setShowMoreMakes] = useState(false);
  const [showMoreModels, setShowMoreModels] = useState(false);
  const [showMoreTrims, setShowMoreTrims] = useState(false);
  
  // Collapsed sections state
  const [collapsedFilters, setCollapsedFilters] = useState({
    vehicleType: true,
    condition: false,
    mileage: true,
    make: false,
    model: false,
    trim: true,
    price: true,
    payment: true,
    bodyType: true,
    driveType: true,
    transmissionSpeed: true,
    exteriorColor: true,
    interiorColor: true,
    fuelType: true,
    year: true,
    sellerType: true,
    dealer: true,
    state: true,
    city: true,
    zipCodeFilter: true
  });

  // Toggle filter section
  const toggleFilter = useCallback((filterName) => {
    setCollapsedFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((category, value, checked) => {
    const currentValues = filters[category] || [];
    
    if (category === 'condition' || category === 'make' || category === 'model' || category === 'trim' || 
        category === 'vehicleType' || category === 'bodyType' || category === 'driveType' || category === 'exteriorColor' || 
        category === 'interiorColor' || category === 'sellerType' || category === 'dealer' || category === 'state' || category === 'city' || 
        category === 'zipCodeFilter' || category === 'transmissionSpeed' || category === 'transmission' || category === 'year' || category === 'fuelType') {
      // Array-based filters
      let newValues;
      if (checked) {
        newValues = [...currentValues, value];
      } else {
        newValues = currentValues.filter(v => v !== value);
      }
      onFiltersChange({
        ...filters,
        [category]: newValues
      });
    } else {
      // Single value filters
      onFiltersChange({
        ...filters,
        [category]: checked ? value : ''
      });
    }
  }, [filters, onFiltersChange]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    onFiltersChange({
      condition: [],
      make: [],
      model: [],
      trim: [],
      year: [],
      vehicleType: [],
      bodyType: [],
      driveType: [],
      mileage: '',
      exteriorColor: [],
      interiorColor: [],
      transmissionSpeed: [],
      fuelType: [],
      sellerType: [],
      dealer: [],
      state: [],
      city: [],
      zipCodeFilter: [],
      priceMin: '',
      priceMax: '',
      paymentMin: '',
      paymentMax: '',
      zipCode: filters.zipCode || '98498',
      radius: filters.radius || '200',
      termLength: filters.termLength || '72',
      interestRate: filters.interestRate || '8',
      downPayment: filters.downPayment || '2000'
    });
  }, [onFiltersChange, filters]);

  // Remove specific filter
  const removeAppliedFilter = useCallback((category, value) => {
    if (category === 'priceMin' || category === 'priceMax') {
      onFiltersChange({
        ...filters,
        priceMin: '',
        priceMax: ''
      });
    } else if (category === 'paymentMin' || category === 'paymentMax') {
      onFiltersChange({
        ...filters,
        paymentMin: '',
        paymentMax: ''
      });
    } else if (category === 'mileage') {
      onFiltersChange({
        ...filters,
        mileage: ''
      });
    } else if (Array.isArray(filters[category])) {
      onFiltersChange({
        ...filters,
        [category]: filters[category].filter(v => v !== value)
      });
    } else {
      const newFilters = { ...filters };
      newFilters[category] = '';
      onFiltersChange(newFilters);
    }
  }, [filters, onFiltersChange]);

  // Get data with fallbacks
  const allMakes = filterOptions.makes || [];
  const allModels = filterOptions.models || [];
  const allTrims = filterOptions.trims || [];
  const allConditions = filterOptions.conditions || [];
  const allVehicleTypes = filterOptions.bodyTypes || [];
  const allDriveTypes = filterOptions.drivetrains || [];
  const allTransmissions = filterOptions.transmissions || [];
  const allExteriorColors = filterOptions.exteriorColors || [];
  const allInteriorColors = filterOptions.interiorColors || [];
  const allYears = filterOptions.years || [];
  const allFuelTypes = filterOptions.fuelTypes || [];

  const displayedMakes = showMoreMakes ? allMakes : allMakes.slice(0, 8);
  const displayedModels = showMoreModels ? allModels : allModels.slice(0, 8);
  const displayedTrims = showMoreTrims ? allTrims : allTrims.slice(0, 8);

  // Helper function to get color hex values
  const getColorHex = useCallback((colorName) => {
    const colorMap = {
      'white': '#FFFFFF',
      'black': '#000000',
      'gray': '#808080',
      'grey': '#808080',
      'silver': '#C0C0C0',
      'blue': '#0066CC',
      'red': '#CC0000',
      'green': '#008000',
      'yellow': '#FFFF00',
      'orange': '#FFA500',
      'purple': '#800080',
      'brown': '#8B4513',
      'beige': '#F5F5DC',
      'tan': '#D2B48C',
      'gold': '#FFD700',
      'maroon': '#800000',
      'navy': '#000080'
    };
    return colorMap[colorName.toLowerCase()] || '#666666';
  }, []);

  // Get filter counts
  const getFilterCount = useCallback((category) => {
    const defaultValues = {
      zipCode: '98498',
      radius: '200',
      termLength: '72',
      interestRate: '8',
      downPayment: '2000'
    };

    if (category === 'price') {
      return ((filters.priceMin && filters.priceMin.toString().trim() !== '') ||
              (filters.priceMax && filters.priceMax.toString().trim() !== '')) ? 1 : 0;
    }
    if (category === 'payment') {
      return ((filters.paymentMin && filters.paymentMin.toString().trim() !== '') ||
              (filters.paymentMax && filters.paymentMax.toString().trim() !== '')) ? 1 : 0;
    }
    const value = filters[category];
    if (Array.isArray(value)) {
      return value.length;
    }
    if (value && value.toString().trim() !== '' && value.toString() !== (defaultValues[category] || '')) {
      return 1;
    }
    return 0;
  }, [filters]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    const defaultValues = {
      zipCode: '98498',
      radius: '200',
      termLength: '72',
      interestRate: '8',
      downPayment: '2000'
    };

    return Object.entries(filters).reduce((count, [key, value]) => {
      if (key === 'radius' || key === 'termLength' || key === 'interestRate' || key === 'downPayment' || key === 'zipCode') {
        return count;
      }

      if (key === 'priceMin' || key === 'priceMax') {
        if (key === 'priceMin' && ((filters.priceMin && filters.priceMin.toString().trim() !== '') ||
            (filters.priceMax && filters.priceMax.toString().trim() !== ''))) {
          return count + 1;
        }
        if (key === 'priceMax') {
          return count;
        }
      }

      if (key === 'paymentMin' || key === 'paymentMax') {
        if (key === 'paymentMin' && ((filters.paymentMin && filters.paymentMin.toString().trim() !== '') ||
            (filters.paymentMax && filters.paymentMax.toString().trim() !== ''))) {
          return count + 1;
        }
        if (key === 'paymentMax') {
          return count;
        }
      }

      if (Array.isArray(value)) {
        return count + value.length;
      }

      if (value && value.toString().trim() !== '' && value.toString() !== (defaultValues[key] || '')) {
        return count + 1;
      }

      return count;
    }, 0);
  }, [filters]);

  // Add styles on mount
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = styles;
    document.head.appendChild(styleTag);
    return () => {
      if (document.head.contains(styleTag)) {
        document.head.removeChild(styleTag);
      }
    };
  }, []);

  // Mobile bottom sheet overlay
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          className={`fixed inset-0 bg-black bg-opacity-60 z-40 transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={onClose}
        />

        {/* Bottom Sheet */}
        <div className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 transition-transform duration-300 ease-out max-h-[90vh] ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}>
          {/* Drag Handle */}
          <div className="flex justify-center pt-4 pb-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Filter Vehicles</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close filters"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)', paddingBottom: '100px' }}>
            <div className="px-6 py-4">
              <FilterContent />
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3 rounded-t-3xl">
            <button
              onClick={clearAllFilters}
              className="flex-1 px-6 py-4 bg-gray-100 text-gray-800 rounded-2xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
              disabled={activeFilterCount === 0}
            >
              Clear {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 text-white rounded-2xl font-semibold hover:bg-red-700 transition-colors relative"
              style={{ backgroundColor: '#dc2626' }}
            >
              Apply Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </>
    );
  }

  // Desktop sidebar
  return (
    <div className="carzino-filter-container">
      <FilterContent />
    </div>
  );

  // Filter content
  function FilterContent() {
    return (
      <div className={isMobile ? "p-0" : "p-4"}>
        {/* Mobile header is now handled in the bottom sheet */}

        {/* Search Section */}
        <div className={`mb-6 ${isMobile ? '' : 'pb-4 border-b border-gray-200'}`}>
          <div className="relative">
            <input
              type="text"
              placeholder="Search Vehicles"
              className={`carzino-search-input carzino-input w-full px-4 border border-gray-300 rounded-xl focus:outline-none focus:border-red-600 ${isMobile ? 'py-4 text-lg' : 'py-2.5'}`}
            />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-600 p-1">
              <Search className={`${isMobile ? 'w-6 h-6' : 'w-4 h-4'}`} style={{ color: '#dc2626' }} />
            </button>
          </div>
        </div>

        {/* Applied Filters */}
        {activeFilterCount > 0 && (
          <div className={`mb-6 ${isMobile ? '' : 'pb-4 border-b border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-semibold ${isMobile ? 'text-lg' : 'text-base'}`}>Applied Filters</h3>
              <button
                onClick={clearAllFilters}
                className={`bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors ${isMobile ? 'px-4 py-2 text-sm' : 'px-3 py-1 text-xs'}`}
                style={{ backgroundColor: '#dc2626' }}
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(() => {
                const filterPills = [];

                const defaultValues = {
                  zipCode: '98498',
                  radius: '200',
                  termLength: '72',
                  interestRate: '8',
                  downPayment: '2000'
                };

                Object.entries(filters).forEach(([category, value]) => {
                  if (category === 'radius' || category === 'termLength' || category === 'interestRate' ||
                      category === 'downPayment' || category === 'zipCode' || category === 'priceMin' ||
                      category === 'priceMax' || category === 'paymentMin' || category === 'paymentMax') {
                    return;
                  }

                  if (Array.isArray(value) && value.length > 0) {
                    value.forEach((item, index) => {
                      if (item && item.toString().trim() !== '') {
                        filterPills.push(
                          <span key={`${category}-${index}`} className="carzino-filter-pill">
                            <Check className="w-3 h-3" style={{ color: '#dc2626' }} />
                            {item}
                            <button
                              onClick={() => removeAppliedFilter(category, item)}
                              className="ml-1 text-white hover:text-gray-300"
                            >
                              ×
                            </button>
                          </span>
                        );
                      }
                    });
                  } else if (value && typeof value === 'string' && value.trim() !== '' && value !== (defaultValues[category] || '')) {
                    filterPills.push(
                      <span key={category} className="carzino-filter-pill">
                        <Check className="w-3 h-3" style={{ color: '#dc2626' }} />
                        {value}
                        <button
                          onClick={() => removeAppliedFilter(category, value)}
                          className="ml-1 text-white hover:text-gray-300"
                        >
                          ×
                        </button>
                      </span>
                    );
                  }
                });

                // Handle price range
                if ((filters.priceMin && filters.priceMin.toString().trim() !== '') ||
                    (filters.priceMax && filters.priceMax.toString().trim() !== '')) {
                  const priceRange = [];
                  if (filters.priceMin && filters.priceMin.toString().trim() !== '') {
                    priceRange.push(`$${filters.priceMin}+`);
                  }
                  if (filters.priceMax && filters.priceMax.toString().trim() !== '') {
                    priceRange.push(`$${filters.priceMax}-`);
                  }
                  if (priceRange.length > 0) {
                    filterPills.push(
                      <span key="price" className="carzino-filter-pill">
                        <Check className="w-3 h-3" style={{ color: '#dc2626' }} />
                        {priceRange.join(' to ')}
                        <button
                          onClick={() => removeAppliedFilter('priceMin', '')}
                          className="ml-1 text-white hover:text-gray-300"
                        >
                          ×
                        </button>
                      </span>
                    );
                  }
                }

                // Handle payment range
                if ((filters.paymentMin && filters.paymentMin.toString().trim() !== '') ||
                    (filters.paymentMax && filters.paymentMax.toString().trim() !== '')) {
                  const paymentRange = [];
                  if (filters.paymentMin && filters.paymentMin.toString().trim() !== '') {
                    paymentRange.push(`$${filters.paymentMin}+`);
                  }
                  if (filters.paymentMax && filters.paymentMax.toString().trim() !== '') {
                    paymentRange.push(`$${filters.paymentMax}-`);
                  }
                  if (paymentRange.length > 0) {
                    filterPills.push(
                      <span key="payment" className="carzino-filter-pill">
                        <Check className="w-3 h-3" style={{ color: '#dc2626' }} />
                        {paymentRange.join(' to ')}
                        <button
                          onClick={() => removeAppliedFilter('paymentMin', '')}
                          className="ml-1 text-white hover:text-gray-300"
                        >
                          ×
                        </button>
                      </span>
                    );
                  }
                }

                return filterPills;
              })()}
            </div>
          </div>
        )}

        {/* Distance */}
        <div className={`mb-6 border border-gray-200 rounded-xl p-4 ${isMobile ? 'bg-gray-50' : ''}`}>
          <label className={`font-semibold block mb-3 ${isMobile ? 'text-lg' : 'text-base'}`}>Distance</label>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="ZIP Code"
              value={filters.zipCode || '98498'}
              onChange={(e) => handleFilterChange('zipCode', e.target.value, true)}
              className={`carzino-search-input carzino-input w-full px-4 border border-gray-300 rounded-xl focus:outline-none ${isMobile ? 'py-4 text-lg' : 'py-2.5'}`}
            />
            <select
              value={filters.radius || '200'}
              onChange={(e) => handleFilterChange('radius', e.target.value, true)}
              className={`carzino-select w-full px-4 border border-gray-300 rounded-xl focus:outline-none ${isMobile ? 'py-4 text-lg' : 'py-2.5'}`}
            >
              <option value="10">10 miles</option>
              <option value="25">25 miles</option>
              <option value="50">50 miles</option>
              <option value="100">100 miles</option>
              <option value="200">200 miles</option>
              <option value="500">500 miles</option>
              <option value="any">Any</option>
            </select>
          </div>
        </div>

        {/* Make */}
        <FilterSection
          title="Make"
          isCollapsed={collapsedFilters.make}
          onToggle={() => toggleFilter('make')}
          count={getFilterCount('make')}
          isMobile={isMobile}
        >
          <div className="space-y-1">
            {allMakes.length > 0 ? (
              displayedMakes.map((make) => (
                <CheckboxOption
                  key={make.name}
                  label={make.name}
                  count={make.count}
                  value={make.name}
                  category="make"
                  checked={filters.make?.includes(make.name)}
                  onChange={handleFilterChange}
                />
              ))
            ) : (
              <div className="text-sm text-gray-500 py-2">
                {isLoading ? 'Loading makes...' : 'No makes available'}
              </div>
            )}
          </div>
          {allMakes.length > 8 && (
            <button 
              onClick={() => setShowMoreMakes(!showMoreMakes)}
              className="carzino-show-more text-red-600 hover:text-red-700 text-sm mt-2"
            >
              {showMoreMakes ? 'Show Less' : 'Show More'}
            </button>
          )}
        </FilterSection>

        {/* Model - shows only when make is selected */}
        {filters.make?.length > 0 && (
          <FilterSection
            title="Model"
            isCollapsed={collapsedFilters.model}
            onToggle={() => toggleFilter('model')}
            count={getFilterCount('model')}
            isMobile={isMobile}
          >
            <div className="space-y-1">
              {allModels.length > 0 ? (
                displayedModels.map((model) => (
                  <CheckboxOption
                    key={model.name}
                    label={model.name}
                    count={model.count}
                    value={model.name}
                    category="model"
                    checked={filters.model?.includes(model.name)}
                    onChange={handleFilterChange}
                  />
                ))
              ) : (
                <div className="text-sm text-gray-500 py-2">
                  {isLoading ? 'Loading models...' : 'No models available for selected make(s)'}
                </div>
              )}
            </div>
            {allModels.length > 8 && (
              <button 
                onClick={() => setShowMoreModels(!showMoreModels)}
                className="carzino-show-more text-red-600 hover:text-red-700 text-sm mt-2"
              >
                {showMoreModels ? 'Show Less' : 'Show More'}
              </button>
            )}
          </FilterSection>
        )}

        {/* Filter by Price */}
        <FilterSection
          title="Filter by Price"
          isCollapsed={collapsedFilters.price}
          onToggle={() => toggleFilter('price')}
          count={getFilterCount('price')}
          isMobile={isMobile}
        >
          <PriceRangeInput 
            min={filters.priceMin}
            max={filters.priceMax}
            onMinChange={(value) => handleFilterChange('priceMin', value, true)}
            onMaxChange={(value) => handleFilterChange('priceMax', value, true)}
          />
        </FilterSection>

        {/* Search by Payment */}
        <FilterSection
          title="Search by Payment"
          isCollapsed={collapsedFilters.payment}
          onToggle={() => toggleFilter('payment')}
          count={getFilterCount('payment')}
          isMobile={isMobile}
        >
          <PaymentCalculator 
            filters={filters}
            onChange={handleFilterChange}
          />
        </FilterSection>

        {/* Condition */}
        <FilterSection
          title="Condition"
          isCollapsed={collapsedFilters.condition}
          onToggle={() => toggleFilter('condition')}
          count={getFilterCount('condition')}
          isMobile={isMobile}
        >
          <div className="space-y-1">
            {allConditions.length > 0 ? (
              allConditions.map((condition) => (
                <CheckboxOption
                  key={condition.name}
                  label={condition.name}
                  count={condition.count}
                  value={condition.name}
                  category="condition"
                  checked={filters.condition?.includes(condition.name)}
                  onChange={handleFilterChange}
                />
              ))
            ) : (
              <div className="space-y-1">
                <CheckboxOption
                  label="New"
                  count={125989}
                  value="New"
                  category="condition"
                  checked={filters.condition?.includes('New')}
                  onChange={handleFilterChange}
                />
                <CheckboxOption
                  label="Used"
                  count={78800}
                  value="Used"
                  category="condition"
                  checked={filters.condition?.includes('Used')}
                  onChange={handleFilterChange}
                />
                <CheckboxOption
                  label="Certified"
                  count={9889}
                  value="Certified"
                  category="condition"
                  checked={filters.condition?.includes('Certified')}
                  onChange={handleFilterChange}
                />
              </div>
            )}
          </div>
        </FilterSection>

        {/* Vehicle Type */}
        <FilterSection
          title="Vehicle Type"
          isCollapsed={collapsedFilters.vehicleType}
          onToggle={() => toggleFilter('vehicleType')}
          count={getFilterCount('vehicleType')}
          isMobile={isMobile}
        >
          <div className="space-y-1">
            {allVehicleTypes.length > 0 ? (
              allVehicleTypes.map((vehicleType) => (
                <CheckboxOption
                  key={vehicleType.name}
                  label={vehicleType.name}
                  count={vehicleType.count}
                  value={vehicleType.name}
                  category="vehicleType"
                  checked={filters.vehicleType?.includes(vehicleType.name)}
                  onChange={handleFilterChange}
                />
              ))
            ) : (
              <div className="space-y-1">
                <CheckboxOption
                  label="Sedan"
                  count={1698}
                  value="Sedan"
                  category="vehicleType"
                  checked={filters.vehicleType?.includes('Sedan')}
                  onChange={handleFilterChange}
                />
                <CheckboxOption
                  label="SUV"
                  count={3405}
                  value="SUV"
                  category="vehicleType"
                  checked={filters.vehicleType?.includes('SUV')}
                  onChange={handleFilterChange}
                />
                <CheckboxOption
                  label="Truck"
                  count={2217}
                  value="Truck"
                  category="vehicleType"
                  checked={filters.vehicleType?.includes('Truck')}
                  onChange={handleFilterChange}
                />
              </div>
            )}
          </div>
        </FilterSection>

        {/* Drive Type */}
        <FilterSection
          title="Drive Type"
          isCollapsed={collapsedFilters.driveType}
          onToggle={() => toggleFilter('driveType')}
          count={getFilterCount('driveType')}
          isMobile={isMobile}
        >
          <div className="space-y-1">
            {allDriveTypes.length > 0 ? (
              allDriveTypes.map((driveType) => (
                <CheckboxOption
                  key={driveType.name}
                  label={driveType.name}
                  count={driveType.count}
                  value={driveType.name}
                  category="driveType"
                  checked={filters.driveType?.includes(driveType.name)}
                  onChange={handleFilterChange}
                />
              ))
            ) : (
              <div className="space-y-1">
                <CheckboxOption
                  label="AWD/4WD"
                  count={18943}
                  value="AWD/4WD"
                  category="driveType"
                  checked={filters.driveType?.includes('AWD/4WD')}
                  onChange={handleFilterChange}
                />
                <CheckboxOption
                  label="FWD"
                  count={12057}
                  value="FWD"
                  category="driveType"
                  checked={filters.driveType?.includes('FWD')}
                  onChange={handleFilterChange}
                />
                <CheckboxOption
                  label="RWD"
                  count={5883}
                  value="RWD"
                  category="driveType"
                  checked={filters.driveType?.includes('RWD')}
                  onChange={handleFilterChange}
                />
              </div>
            )}
          </div>
        </FilterSection>

        {/* Transmission */}
        <FilterSection
          title="Transmission"
          isCollapsed={collapsedFilters.transmissionSpeed}
          onToggle={() => toggleFilter('transmissionSpeed')}
          count={getFilterCount('transmissionSpeed')}
          isMobile={isMobile}
        >
          <div className="space-y-1">
            {allTransmissions.length > 0 ? (
              allTransmissions.map((transmission) => (
                <CheckboxOption
                  key={transmission.name}
                  label={transmission.name}
                  count={transmission.count}
                  value={transmission.name}
                  category="transmissionSpeed"
                  checked={filters.transmissionSpeed?.includes(transmission.name)}
                  onChange={handleFilterChange}
                />
              ))
            ) : (
              <div className="text-sm text-gray-500 py-2">
                Loading transmissions...
              </div>
            )}
          </div>
        </FilterSection>

        {/* Exterior Color */}
        <FilterSection
          title="Exterior Color"
          isCollapsed={collapsedFilters.exteriorColor}
          onToggle={() => toggleFilter('exteriorColor')}
          count={getFilterCount('exteriorColor')}
          isMobile={isMobile}
        >
          <div className="space-y-1">
            {allExteriorColors.length > 0 ? (
              allExteriorColors.map((color) => (
                <ColorSwatch
                  key={color.name}
                  color={getColorHex(color.name)}
                  name={color.name}
                  count={color.count}
                  category="exteriorColor"
                  checked={filters.exteriorColor?.includes(color.name)}
                  onChange={handleFilterChange}
                />
              ))
            ) : (
              <div className="text-sm text-gray-500 py-2">
                Loading exterior colors...
              </div>
            )}
          </div>
        </FilterSection>

        {/* Interior Color */}
        <FilterSection
          title="Interior Color"
          isCollapsed={collapsedFilters.interiorColor}
          onToggle={() => toggleFilter('interiorColor')}
          count={getFilterCount('interiorColor')}
          isMobile={isMobile}
        >
          <div className="space-y-1">
            {allInteriorColors.length > 0 ? (
              allInteriorColors.map((color) => (
                <ColorSwatch
                  key={color.name}
                  color={getColorHex(color.name)}
                  name={color.name}
                  count={color.count}
                  category="interiorColor"
                  checked={filters.interiorColor?.includes(color.name)}
                  onChange={handleFilterChange}
                />
              ))
            ) : (
              <div className="text-sm text-gray-500 py-2">
                Loading interior colors...
              </div>
            )}
          </div>
        </FilterSection>

        {/* Model Years */}
        {allYears.length > 0 && (
          <FilterSection
            title="Year"
            isCollapsed={collapsedFilters.year}
            onToggle={() => toggleFilter('year')}
            count={getFilterCount('year')}
            isMobile={isMobile}
          >
            <div className="space-y-1">
              {allYears.map((year) => (
                <CheckboxOption
                  key={year.name}
                  label={year.name}
                  count={year.count}
                  value={year.name}
                  category="year"
                  checked={filters.year?.includes(year.name)}
                  onChange={handleFilterChange}
                />
              ))}
            </div>
          </FilterSection>
        )}

        {/* Fuel Type */}
        {allFuelTypes.length > 0 && (
          <FilterSection
            title="Fuel Type"
            isCollapsed={collapsedFilters.fuelType}
            onToggle={() => toggleFilter('fuelType')}
            count={getFilterCount('fuelType')}
            isMobile={isMobile}
          >
            <div className="space-y-1">
              {allFuelTypes.map((fuelType) => (
                <CheckboxOption
                  key={fuelType.name}
                  label={fuelType.name}
                  count={fuelType.count}
                  value={fuelType.name}
                  category="fuelType"
                  checked={filters.fuelType?.includes(fuelType.name)}
                  onChange={handleFilterChange}
                />
              ))}
            </div>
          </FilterSection>
        )}

        {/* Trim Levels */}
        {allTrims.length > 0 && (
          <FilterSection
            title="Trim"
            isCollapsed={collapsedFilters.trim}
            onToggle={() => toggleFilter('trim')}
            count={getFilterCount('trim')}
            isMobile={isMobile}
          >
            <div className="space-y-1">
              {displayedTrims.map((trim) => (
                <CheckboxOption
                  key={trim.name}
                  label={trim.name}
                  count={trim.count}
                  value={trim.name}
                  category="trim"
                  checked={filters.trim?.includes(trim.name)}
                  onChange={handleFilterChange}
                />
              ))}
            </div>
            {allTrims.length > 8 && (
              <button 
                onClick={() => setShowMoreTrims(!showMoreTrims)}
                className="carzino-show-more text-red-600 hover:text-red-700 text-sm mt-2"
              >
                {showMoreTrims ? 'Show Less' : 'Show More'}
              </button>
            )}
          </FilterSection>
        )}

        {/* Mobile footer is now handled in the bottom sheet */}
      </div>
    );
  }
};

export default VehicleSearchFilter;

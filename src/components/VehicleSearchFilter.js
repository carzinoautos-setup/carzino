import React, { useState, memo, useCallback, useMemo } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

// Filter Section Components
const FilterSection = memo(({ title, isCollapsed, onToggle, children, count }) => {
  return (
    <div className="py-1 border-b border-gray-200">
      <div
        className="flex items-center justify-between cursor-pointer py-1.5 hover:bg-gray-50 -mx-1 px-1 rounded"
        onClick={onToggle}
      >
        <h3 className="text-sm font-medium text-gray-900 pointer-events-none flex-1" style={{ height: 'auto', alignSelf: 'stretch', padding: '12px 0' }}>{title}</h3>
        <ChevronDown
          className={`w-4 h-4 text-red-600 transition-transform duration-200 ${
            !isCollapsed ? 'rotate-180' : 'rotate-0'
          }`}
          style={{ color: '#dc2626' }}
        />
      </div>
      {!isCollapsed && (
        <div className="mt-1 space-y-2" onClick={(e) => e.stopPropagation()}>
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
  category
}) => {
  return (
    <label className="flex items-center py-1.5 cursor-pointer hover:bg-gray-50 -mx-1 px-1 rounded">
      <input
        type="checkbox"
        className="carzino-checkbox mr-4"
        checked={checked}
        onChange={(e) => onChange(category, value, e.target.checked)}
      />
      <span className="text-sm text-gray-800 flex-1" style={{ padding: '4px 0 5px 5px' }}>
        {label} {count !== undefined && `(${count.toLocaleString()})`}
      </span>
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
          className="carzino-search-input carzino-input w-1/2 px-2 py-5 border border-gray-300 rounded focus:outline-none"
          style={{ height: '39px' }}
        />
        <input
          type="text"
          placeholder="$100,000"
          value={localMax}
          onChange={(e) => setLocalMax(e.target.value.replace(/[^0-9]/g, ''))}
          onBlur={handleMaxBlur}
          className="carzino-search-input carzino-input w-1/2 px-2 py-5 border border-gray-300 rounded focus:outline-none"
          style={{ height: '39px' }}
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
            className="carzino-search-input carzino-input w-full pl-6 pr-8 py-5 border border-gray-300 rounded focus:outline-none"
            style={{ height: '39px' }}
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
            className="carzino-search-input carzino-input w-full pl-6 pr-8 py-5 border border-gray-300 rounded focus:outline-none"
            style={{ height: '39px' }}
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
          className="carzino-select w-full px-2 py-5 border border-gray-300 rounded focus:outline-none"
          style={{ height: '39px' }}
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
              className="carzino-search-input carzino-input w-full pr-6 px-2 py-5 border border-gray-300 rounded focus:outline-none"
              style={{ height: '39px' }}
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
              className="carzino-search-input carzino-input w-full pl-6 px-2 py-5 border border-gray-300 rounded focus:outline-none"
              style={{ height: '39px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

const ColorSwatch = memo(({ color, name, count, checked, onChange, category }) => (
  <label className="flex items-center py-1.5 cursor-pointer hover:bg-gray-50 -mx-1 px-1 rounded">
    <input
      type="checkbox"
      className="carzino-checkbox mr-4"
      checked={checked}
      onChange={(e) => onChange(category, name, e.target.checked)}
    />
    <div
      className="w-4 h-4 rounded border border-gray-300 mr-3 flex-shrink-0"
      style={{ backgroundColor: color }}
    />
    <span className="text-sm text-gray-800 flex-1" style={{ padding: '4px 0 5px 5px' }}>{name} ({count.toLocaleString()})</span>
  </label>
));

// Main Filter Component
const VehicleSearchFilter = ({ 
  filters = {},
  onFiltersChange,
  filterOptions = {},
  isLoading = false,
  isMobile = false,
  onClose
}) => {
  // Local state
  const [showMoreMakes, setShowMoreMakes] = useState(false);
  
  // Collapsed sections state (default to collapsed to match your uploaded image)
  const [collapsedFilters, setCollapsedFilters] = useState({
    make: false,
    model: false,
    trim: false,
    price: false,
    payment: false,
    condition: false,
    mileage: false,
    vehicleType: false,
    driveType: false,
    transmissionSpeed: false,
    exteriorColor: false,
    interiorColor: false,
    fuelType: false,
    year: false
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
        category === 'zipCodeFilter') {
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
      vehicleType: [],
      bodyType: [],
      driveType: [],
      mileage: '',
      exteriorColor: [],
      interiorColor: [],
      transmissionSpeed: [],
      sellerType: [],
      dealer: [],
      state: [],
      city: [],
      zipCodeFilter: [],
      priceMin: '',
      priceMax: '',
      paymentMin: '',
      paymentMax: '',
      zipCode: filters.zipCode || '',
      radius: filters.radius || '10',
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

  // Real data from WooCommerce API
  const allMakes = filterOptions.makes || [];
  const allModels = filterOptions.models || [];
  const allConditions = filterOptions.conditions || [];
  const allVehicleTypes = filterOptions.bodyTypes || [];
  const allDriveTypes = filterOptions.drivetrains || [];
  const allTransmissions = filterOptions.transmissions || [];
  const allExteriorColors = filterOptions.exteriorColors || [];
  const allInteriorColors = filterOptions.interiorColors || [];
  const allYears = filterOptions.years || [];
  const allTrims = filterOptions.trims || [];
  const allFuelTypes = filterOptions.fuelTypes || [];





  const displayedMakes = showMoreMakes ? allMakes : allMakes.slice(0, 8);

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
    // Define default values that shouldn't count as applied filters
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
    // Define default values that shouldn't count as applied filters
    const defaultValues = {
      zipCode: '98498',
      radius: '200',
      termLength: '72',
      interestRate: '8',
      downPayment: '2000'
    };

    return Object.entries(filters).reduce((count, [key, value]) => {
      // Skip configuration/default fields that shouldn't count as active filters
      if (key === 'radius' || key === 'termLength' || key === 'interestRate' || key === 'downPayment' || key === 'zipCode') {
        return count;
      }

      // Handle price range
      if (key === 'priceMin' || key === 'priceMax') {
        if (key === 'priceMin' && ((filters.priceMin && filters.priceMin.toString().trim() !== '') ||
            (filters.priceMax && filters.priceMax.toString().trim() !== ''))) {
          return count + 1;
        }
        if (key === 'priceMax') {
          return count;
        }
      }

      // Handle payment range
      if (key === 'paymentMin' || key === 'paymentMax') {
        if (key === 'paymentMin' && ((filters.paymentMin && filters.paymentMin.toString().trim() !== '') ||
            (filters.paymentMax && filters.paymentMax.toString().trim() !== ''))) {
          return count + 1;
        }
        if (key === 'paymentMax') {
          return count;
        }
      }

      // Handle array-based filters
      if (Array.isArray(value)) {
        return count + value.length;
      }

      // Handle single value filters (exclude empty values and default values)
      if (value && value.toString().trim() !== '' && value.toString() !== (defaultValues[key] || '')) {
        return count + 1;
      }

      return count;
    }, 0);
  }, [filters]);

  // Mobile overlay
  if (isMobile) {
    return (
      <>
        <div 
          className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity ${
            onClose ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={onClose}
        />
        
        <div className={`fixed left-0 top-0 h-full w-full bg-white shadow-xl z-50 transition-transform duration-300 ${
          onClose ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="h-full overflow-y-auto overflow-x-hidden w-full" style={{ padding: '20px' }}>
            <FilterContent />
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
        {/* Mobile Header */}
        {isMobile && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-normal text-gray-900">Filters</h2>
            <button
              onClick={onClose}
              className="p-1"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}

        {/* Search Section */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Search Vehicles</h3>
          <div className="relative rounded-md overflow-hidden">
            <input
              type="text"
              placeholder="Search Vehicles"
              className="carzino-search-input carzino-input w-full px-3 py-5 pr-12 border border-gray-300 rounded-md focus:outline-none focus:border-red-600 bg-white"
              style={{ height: '39px' }}
            />
            <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-600">
              <Search className="w-4 h-4" style={{ color: '#dc2626' }} />
            </button>
          </div>
        </div>

        {/* Applied Filters */}
        {activeFilterCount > 0 && (
          <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Applied Filters</h3>
            <button
              onClick={clearAllFilters}
              className="bg-red-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-red-700"
              style={{ backgroundColor: '#dc2626' }}
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2 max-w-full overflow-hidden">
            {/* Show dynamic active filter pills */}
            {(() => {
              const filterPills = [];

              // Define default values that shouldn't show as applied filters
              const defaultValues = {
                zipCode: '98498',
                radius: '200',
                termLength: '72',
                interestRate: '8',
                downPayment: '2000'
              };

              // Handle array-based filters
              Object.entries(filters).forEach(([category, value]) => {
                // Skip configuration/default fields that shouldn't show as applied filters
                if (category === 'radius' || category === 'termLength' || category === 'interestRate' ||
                    category === 'downPayment' || category === 'zipCode' || category === 'priceMin' ||
                    category === 'priceMax' || category === 'paymentMin' || category === 'paymentMax') {
                  return;
                }

                if (Array.isArray(value) && value.length > 0) {
                  value.forEach((item, index) => {
                    if (item && item.toString().trim() !== '') {
                      filterPills.push(
                        <span key={`${category}-${index}`} className="bg-black text-white rounded-full text-xs font-medium flex items-center max-w-full" style={{paddingLeft: '10px', paddingRight: '15px', paddingTop: '6px', paddingBottom: '6px'}}>
                          <span className="truncate flex-1">{item}</span>
                          <button
                            onClick={() => removeAppliedFilter(category, item)}
                            className="text-white hover:text-gray-300 text-xs flex-shrink-0 ml-2"
                          >
                            ×
                          </button>
                        </span>
                      );
                    }
                  });
                } else if (value && value.toString().trim() !== '' && value.toString() !== (defaultValues[category] || '')) {
                  filterPills.push(
                    <span key={category} className="bg-black text-white rounded-full text-xs font-medium flex items-center max-w-full" style={{paddingLeft: '10px', paddingRight: '15px', paddingTop: '6px', paddingBottom: '6px'}}>
                      <span className="truncate flex-1">{value}</span>
                      <button
                        onClick={() => removeAppliedFilter(category, value)}
                        className="text-white hover:text-gray-300 text-xs flex-shrink-0 ml-2"
                      >
                        ×
                      </button>
                    </span>
                  );
                }
              });

              // Handle price range (only if actual values are entered)
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
                    <span key="price" className="bg-black text-white rounded-full text-xs font-medium flex items-center max-w-full" style={{paddingLeft: '10px', paddingRight: '15px', paddingTop: '6px', paddingBottom: '6px'}}>
                      <span className="truncate flex-1">{priceRange.join(' to ')}</span>
                      <button
                        onClick={() => removeAppliedFilter('priceMin', '')}
                        className="text-white hover:text-gray-300 text-xs flex-shrink-0 ml-2"
                      >
                        ×
                      </button>
                    </span>
                  );
                }
              }

              // Handle payment range (only if actual values are entered)
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
                    <span key="payment" className="bg-black text-white rounded-full text-xs font-medium flex items-center max-w-full" style={{paddingLeft: '10px', paddingRight: '15px', paddingTop: '6px', paddingBottom: '6px'}}>
                      <span className="truncate flex-1">{paymentRange.join(' to ')}</span>
                      <button
                        onClick={() => removeAppliedFilter('paymentMin', '')}
                        className="text-white hover:text-gray-300 text-xs flex-shrink-0 ml-2"
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
        <div className="mb-6">
          <label className="block mb-3 text-sm font-medium text-gray-900">Distance</label>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="ZIP Code"
              value={filters.zipCode || '98498'}
              onChange={(e) => handleFilterChange('zipCode', e.target.value, true)}
              className="carzino-search-input carzino-input w-full px-3 py-5 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-600 bg-white"
              style={{ height: '39px' }}
            />
            <select
              value={filters.radius || '200'}
              onChange={(e) => handleFilterChange('radius', e.target.value, true)}
              className="carzino-select w-full px-3 py-5 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-600 bg-white"
              style={{ height: '39px' }}
            >
              <option value="10">10 Miles</option>
              <option value="25">25 Miles</option>
              <option value="50">50 Miles</option>
              <option value="100">100 Miles</option>
              <option value="200">200 Miles</option>
              <option value="500">500 Miles</option>
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
        >
          <div className="space-y-2">
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
            <span
              onClick={() => setShowMoreMakes(!showMoreMakes)}
              className="text-red-600 hover:text-red-700 text-sm mt-3 font-medium cursor-pointer"
            >
              {showMoreMakes ? 'Show Less' : 'Show More'}
            </span>
          )}
        </FilterSection>

        {/* Model */}
        {filters.make?.length > 0 && (
          <FilterSection
            title="Model"
            isCollapsed={collapsedFilters.model}
            onToggle={() => toggleFilter('model')}
            count={getFilterCount('model')}
          >
            <div className="space-y-2">
              {allModels.length > 0 ? (
                allModels.map((model) => (
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
          </FilterSection>
        )}

        {/* Filter by Price */}
        <FilterSection 
          title="Filter by Price"
          isCollapsed={collapsedFilters.price}
          onToggle={() => toggleFilter('price')}
          count={getFilterCount('price')}
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
        >
          <div className="space-y-3">
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
              <div className="text-sm text-gray-500 py-2">
                Loading conditions...
              </div>
            )}
          </div>
        </FilterSection>

        {/* Search by Vehicle Type */}
        <FilterSection
          title="Search by Vehicle Type"
          isCollapsed={collapsedFilters.vehicleType}
          onToggle={() => toggleFilter('vehicleType')}
          count={getFilterCount('vehicleType')}
        >
          <div className="space-y-2">
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
              <div className="text-sm text-gray-500 py-2">
                Loading vehicle types...
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
        >
          <div className="space-y-2">
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
              <div className="text-sm text-gray-500 py-2">
                Loading drive types...
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
        >
          <div className="space-y-2">
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
        >
          <div className="space-y-2">
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
        >
          <div className="space-y-2">
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
          >
            <div className="space-y-2">
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
          >
            <div className="space-y-2">
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
          >
            <div className="space-y-2">
              {allTrims.map((trim) => (
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
          </FilterSection>
        )}

        {/* Mobile Footer */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-3 z-50">
            <button
              onClick={clearAllFilters}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded font-medium hover:bg-gray-200"
              disabled={activeFilterCount === 0}
            >
              Clear {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 text-white rounded font-medium hover:bg-red-700"
              style={{ backgroundColor: '#dc2626' }}
            >
              Apply Filters
            </button>
          </div>
        )}
      </div>
    );
  }
};

export default VehicleSearchFilter;

import React, { useState, memo, useCallback, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

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
          className="carzino-search-input carzino-input w-1/2 px-2 py-2.5 border border-gray-300 rounded focus:outline-none"
        />
        <input
          type="text"
          placeholder="$100,000"
          value={localMax}
          onChange={(e) => setLocalMax(e.target.value.replace(/[^0-9]/g, ''))}
          onBlur={handleMaxBlur}
          className="carzino-search-input carzino-input w-1/2 px-2 py-2.5 border border-gray-300 rounded focus:outline-none"
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
            className="carzino-search-input carzino-input w-full pl-6 pr-8 py-3 border border-gray-300 rounded focus:outline-none"
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
            className="carzino-search-input carzino-input w-full pl-6 pr-8 py-3 border border-gray-300 rounded focus:outline-none"
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
          className="carzino-select w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none"
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
              className="carzino-search-input carzino-input w-full pr-6 px-2 py-1.5 border border-gray-300 rounded focus:outline-none"
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
              className="carzino-search-input carzino-input w-full pl-6 px-2 py-1.5 border border-gray-300 rounded focus:outline-none"
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
  const [showMoreModels, setShowMoreModels] = useState(false);
  const [showMoreTrims, setShowMoreTrims] = useState(false);
  
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
    dealer: false,
    state: false,
    city: false
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

  // Sample data
  const allMakes = filterOptions.makes || [
    { name: "Audi", count: 143 },
    { name: "BMW", count: 189 },
    { name: "Chevrolet", count: 287 },
    { name: "Ford", count: 523 },
    { name: "Honda", count: 234 },
    { name: "Hyundai", count: 176 },
    { name: "Mercedes-Benz", count: 156 },
    { name: "Nissan", count: 198 },
    { name: "Subaru", count: 122 },
    { name: "Tesla", count: 45 },
    { name: "Toyota", count: 412 },
    { name: "Volkswagen", count: 134 }
  ];

  const allModels = filterOptions.models || [
    { name: "3 Series", count: 67 },
    { name: "A4", count: 38 },
    { name: "Camry", count: 134 },
    { name: "F-150", count: 156 },
    { name: "Model 3", count: 23 }
  ];

  const allTrims = filterOptions.trims || [
    { name: "Base", count: 234 },
    { name: "EX", count: 89 },
    { name: "Limited", count: 145 },
    { name: "Premium", count: 178 },
    { name: "Sport", count: 134 }
  ];

  const bodyTypes = filterOptions.bodyTypes || [
    { name: "Convertible", count: 196 },
    { name: "Coupe", count: 419 },
    { name: "Hatchback", count: 346 },
    { name: "Sedan", count: 1698 },
    { name: "SUV / Crossover", count: 3405 },
    { name: "Truck", count: 2217 },
    { name: "Van / Minivan", count: 203 },
    { name: "Wagon", count: 43 }
  ];

  const exteriorColors = filterOptions.exteriorColors || [
    { name: "White", count: 9427, hex: "#FFFFFF" },
    { name: "Black", count: 8363, hex: "#000000" },
    { name: "Gray", count: 7502, hex: "#808080" },
    { name: "Silver", count: 5093, hex: "#C0C0C0" },
    { name: "Blue", count: 4266, hex: "#0066CC" },
    { name: "Red", count: 3436, hex: "#CC0000" }
  ];

  const interiorColors = filterOptions.interiorColors || [
    { name: "Black", count: 12363, hex: "#000000" },
    { name: "Gray", count: 8502, hex: "#808080" },
    { name: "Beige", count: 3160, hex: "#F5F5DC" },
    { name: "Brown", count: 2353, hex: "#8B4513" }
  ];

  const displayedMakes = showMoreMakes ? allMakes : allMakes.slice(0, 8);
  const displayedModels = showMoreModels ? allModels : allModels.slice(0, 8);
  const displayedTrims = showMoreTrims ? allTrims : allTrims.slice(0, 8);

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
        if (key === 'priceMin' && (filters.priceMin && filters.priceMin.toString().trim() !== '' ||
            filters.priceMax && filters.priceMax.toString().trim() !== '')) {
          return count + 1;
        }
        if (key === 'priceMax') {
          return count;
        }
      }

      // Handle payment range
      if (key === 'paymentMin' || key === 'paymentMax') {
        if (key === 'paymentMin' && (filters.paymentMin && filters.paymentMin.toString().trim() !== '' ||
            filters.paymentMax && filters.paymentMax.toString().trim() !== '')) {
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
          <div className="relative">
            <input
              type="text"
              placeholder="Search Vehicles"
              className="w-full px-3 py-4 pl-10 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-600 bg-white"
            />
            <button className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-600">
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
                            className="bg-black text-white hover:bg-gray-800 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0"
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
                        className="bg-black text-white hover:bg-gray-800 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0"
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
                        className="bg-black text-white hover:bg-gray-800 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0"
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
                        className="bg-black text-white hover:bg-gray-800 rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0"
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
              className="w-full px-3 py-4 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-600 bg-white"
            />
            <select
              value={filters.radius || '200'}
              onChange={(e) => handleFilterChange('radius', e.target.value, true)}
              className="w-full px-3 py-4 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-600 bg-white"
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
            {displayedMakes.map((make) => (
              <CheckboxOption
                key={make.name}
                label={make.name}
                count={make.count}
                value={make.name}
                category="make"
                checked={filters.make?.includes(make.name)}
                onChange={handleFilterChange}
              />
            ))}
          </div>
          {allMakes.length > 8 && (
            <button
              onClick={() => setShowMoreMakes(!showMoreMakes)}
              className="text-red-600 hover:text-red-700 text-sm mt-3 font-medium underline"
            >
              {showMoreMakes ? 'Show Less' : 'Show More'}
            </button>
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
              {displayedModels.map((model) => (
                <CheckboxOption
                  key={model.name}
                  label={model.name}
                  count={model.count}
                  value={model.name}
                  category="model"
                  checked={filters.model?.includes(model.name)}
                  onChange={handleFilterChange}
                />
              ))}
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
        </FilterSection>

        {/* Search by Vehicle Type */}
        <FilterSection
          title="Search by Vehicle Type"
          isCollapsed={collapsedFilters.vehicleType}
          onToggle={() => toggleFilter('vehicleType')}
          count={getFilterCount('vehicleType')}
        >
          <div className="space-y-2">
            <CheckboxOption
              label="Convertible"
              count={196}
              value="Convertible"
              category="vehicleType"
              checked={filters.vehicleType?.includes('Convertible')}
              onChange={handleFilterChange}
            />
            <CheckboxOption
              label="Coupe"
              count={419}
              value="Coupe"
              category="vehicleType"
              checked={filters.vehicleType?.includes('Coupe')}
              onChange={handleFilterChange}
            />
            <CheckboxOption
              label="Hatchback"
              count={346}
              value="Hatchback"
              category="vehicleType"
              checked={filters.vehicleType?.includes('Hatchback')}
              onChange={handleFilterChange}
            />
            <CheckboxOption
              label="Sedan"
              count={1698}
              value="Sedan"
              category="vehicleType"
              checked={filters.vehicleType?.includes('Sedan')}
              onChange={handleFilterChange}
            />
            <CheckboxOption
              label="SUV / Crossover"
              count={3405}
              value="SUV / Crossover"
              category="vehicleType"
              checked={filters.vehicleType?.includes('SUV / Crossover')}
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
            <CheckboxOption
              label="Van / Minivan"
              count={203}
              value="Van / Minivan"
              category="vehicleType"
              checked={filters.vehicleType?.includes('Van / Minivan')}
              onChange={handleFilterChange}
            />
            <CheckboxOption
              label="Wagon"
              count={43}
              value="Wagon"
              category="vehicleType"
              checked={filters.vehicleType?.includes('Wagon')}
              onChange={handleFilterChange}
            />
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
            <CheckboxOption
              label="AWD (4WD)"
              count={18943}
              value="AWD"
              category="driveType"
              checked={filters.driveType?.includes('AWD')}
              onChange={handleFilterChange}
            />
            <CheckboxOption
              label="FWD (6,507)"
              count={12057}
              value="FWD"
              category="driveType"
              checked={filters.driveType?.includes('FWD')}
              onChange={handleFilterChange}
            />
            <CheckboxOption
              label="RWD (1,881)"
              count={5883}
              value="RWD"
              category="driveType"
              checked={filters.driveType?.includes('RWD')}
              onChange={handleFilterChange}
            />
          </div>
        </FilterSection>

        {/* Transmission Speed */}
        <FilterSection
          title="Transmission Speed"
          isCollapsed={collapsedFilters.transmissionSpeed}
          onToggle={() => toggleFilter('transmissionSpeed')}
          count={getFilterCount('transmissionSpeed')}
        >
          <div className="space-y-2">
            <CheckboxOption
              label="4-Speed Automatic"
              count={1245}
              value="4-Speed Automatic"
              category="transmissionSpeed"
              checked={filters.transmissionSpeed?.includes('4-Speed Automatic')}
              onChange={handleFilterChange}
            />
            <CheckboxOption
              label="5-Speed Automatic"
              count={2341}
              value="5-Speed Automatic"
              category="transmissionSpeed"
              checked={filters.transmissionSpeed?.includes('5-Speed Automatic')}
              onChange={handleFilterChange}
            />
            <CheckboxOption
              label="6-Speed Automatic"
              count={3456}
              value="6-Speed Automatic"
              category="transmissionSpeed"
              checked={filters.transmissionSpeed?.includes('6-Speed Automatic')}
              onChange={handleFilterChange}
            />
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
            <ColorSwatch
              color="#FFFFFF"
              name="White"
              count={9127}
              category="exteriorColor"
              checked={filters.exteriorColor?.includes('White')}
              onChange={handleFilterChange}
            />
            <ColorSwatch
              color="#000000"
              name="Black"
              count={8563}
              category="exteriorColor"
              checked={filters.exteriorColor?.includes('Black')}
              onChange={handleFilterChange}
            />
            <ColorSwatch
              color="#808080"
              name="Gray"
              count={7502}
              category="exteriorColor"
              checked={filters.exteriorColor?.includes('Gray')}
              onChange={handleFilterChange}
            />
            <ColorSwatch
              color="#C0C0C0"
              name="Silver"
              count={5093}
              category="exteriorColor"
              checked={filters.exteriorColor?.includes('Silver')}
              onChange={handleFilterChange}
            />
            <ColorSwatch
              color="#0066CC"
              name="Blue"
              count={4266}
              category="exteriorColor"
              checked={filters.exteriorColor?.includes('Blue')}
              onChange={handleFilterChange}
            />
            <ColorSwatch
              color="#CC0000"
              name="Red"
              count={3436}
              category="exteriorColor"
              checked={filters.exteriorColor?.includes('Red')}
              onChange={handleFilterChange}
            />
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
            <ColorSwatch
              color="#000000"
              name="Black"
              count={12363}
              category="interiorColor"
              checked={filters.interiorColor?.includes('Black')}
              onChange={handleFilterChange}
            />
            <ColorSwatch
              color="#808080"
              name="Gray"
              count={8502}
              category="interiorColor"
              checked={filters.interiorColor?.includes('Gray')}
              onChange={handleFilterChange}
            />
            <ColorSwatch
              color="#F5F5DC"
              name="Beige"
              count={3160}
              category="interiorColor"
              checked={filters.interiorColor?.includes('Beige')}
              onChange={handleFilterChange}
            />
            <ColorSwatch
              color="#8B4513"
              name="Brown"
              count={2353}
              category="interiorColor"
              checked={filters.interiorColor?.includes('Brown')}
              onChange={handleFilterChange}
            />
          </div>
        </FilterSection>

        {/* Dealer */}
        <FilterSection
          title="Dealer"
          isCollapsed={collapsedFilters.dealer}
          onToggle={() => toggleFilter('dealer')}
          count={getFilterCount('dealer')}
        >
          <div className="space-y-2">
            <CheckboxOption
              label="Bayside Auto Sales"
              count={234}
              value="Bayside Auto Sales"
              category="dealer"
              checked={filters.dealer?.includes('Bayside Auto Sales')}
              onChange={handleFilterChange}
            />
            <CheckboxOption
              label="ABC Car Sales"
              count={156}
              value="ABC Car Sales"
              category="dealer"
              checked={filters.dealer?.includes('ABC Car Sales')}
              onChange={handleFilterChange}
            />
          </div>
        </FilterSection>

        {/* State */}
        <FilterSection
          title="State"
          isCollapsed={collapsedFilters.state}
          onToggle={() => toggleFilter('state')}
          count={getFilterCount('state')}
        >
          <div className="space-y-2">
            <CheckboxOption
              label="Washington"
              count={12456}
              value="Washington"
              category="state"
              checked={filters.state?.includes('Washington')}
              onChange={handleFilterChange}
            />
            <CheckboxOption
              label="Oregon"
              count={8234}
              value="Oregon"
              category="state"
              checked={filters.state?.includes('Oregon')}
              onChange={handleFilterChange}
            />
          </div>
        </FilterSection>

        {/* City */}
        <FilterSection
          title="City"
          isCollapsed={collapsedFilters.city}
          onToggle={() => toggleFilter('city')}
          count={getFilterCount('city')}
        >
          <div className="space-y-2">
            <CheckboxOption
              label="Seattle"
              count={4567}
              value="Seattle"
              category="city"
              checked={filters.city?.includes('Seattle')}
              onChange={handleFilterChange}
            />
            <CheckboxOption
              label="Portland"
              count={3234}
              value="Portland"
              category="city"
              checked={filters.city?.includes('Portland')}
              onChange={handleFilterChange}
            />
          </div>
        </FilterSection>

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

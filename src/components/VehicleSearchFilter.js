import React, { useState, memo, useCallback, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

// Filter Section Components
const FilterSection = memo(({ title, isCollapsed, onToggle, children, count }) => {
  return (
    <div className="border-b border-gray-200 pb-3 mb-3">
      <div
        className="flex items-center justify-between cursor-pointer py-2"
        onClick={onToggle}
      >
        <h3 className="text-base font-normal text-gray-900 pointer-events-none flex-1">{title}</h3>
        <ChevronDown
          className={`w-4 h-4 text-red-600 transition-transform duration-200 ${
            !isCollapsed ? 'rotate-180' : 'rotate-0'
          }`}
          style={{ color: '#dc2626' }}
        />
      </div>
      {!isCollapsed && (
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
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
    <label className="flex items-center py-1 cursor-pointer">
      <input
        type="checkbox"
        className="carzino-checkbox mr-2"
        checked={checked}
        onChange={(e) => onChange(category, value, e.target.checked)}
      />
      <span className="text-sm text-gray-900 flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-sm text-gray-500 ml-1">({count.toLocaleString()})</span>
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
          className="carzino-search-input carzino-input w-1/2 px-2 py-1 border border-gray-300 rounded focus:outline-none"
        />
        <input
          type="text"
          placeholder="$100,000"
          value={localMax}
          onChange={(e) => setLocalMax(e.target.value.replace(/[^0-9]/g, ''))}
          onBlur={handleMaxBlur}
          className="carzino-search-input carzino-input w-1/2 px-2 py-1 border border-gray-300 rounded focus:outline-none"
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
            className="carzino-search-input carzino-input w-full pl-6 pr-8 py-1.5 border border-gray-300 rounded focus:outline-none"
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
            className="carzino-search-input carzino-input w-full pl-6 pr-8 py-1.5 border border-gray-300 rounded focus:outline-none"
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
    if (category === 'price') {
      return (filters.priceMin || filters.priceMax) ? 1 : 0;
    }
    if (category === 'payment') {
      return (filters.paymentMin || filters.paymentMax) ? 1 : 0;
    }
    const value = filters[category];
    if (Array.isArray(value)) {
      return value.length;
    }
    if (value && value !== '') {
      return 1;
    }
    return 0;
  }, [filters]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).reduce((count, [key, value]) => {
      if (key === 'radius' || key === 'termLength' || key === 'interestRate' || key === 'downPayment' || key === 'zipCode') {
        return count;
      }
      if (key === 'priceMin' || key === 'priceMax') {
        if (key === 'priceMin' && (filters.priceMin || filters.priceMax)) {
          return count + 1;
        }
        if (key === 'priceMax') {
          return count;
        }
      }
      if (key === 'paymentMin' || key === 'paymentMax') {
        if (key === 'paymentMin' && (filters.paymentMin || filters.paymentMax)) {
          return count + 1;
        }
        if (key === 'paymentMax') {
          return count;
        }
      }
      if (Array.isArray(value)) {
        return count + value.length;
      }
      if (value && value !== '') {
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
        
        <div className={`fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-50 transition-transform duration-300 ${
          onClose ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="carzino-filter-container h-full overflow-y-auto">
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
      <div className="p-4">
        {/* Mobile Header */}
        {isMobile && (
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Filters</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}

        {/* Search Section */}
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search Vehicles"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-600"
            />
            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600">
              <Search className="w-4 h-4" style={{ color: '#dc2626' }} />
            </button>
          </div>
        </div>

        {/* Applied Filters */}
        {activeFilterCount > 0 && (
          <div className="mb-4 pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-normal text-gray-900">Applied Filters</h3>
              <button
                onClick={clearAllFilters}
                className="bg-red-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-red-700"
                style={{ backgroundColor: '#dc2626' }}
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Applied filters display */}
              {Object.entries(filters).map(([key, value]) => {
                if (!value || value.length === 0 || key === 'radius' || key === 'termLength' || key === 'interestRate' || key === 'downPayment' || key === 'zipCode') {
                  return null;
                }
                
                if (Array.isArray(value)) {
                  return value.map((item) => (
                    <span key={`${key}-${item}`} className="carzino-filter-pill">
                      <Check className="w-3 h-3" style={{ color: '#dc2626' }} />
                      {item}
                      <button 
                        onClick={() => removeAppliedFilter(key, item)}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  ));
                }
                
                if (key === 'priceMin' && (filters.priceMin || filters.priceMax)) {
                  return (
                    <span key="price-range" className="carzino-filter-pill">
                      <Check className="w-3 h-3" style={{ color: '#dc2626' }} />
                      ${filters.priceMin || '0'} - ${filters.priceMax || 'Any'}
                      <button 
                        onClick={() => removeAppliedFilter('priceMin', '')}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  );
                }
                
                if (key === 'paymentMin' && (filters.paymentMin || filters.paymentMax)) {
                  return (
                    <span key="payment-range" className="carzino-filter-pill">
                      <Check className="w-3 h-3" style={{ color: '#dc2626' }} />
                      ${filters.paymentMin || '0'} - ${filters.paymentMax || 'Any'}/mo
                      <button 
                        onClick={() => removeAppliedFilter('paymentMin', '')}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  );
                }
                
                if (key !== 'priceMax' && key !== 'paymentMax' && value && value !== '') {
                  return (
                    <span key={key} className="carzino-filter-pill">
                      <Check className="w-3 h-3" style={{ color: '#dc2626' }} />
                      {value}
                      <button 
                        onClick={() => removeAppliedFilter(key, value)}
                        className="ml-1 text-white hover:text-gray-300"
                      >
                        ×
                      </button>
                    </span>
                  );
                }
                
                return null;
              })}
            </div>
          </div>
        )}

        {/* Distance */}
        <div className="mb-4 pb-4 border-b border-gray-200">
          <label className="block mb-2 text-base font-normal text-gray-900">Distance</label>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="ZIP Code"
              value={filters.zipCode || ''}
              onChange={(e) => handleFilterChange('zipCode', e.target.value, true)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-600"
            />
            <select
              value={filters.radius || '10'}
              onChange={(e) => handleFilterChange('radius', e.target.value, true)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-600"
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
          <div className="space-y-1">
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
              className="carzino-show-more text-red-600 hover:text-red-700 text-sm mt-3 px-3 py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-all duration-200 font-medium w-full"
            >
              {showMoreMakes ? '↑ Show Less' : '↓ Show More'} ({allMakes.length - 8} more)
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
            <div className="space-y-1">
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
        </FilterSection>

        {/* Vehicle Type */}
        <FilterSection 
          title="Vehicle Type"
          isCollapsed={collapsedFilters.vehicleType}
          onToggle={() => toggleFilter('vehicleType')}
          count={getFilterCount('vehicleType')}
        >
          <div className="space-y-1">
            {bodyTypes.map((type) => (
              <CheckboxOption
                key={type.name}
                label={type.name}
                count={type.count}
                value={type.name}
                category="vehicleType"
                checked={filters.vehicleType?.includes(type.name)}
                onChange={handleFilterChange}
              />
            ))}
          </div>
        </FilterSection>

        {/* Exterior Color */}
        <FilterSection 
          title="Exterior Color"
          isCollapsed={collapsedFilters.exteriorColor}
          onToggle={() => toggleFilter('exteriorColor')}
          count={getFilterCount('exteriorColor')}
        >
          <div className="space-y-1">
            {exteriorColors.map((color) => (
              <ColorSwatch
                key={color.name}
                color={color.hex}
                name={color.name}
                count={color.count}
                category="exteriorColor"
                checked={filters.exteriorColor?.includes(color.name)}
                onChange={handleFilterChange}
              />
            ))}
          </div>
        </FilterSection>

        {/* Mobile Footer */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex gap-4 z-50 shadow-lg">
            <button
              onClick={clearAllFilters}
              className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 relative disabled:opacity-50"
              disabled={activeFilterCount === 0}
            >
              Clear {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 text-white rounded-xl font-semibold hover:bg-red-700 transition-all duration-200 relative shadow-lg"
              style={{ backgroundColor: '#dc2626' }}
            >
              Apply Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full w-7 h-7 flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }
};

export default VehicleSearchFilter;

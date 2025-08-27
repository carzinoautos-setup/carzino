import React, { useState, memo, useCallback, useMemo, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

// ============================================
// BUILDER.IO COMPATIBLE STYLES
// ============================================
const styles = {
  container: {
    fontFamily: "'Albert Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    backgroundColor: '#ffffff',
    width: '290px'
  },

  filterSection: {
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '12px',
    marginBottom: '16px'
  },

  filterHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    padding: '8px 8px',
    marginLeft: '-8px',
    marginRight: '-8px',
    borderRadius: '8px',
    transition: 'background-color 0.15s'
  },

  filterHeaderHover: {
    backgroundColor: '#f9fafb'
  },

  filterTitle: {
    fontSize: '16px',
    fontWeight: 600,
    margin: 0,
    pointerEvents: 'none',
    color: '#111827'
  },

  filterTitleMobile: {
    fontSize: '18px'
  },

  chevron: {
    width: '20px',
    height: '20px',
    color: '#dc2626',
    transition: 'transform 0.2s',
    pointerEvents: 'none'
  },

  chevronMobile: {
    width: '24px',
    height: '24px'
  },

  chevronRotated: {
    transform: 'rotate(180deg)'
  },

  checkboxWrapper: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    position: 'relative'
  },

  checkboxWrapperMobile: {
    padding: '12px'
  },

  checkboxWrapperHover: {
    backgroundColor: '#f9fafb'
  },

  checkbox: {
    appearance: 'none',
    WebkitAppearance: 'none',
    width: '16px',
    height: '16px',
    border: '1px solid #d1d5db',
    borderRadius: '3px',
    backgroundColor: 'white',
    position: 'relative',
    cursor: 'pointer',
    transition: 'all 150ms ease',
    flexShrink: 0,
    marginRight: '8px'
  },

  checkboxMobile: {
    width: '18px',
    height: '18px',
    marginRight: '12px'
  },

  checkboxChecked: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626'
  },

  checkboxCheckmark: {
    position: 'absolute',
    left: '2px',
    top: '-2px',
    color: 'white',
    fontSize: '12px',
    pointerEvents: 'none'
  },

  optionLabel: {
    fontSize: '14px',
    fontWeight: 400,
    flex: 1,
    color: '#374151'
  },

  optionLabelMobile: {
    fontSize: '16px'
  },

  optionCount: {
    fontSize: '14px',
    fontWeight: 400,
    color: '#6B7280',
    marginLeft: '8px'
  },

  optionCountMobile: {
    fontSize: '16px'
  },

  searchInput: {
    width: '100%',
    padding: '12px 16px',
    paddingRight: '48px',
    border: '1px solid #d1d5db',
    borderRadius: '12px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontFamily: "'Albert Sans', -apple-system, BlinkMacSystemFont, sans-serif"
  },

  searchInputMobile: {
    fontSize: '16px',
    padding: '16px 20px',
    paddingRight: '56px'
  },

  searchInputFocus: {
    borderColor: '#dc2626',
    boxShadow: '0 0 0 3px rgba(220, 38, 38, 0.1)'
  },

  input: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontFamily: "'Albert Sans', -apple-system, BlinkMacSystemFont, sans-serif"
  },

  inputMobile: {
    fontSize: '16px',
    padding: '16px'
  },

  inputFocus: {
    borderColor: '#dc2626',
    boxShadow: '0 0 0 3px rgba(220, 38, 38, 0.1)'
  },

  select: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontFamily: "'Albert Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    backgroundColor: 'white'
  },

  selectMobile: {
    fontSize: '16px',
    padding: '16px'
  },

  selectFocus: {
    borderColor: '#dc2626',
    boxShadow: '0 0 0 3px rgba(220, 38, 38, 0.1)'
  },

  filterPill: {
    backgroundColor: '#000000',
    color: '#ffffff',
    borderRadius: '9999px',
    fontSize: '12px',
    padding: '6px 12px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    margin: '2px'
  },

  filterPillMobile: {
    fontSize: '14px',
    padding: '8px 16px'
  },

  clearButton: {
    backgroundColor: '#dc2626',
    color: 'white',
    padding: '6px 16px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.15s'
  },

  clearButtonMobile: {
    fontSize: '14px',
    padding: '8px 20px'
  },

  clearButtonHover: {
    backgroundColor: '#b91c1c'
  },

  showMoreButton: {
    color: '#dc2626',
    fontSize: '14px',
    fontWeight: 500,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    padding: '8px 0',
    marginTop: '8px'
  },

  showMoreButtonMobile: {
    fontSize: '16px'
  },

  colorSwatch: {
    width: '16px',
    height: '16px',
    borderRadius: '2px',
    border: '1px solid #d1d5db',
    marginRight: '8px',
    flexShrink: 0
  },

  colorSwatchMobile: {
    width: '20px',
    height: '20px',
    marginRight: '12px'
  },

  distanceContainer: {
    marginBottom: '24px',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px'
  },

  distanceContainerMobile: {
    backgroundColor: '#f9fafb',
    padding: '20px'
  },

  sectionLabel: {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '12px',
    display: 'block',
    color: '#111827'
  },

  sectionLabelMobile: {
    fontSize: '18px',
    marginBottom: '16px'
  }
};

// Add global font import
const addGlobalStyles = () => {
  // Add Google Fonts
  if (!document.querySelector('link[href*="Albert+Sans"]')) {
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Albert+Sans:wght@300;400;500;600;700;800&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
  }
};

// ============================================
// FILTER SECTION COMPONENTS
// ============================================

const FilterSection = memo(({ title, isCollapsed, onToggle, children, count, isMobile = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div style={styles.filterSection}>
      <div
        style={{
          ...styles.filterHeader,
          ...(isHovered ? styles.filterHeaderHover : {})
        }}
        onClick={onToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <h3 style={{
          ...styles.filterTitle,
          ...(isMobile ? styles.filterTitleMobile : {})
        }}>{title}</h3>
        <ChevronDown
          style={{
            ...styles.chevron,
            ...(isMobile ? styles.chevronMobile : {}),
            ...(!isCollapsed ? styles.chevronRotated : {})
          }}
        />
      </div>
      {!isCollapsed && (
        <div style={{ marginTop: isMobile ? '12px' : '8px' }} onClick={(e) => e.stopPropagation()}>
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
  const [isHovered, setIsHovered] = useState(false);

  return (
    <label
      style={{
        ...styles.checkboxWrapper,
        ...(isMobile ? styles.checkboxWrapperMobile : {}),
        ...(isHovered ? styles.checkboxWrapperHover : {})
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <input
        type="checkbox"
        style={{
          ...styles.checkbox,
          ...(isMobile ? styles.checkboxMobile : {}),
          ...(checked ? styles.checkboxChecked : {})
        }}
        checked={checked}
        onChange={(e) => onChange(category, value, e.target.checked)}
      />
      {checked && (
        <span style={{
          ...styles.checkboxCheckmark,
          left: isMobile ? '14px' : '10px',
          top: isMobile ? '14px' : '6px'
        }}>✓</span>
      )}
      <span style={{
        ...styles.optionLabel,
        ...(isMobile ? styles.optionLabelMobile : {})
      }}>{label}</span>
      {count !== undefined && (
        <span style={{
          ...styles.optionCount,
          ...(isMobile ? styles.optionCountMobile : {})
        }}>({count.toLocaleString()})</span>
      )}
    </label>
  );
});

const PriceRangeInput = memo(({ min, max, onMinChange, onMaxChange, isMobile = false }) => {
  const [localMin, setLocalMin] = useState(min || '');
  const [localMax, setLocalMax] = useState(max || '');
  const [minFocused, setMinFocused] = useState(false);
  const [maxFocused, setMaxFocused] = useState(false);

  const handleMinBlur = useCallback(() => {
    onMinChange(localMin);
    setMinFocused(false);
  }, [localMin, onMinChange]);

  const handleMaxBlur = useCallback(() => {
    onMaxChange(localMax);
    setMaxFocused(false);
  }, [localMax, onMaxChange]);

  return (
    <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
      <input
        type="text"
        placeholder="$10,000"
        value={localMin}
        onChange={(e) => setLocalMin(e.target.value.replace(/[^0-9]/g, ''))}
        onBlur={handleMinBlur}
        onFocus={() => setMinFocused(true)}
        style={{
          ...styles.input,
          ...(isMobile ? styles.inputMobile : {}),
          ...(minFocused ? styles.inputFocus : {}),
          width: '50%'
        }}
      />
      <input
        type="text"
        placeholder="$100,000"
        value={localMax}
        onChange={(e) => setLocalMax(e.target.value.replace(/[^0-9]/g, ''))}
        onBlur={handleMaxBlur}
        onFocus={() => setMaxFocused(true)}
        style={{
          ...styles.input,
          ...(isMobile ? styles.inputMobile : {}),
          ...(maxFocused ? styles.inputFocus : {}),
          width: '50%'
        }}
      />
    </div>
  );
});

const PaymentCalculator = memo(({ filters, onChange, isMobile = false }) => {
  const [focusedInput, setFocusedInput] = useState(null);

  const inputStyle = (inputName) => ({
    ...styles.input,
    ...(isMobile ? styles.inputMobile : {}),
    ...(focusedInput === inputName ? styles.inputFocus : {}),
    width: '100%'
  });

  const selectStyle = {
    ...styles.select,
    ...(isMobile ? styles.selectMobile : {}),
    ...(focusedInput === 'termLength' ? styles.selectFocus : {}),
    width: '100%'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{
            position: 'absolute',
            left: isMobile ? '16px' : '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6B7280',
            fontSize: isMobile ? '16px' : '14px',
            pointerEvents: 'none'
          }}>$</span>
          <input
            type="text"
            placeholder="100"
            value={filters.paymentMin || ''}
            onChange={(e) => onChange('paymentMin', e.target.value.replace(/[^0-9]/g, ''), true)}
            onFocus={() => setFocusedInput('paymentMin')}
            onBlur={() => setFocusedInput(null)}
            style={{
              ...inputStyle('paymentMin'),
              paddingLeft: isMobile ? '40px' : '32px',
              paddingRight: isMobile ? '48px' : '40px'
            }}
          />
          <span style={{
            position: 'absolute',
            right: isMobile ? '16px' : '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6B7280',
            fontSize: isMobile ? '14px' : '12px',
            pointerEvents: 'none'
          }}>/mo</span>
        </div>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{
            position: 'absolute',
            left: isMobile ? '16px' : '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6B7280',
            fontSize: isMobile ? '16px' : '14px',
            pointerEvents: 'none'
          }}>$</span>
          <input
            type="text"
            placeholder="2,000"
            value={filters.paymentMax || ''}
            onChange={(e) => onChange('paymentMax', e.target.value.replace(/[^0-9]/g, ''), true)}
            onFocus={() => setFocusedInput('paymentMax')}
            onBlur={() => setFocusedInput(null)}
            style={{
              ...inputStyle('paymentMax'),
              paddingLeft: isMobile ? '40px' : '32px',
              paddingRight: isMobile ? '48px' : '40px'
            }}
          />
          <span style={{
            position: 'absolute',
            right: isMobile ? '16px' : '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6B7280',
            fontSize: isMobile ? '14px' : '12px',
            pointerEvents: 'none'
          }}>/mo</span>
        </div>
      </div>

      <div>
        <label style={{
          ...styles.sectionLabel,
          ...(isMobile ? styles.sectionLabelMobile : {})
        }}>
          Term Length
        </label>
        <select
          value={filters.termLength || '72'}
          onChange={(e) => onChange('termLength', e.target.value, true)}
          onFocus={() => setFocusedInput('termLength')}
          onBlur={() => setFocusedInput(null)}
          style={selectStyle}
        >
          <option value="36">36 months</option>
          <option value="48">48 months</option>
          <option value="60">60 months</option>
          <option value="72">72 months</option>
          <option value="84">84 months</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label style={{
            ...styles.sectionLabel,
            ...(isMobile ? styles.sectionLabelMobile : {})
          }}>
            Interest Rate
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="8"
              value={filters.interestRate || ''}
              onChange={(e) => onChange('interestRate', e.target.value.replace(/[^0-9.]/g, ''), true)}
              onFocus={() => setFocusedInput('interestRate')}
              onBlur={() => setFocusedInput(null)}
              style={{
                ...inputStyle('interestRate'),
                paddingRight: isMobile ? '32px' : '28px'
              }}
            />
            <span style={{
              position: 'absolute',
              right: isMobile ? '16px' : '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6B7280',
              fontSize: isMobile ? '16px' : '14px',
              pointerEvents: 'none'
            }}>%</span>
          </div>
        </div>

        <div>
          <label style={{
            ...styles.sectionLabel,
            ...(isMobile ? styles.sectionLabelMobile : {})
          }}>
            Down Payment
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: isMobile ? '16px' : '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6B7280',
              fontSize: isMobile ? '16px' : '14px',
              pointerEvents: 'none'
            }}>$</span>
            <input
              type="text"
              placeholder="2,000"
              value={filters.downPayment || ''}
              onChange={(e) => onChange('downPayment', e.target.value.replace(/[^0-9]/g, ''), true)}
              onFocus={() => setFocusedInput('downPayment')}
              onBlur={() => setFocusedInput(null)}
              style={{
                ...inputStyle('downPayment'),
                paddingLeft: isMobile ? '40px' : '32px'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

const ColorSwatch = memo(({ color, name, count, checked, onChange, category, isMobile = false }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <label
      style={{
        ...styles.checkboxWrapper,
        ...(isMobile ? styles.checkboxWrapperMobile : {}),
        ...(isHovered ? styles.checkboxWrapperHover : {})
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <input
        type="checkbox"
        style={{
          ...styles.checkbox,
          ...(isMobile ? styles.checkboxMobile : {}),
          ...(checked ? styles.checkboxChecked : {})
        }}
        checked={checked}
        onChange={(e) => onChange(category, name, e.target.checked)}
      />
      {checked && (
        <span style={{
          ...styles.checkboxCheckmark,
          left: isMobile ? '14px' : '10px',
          top: isMobile ? '14px' : '6px'
        }}>✓</span>
      )}
      <div
        style={{
          ...styles.colorSwatch,
          ...(isMobile ? styles.colorSwatchMobile : {}),
          backgroundColor: color
        }}
      />
      <span style={{
        ...styles.optionLabel,
        ...(isMobile ? styles.optionLabelMobile : {})
      }}>{name}</span>
      <span style={{
        ...styles.optionCount,
        ...(isMobile ? styles.optionCountMobile : {})
      }}>({count.toLocaleString()})</span>
    </label>
  );
});

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

  // Focus states for better styling
  const [searchFocused, setSearchFocused] = useState(false);
  const [zipFocused, setZipFocused] = useState(false);
  const [radiusFocused, setRadiusFocused] = useState(false);
  
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

  // Add global styles on mount
  useEffect(() => {
    addGlobalStyles();
  }, []);

  // Mobile bottom sheet overlay
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 40,
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? 'auto' : 'none',
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onClick={onClose}
        />

        {/* Bottom Sheet */}
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#ffffff',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            boxShadow: '0 -10px 25px rgba(0, 0, 0, 0.2), 0 -4px 12px rgba(0, 0, 0, 0.1)',
            zIndex: 50,
            maxHeight: '90vh',
            transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            fontFamily: "'Albert Sans', -apple-system, BlinkMacSystemFont, sans-serif"
          }}
        >
          {/* Drag Handle */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              paddingTop: '16px',
              paddingBottom: '8px'
            }}
          >
            <div
              style={{
                width: '48px',
                height: '4px',
                backgroundColor: '#d1d5db',
                borderRadius: '2px'
              }}
            />
          </div>

          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid #f3f4f6'
            }}
          >
            <h2
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#111827',
                margin: 0
              }}
            >
              Filter Vehicles
            </h2>
            <button
              onClick={onClose}
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '50%',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              aria-label="Close filters"
            >
              <X style={{ width: '24px', height: '24px', color: '#6b7280' }} />
            </button>
          </div>

          {/* Content */}
          <div
            style={{
              overflowY: 'auto',
              maxHeight: 'calc(90vh - 160px)',
              paddingBottom: '120px'
            }}
          >
            <div style={{ padding: '24px' }}>
              <FilterContent />
            </div>
          </div>

          {/* Bottom Actions */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#ffffff',
              borderTop: '1px solid #e5e7eb',
              padding: '20px 24px',
              display: 'flex',
              gap: '12px',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)'
            }}
          >
            <button
              onClick={clearAllFilters}
              disabled={activeFilterCount === 0}
              style={{
                flex: 1,
                padding: '16px 24px',
                backgroundColor: activeFilterCount === 0 ? '#f3f4f6' : '#f9fafb',
                color: activeFilterCount === 0 ? '#9ca3af' : '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: activeFilterCount === 0 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "'Albert Sans', -apple-system, BlinkMacSystemFont, sans-serif"
              }}
              onMouseEnter={(e) => {
                if (activeFilterCount > 0) {
                  e.target.style.backgroundColor = '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                if (activeFilterCount > 0) {
                  e.target.style.backgroundColor = '#f9fafb';
                }
              }}
            >
              Clear {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '16px 24px',
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: '16px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontFamily: "'Albert Sans', -apple-system, BlinkMacSystemFont, sans-serif",
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
            >
              Apply Filters
              {activeFilterCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    fontSize: '12px',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700'
                  }}
                >
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
    <div className="carzino-filter-container" style={styles.container}>
      <FilterContent />
    </div>
  );

  // Filter content
  function FilterContent() {
    return (
      <div className={isMobile ? "p-0" : "p-4"}>
        {/* Mobile header is now handled in the bottom sheet */}

        {/* Search Section */}
        <div style={{
          marginBottom: '24px',
          ...(isMobile ? {} : { paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' })
        }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search Vehicles"
              style={{
                ...styles.searchInput,
                ...(isMobile ? styles.searchInputMobile : {}),
                ...(searchFocused ? styles.searchInputFocus : {})
              }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <button style={{
              position: 'absolute',
              right: isMobile ? '20px' : '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#dc2626',
              padding: '4px',
              border: 'none',
              background: 'none',
              cursor: 'pointer'
            }}>
              <Search style={{
                width: isMobile ? '24px' : '16px',
                height: isMobile ? '24px' : '16px',
                color: '#dc2626'
              }} />
            </button>
          </div>
        </div>

        {/* Applied Filters */}
        {activeFilterCount > 0 && (
          <div style={{
            marginBottom: '24px',
            ...(isMobile ? {} : { paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' })
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <h3 style={{
                ...styles.filterTitle,
                ...(isMobile ? styles.filterTitleMobile : {})
              }}>Applied Filters</h3>
              <button
                onClick={clearAllFilters}
                onMouseEnter={(e) => e.target.style.backgroundColor = styles.clearButtonHover.backgroundColor}
                onMouseLeave={(e) => e.target.style.backgroundColor = styles.clearButton.backgroundColor}
                style={{
                  ...styles.clearButton,
                  ...(isMobile ? styles.clearButtonMobile : {})
                }}
              >
                Clear All
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
                          <span key={`${category}-${index}`} style={{
                            ...styles.filterPill,
                            ...(isMobile ? styles.filterPillMobile : {})
                          }}>
                            <Check style={{ width: '12px', height: '12px', color: '#dc2626' }} />
                            {item}
                            <button
                              onClick={() => removeAppliedFilter(category, item)}
                              style={{
                                marginLeft: '4px',
                                color: 'white',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                fontSize: '16px',
                                lineHeight: '1'
                              }}
                              onMouseEnter={(e) => e.target.style.color = '#d1d5db'}
                              onMouseLeave={(e) => e.target.style.color = 'white'}
                            >
                              ×
                            </button>
                          </span>
                        );
                      }
                    });
                  } else if (value && typeof value === 'string' && value.trim() !== '' && value !== (defaultValues[category] || '')) {
                    filterPills.push(
                      <span key={category} style={{
                        ...styles.filterPill,
                        ...(isMobile ? styles.filterPillMobile : {})
                      }}>
                        <Check style={{ width: '12px', height: '12px', color: '#dc2626' }} />
                        {value}
                        <button
                          onClick={() => removeAppliedFilter(category, value)}
                          style={{
                            marginLeft: '4px',
                            color: 'white',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            fontSize: '16px',
                            lineHeight: '1'
                          }}
                          onMouseEnter={(e) => e.target.style.color = '#d1d5db'}
                          onMouseLeave={(e) => e.target.style.color = 'white'}
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
                      <span key="price" style={{
                        ...styles.filterPill,
                        ...(isMobile ? styles.filterPillMobile : {})
                      }}>
                        <Check style={{ width: '12px', height: '12px', color: '#dc2626' }} />
                        {priceRange.join(' to ')}
                        <button
                          onClick={() => removeAppliedFilter('priceMin', '')}
                          style={{
                            marginLeft: '4px',
                            color: 'white',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            fontSize: '16px',
                            lineHeight: '1'
                          }}
                          onMouseEnter={(e) => e.target.style.color = '#d1d5db'}
                          onMouseLeave={(e) => e.target.style.color = 'white'}
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
                      <span key="payment" style={{
                        ...styles.filterPill,
                        ...(isMobile ? styles.filterPillMobile : {})
                      }}>
                        <Check style={{ width: '12px', height: '12px', color: '#dc2626' }} />
                        {paymentRange.join(' to ')}
                        <button
                          onClick={() => removeAppliedFilter('paymentMin', '')}
                          style={{
                            marginLeft: '4px',
                            color: 'white',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            fontSize: '16px',
                            lineHeight: '1'
                          }}
                          onMouseEnter={(e) => e.target.style.color = '#d1d5db'}
                          onMouseLeave={(e) => e.target.style.color = 'white'}
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
        <div style={{
          ...styles.distanceContainer,
          ...(isMobile ? styles.distanceContainerMobile : {})
        }}>
          <label style={{
            ...styles.sectionLabel,
            ...(isMobile ? styles.sectionLabelMobile : {})
          }}>Distance</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="ZIP Code"
              value={filters.zipCode || '98498'}
              onChange={(e) => handleFilterChange('zipCode', e.target.value, true)}
              onFocus={() => setZipFocused(true)}
              onBlur={() => setZipFocused(false)}
              style={{
                ...styles.input,
                ...(isMobile ? styles.inputMobile : {}),
                ...(zipFocused ? styles.inputFocus : {}),
                width: '100%',
                borderRadius: '12px'
              }}
            />
            <select
              value={filters.radius || '200'}
              onChange={(e) => handleFilterChange('radius', e.target.value, true)}
              onFocus={() => setRadiusFocused(true)}
              onBlur={() => setRadiusFocused(false)}
              style={{
                ...styles.select,
                ...(isMobile ? styles.selectMobile : {}),
                ...(radiusFocused ? styles.selectFocus : {}),
                width: '100%',
                borderRadius: '12px'
              }}
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
                  isMobile={isMobile}
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
              style={{
                ...styles.showMoreButton,
                ...(isMobile ? styles.showMoreButtonMobile : {})
              }}
              onMouseEnter={(e) => e.target.style.color = '#b91c1c'}
              onMouseLeave={(e) => e.target.style.color = '#dc2626'}
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
                    isMobile={isMobile}
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
                style={{
                  ...styles.showMoreButton,
                  ...(isMobile ? styles.showMoreButtonMobile : {})
                }}
                onMouseEnter={(e) => e.target.style.color = '#b91c1c'}
                onMouseLeave={(e) => e.target.style.color = '#dc2626'}
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
            isMobile={isMobile}
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
            isMobile={isMobile}
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
                  isMobile={isMobile}
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
                  isMobile={isMobile}
                />
                <CheckboxOption
                  label="Used"
                  count={78800}
                  value="Used"
                  category="condition"
                  checked={filters.condition?.includes('Used')}
                  onChange={handleFilterChange}
                  isMobile={isMobile}
                />
                <CheckboxOption
                  label="Certified"
                  count={9889}
                  value="Certified"
                  category="condition"
                  checked={filters.condition?.includes('Certified')}
                  onChange={handleFilterChange}
                  isMobile={isMobile}
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
                  isMobile={isMobile}
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
                  isMobile={isMobile}
                />
                <CheckboxOption
                  label="SUV"
                  count={3405}
                  value="SUV"
                  category="vehicleType"
                  checked={filters.vehicleType?.includes('SUV')}
                  onChange={handleFilterChange}
                  isMobile={isMobile}
                />
                <CheckboxOption
                  label="Truck"
                  count={2217}
                  value="Truck"
                  category="vehicleType"
                  checked={filters.vehicleType?.includes('Truck')}
                  onChange={handleFilterChange}
                  isMobile={isMobile}
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
                  isMobile={isMobile}
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
                  isMobile={isMobile}
                />
                <CheckboxOption
                  label="FWD"
                  count={12057}
                  value="FWD"
                  category="driveType"
                  checked={filters.driveType?.includes('FWD')}
                  onChange={handleFilterChange}
                  isMobile={isMobile}
                />
                <CheckboxOption
                  label="RWD"
                  count={5883}
                  value="RWD"
                  category="driveType"
                  checked={filters.driveType?.includes('RWD')}
                  onChange={handleFilterChange}
                  isMobile={isMobile}
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
                  isMobile={isMobile}
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
                  isMobile={isMobile}
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
                  isMobile={isMobile}
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
                  isMobile={isMobile}
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
                  isMobile={isMobile}
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
                  isMobile={isMobile}
                />
              ))}
            </div>
            {allTrims.length > 8 && (
              <button
                onClick={() => setShowMoreTrims(!showMoreTrims)}
                style={{
                  ...styles.showMoreButton,
                  ...(isMobile ? styles.showMoreButtonMobile : {})
                }}
                onMouseEnter={(e) => e.target.style.color = '#b91c1c'}
                onMouseLeave={(e) => e.target.style.color = '#dc2626'}
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

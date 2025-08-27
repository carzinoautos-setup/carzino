import React, { useState, useEffect } from 'react';

// ================================================================================
// INLINE SVG ICONS (No external dependencies)
// ================================================================================

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const SlidersIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
);

const HeartIcon = ({ filled = false, className = "w-5 h-5" }) => (
  <svg className={className} fill={filled ? "#dc2626" : "none"} stroke="#dc2626" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} stroke="#dc2626" d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SortIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 4h12M2 8h8M2 12h4" />
  </svg>
);

// ================================================================================
// MAIN COMPONENT
// ================================================================================

const SearchResultsHeader = ({
  totalResults = 0,
  currentPage = 1,
  itemsPerPage = 20,
  startResult = 0,
  endResult = 0,
  searchTime = 0,
  currentFilters = {},
  viewMode = 'all',
  onViewModeChange,
  sortBy = 'relevance',
  onSortChange,
  onItemsPerPageChange,
  onMobileFiltersOpen,
  favoritesCount = 0,
  showingFavorites = false,
  onToggleFavorites,
  onSearch,
  isMobile = false
}) => {
  // State Management
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [screenSize, setScreenSize] = useState('desktop');
  
  // Responsive Detection
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width <= 640) {
        setScreenSize('mobile');
      } else if (width <= 991) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate active filters for display
  const getActiveFilters = () => {
    const filters = [];
    const processedCategories = new Set();

    Object.entries(currentFilters).forEach(([key, value]) => {
      // Skip system/config fields
      if (key === 'radius' || key === 'termLength' || key === 'interestRate' || key === 'downPayment' || key === 'zipCode') {
        return;
      }

      // Handle array-based filters
      if (Array.isArray(value) && value.length > 0) {
        value.forEach(item => {
          if (item && item.toString().trim() !== '') {
            filters.push({ category: key, value: item.toString().trim() });
          }
        });
      }
      // Handle price range
      else if ((key === 'priceMin' || key === 'priceMax') && !processedCategories.has('price')) {
        const priceRange = [];
        if (currentFilters.priceMin && currentFilters.priceMin.toString().trim() !== '') {
          priceRange.push(`$${currentFilters.priceMin}+`);
        }
        if (currentFilters.priceMax && currentFilters.priceMax.toString().trim() !== '') {
          priceRange.push(`$${currentFilters.priceMax}-`);
        }
        if (priceRange.length > 0) {
          filters.push({ category: 'price', value: priceRange.join(' to ') });
          processedCategories.add('price');
        }
      }
      // Handle payment range
      else if ((key === 'paymentMin' || key === 'paymentMax') && !processedCategories.has('payment')) {
        const paymentRange = [];
        if (currentFilters.paymentMin && currentFilters.paymentMin.toString().trim() !== '') {
          paymentRange.push(`$${currentFilters.paymentMin}+`);
        }
        if (currentFilters.paymentMax && currentFilters.paymentMax.toString().trim() !== '') {
          paymentRange.push(`$${currentFilters.paymentMax}-`);
        }
        if (paymentRange.length > 0) {
          filters.push({ category: 'payment', value: paymentRange.join(' to ') });
          processedCategories.add('payment');
        }
      }
      // Handle single value filters
      else if (value && value.toString().trim() !== '' && key !== 'priceMin' && key !== 'priceMax' && key !== 'paymentMin' && key !== 'paymentMax') {
        filters.push({ category: key, value: value.toString().trim() });
      }
    });

    return filters;
  };

  const activeFilters = getActiveFilters();
  const activeFilterCount = activeFilters.length;

  // Filter Management Functions
  const removeAppliedFilter = (category, value) => {
    console.log('Remove filter:', category, value);
    // This would typically call a parent function to update filters
  };

  const clearAllFilters = () => {
    console.log('Clear all filters');
    // This would typically call a parent function to clear all filters
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const isMobileOrTablet = screenSize === 'mobile' || screenSize === 'tablet';

  // ================================================================================
  // ALL CSS STYLES (INLINE - NO EXTERNAL FILES) - WITH ALBERT SANS FONT
  // ================================================================================
  
  const styles = `
    /* Google Fonts - Albert Sans */
    @import url('https://fonts.googleapis.com/css2?family=Albert+Sans:wght@300;400;500;600;700;800&display=swap');

    /* Reset & Base Styles */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    .search-header-container {
      width: 100%;
      background: white;
      font-family: 'Albert Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }

    /* Typography */
    .header-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.75rem;
      font-family: 'Albert Sans', sans-serif;
    }

    .header-title-desktop {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      font-family: 'Albert Sans', sans-serif;
    }

    .header-subtitle {
      color: #6b7280;
      font-size: 0.875rem;
      margin-top: 0.25rem;
      font-family: 'Albert Sans', sans-serif;
    }

    /* Search Input */
    .search-container {
      position: relative;
    }

    .search-input {
      width: 100%;
      padding: 0.625rem 2.5rem 0.625rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.2s;
      font-family: 'Albert Sans', sans-serif;
    }

    .search-input:focus {
      border-color: #dc2626;
    }

    .search-button {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      color: #dc2626;
      padding: 0.25rem;
      background: none;
      border: none;
      cursor: pointer;
    }

    /* View Switcher */
    .view-switcher {
      display: inline-flex;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      padding: 2px;
    }

    .view-switcher button {
      padding: 6px 12px;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.375rem;
      border: none;
      cursor: pointer;
      background: transparent;
      color: #6b7280;
      font-family: 'Albert Sans', sans-serif;
    }

    .view-switcher button.active {
      background: #dc2626;
      color: white;
    }

    .view-switcher button:not(.active):hover {
      color: #374151;
      background: #f9fafb;
    }

    /* ===== MOBILE STICKY HEADER ===== */
    .mobile-sticky-wrapper {
      position: -webkit-sticky;
      position: sticky;
      top: 0;
      z-index: 50;
      background: white;
      border-bottom: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
      -webkit-backdrop-filter: blur(8px);
      backdrop-filter: blur(8px);
    }

    /* Filter Pills */
    .filter-pills-section {
      padding: 0.75rem 0.75rem 0;
      background: white;
    }

    .filter-pills-container {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding-bottom: 0.75rem;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .filter-pills-container::-webkit-scrollbar {
      display: none;
    }

    .filter-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.375rem 0.75rem;
      background: black;
      color: white;
      border-radius: 9999px;
      font-size: 0.75rem;
      white-space: nowrap;
      flex-shrink: 0;
      border: none;
      cursor: pointer;
      font-family: 'Albert Sans', sans-serif;
    }

    .filter-pill-remove {
      margin-left: 0.25rem;
      color: white;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
    }

    .clear-all-button {
      background: #dc2626;
      color: white;
    }

    /* Mobile Controls Bar (Sticky Part) */
    .mobile-controls {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 0.5rem;
      padding: 0.75rem;
      background: white;
      flex-wrap: nowrap;
      overflow-x: auto;
    }

    .mobile-control-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
      background: none;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      cursor: pointer;
      color: #374151;
      font-family: 'Albert Sans', sans-serif;
      transition: all 0.2s;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .mobile-control-button:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }

    .mobile-control-button.favorites-active {
      color: #dc2626;
      border-color: #dc2626;
    }

    .control-divider {
      border-left: 1px solid #e5e7eb;
      height: 2rem;
    }

    .filter-count-badge {
      background: #dc2626;
      color: white;
      border-radius: 50%;
      min-width: 1.25rem;
      width: auto;
      height: 1.25rem;
      padding: 0 0.25rem;
      font-size: 0.75rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-family: 'Albert Sans', sans-serif;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* Toggle Switch */
    .toggle-switch {
      position: relative;
      width: 3rem;
      height: 1.5rem;
      border-radius: 9999px;
      transition: background-color 0.2s;
    }

    .toggle-switch.active {
      background: #dc2626;
    }

    .toggle-switch.inactive {
      background: #d1d5db;
    }

    .toggle-switch-handle {
      position: absolute;
      top: 0.125rem;
      width: 1.25rem;
      height: 1.25rem;
      background: white;
      border-radius: 50%;
      transition: transform 0.2s;
    }

    .toggle-switch.active .toggle-switch-handle {
      transform: translateX(1.5rem);
    }

    .toggle-switch.inactive .toggle-switch-handle {
      transform: translateX(0.125rem);
    }

    /* Dropdown */
    .dropdown {
      position: relative;
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 0.25rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
      z-index: 60;
      min-width: 12rem;
    }

    .dropdown-item {
      display: block;
      width: 100%;
      text-align: left;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      background: none;
      border: none;
      cursor: pointer;
      color: #374151;
      transition: background-color 0.15s;
      font-family: 'Albert Sans', sans-serif;
    }

    .dropdown-item:hover {
      background: #f9fafb;
    }

    .dropdown-item:first-child {
      border-radius: 0.5rem 0.5rem 0 0;
    }

    .dropdown-item:last-child {
      border-radius: 0 0 0.5rem 0.5rem;
    }

    /* Results Count Bar */
    .results-count {
      padding: 0.5rem 0.75rem;
      background: #f9fafb;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      font-family: 'Albert Sans', sans-serif;
    }

    /* Desktop Styles */
    .desktop-header {
      padding: 1rem;
      background: white;
    }

    .desktop-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .desktop-controls {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .desktop-select {
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      outline: none;
      background: white;
      cursor: pointer;
      transition: border-color 0.2s;
      font-family: 'Albert Sans', sans-serif;
    }

    .desktop-select:hover {
      border-color: #9ca3af;
    }

    .desktop-select:focus {
      border-color: #dc2626;
    }

    .favorites-button {
      padding: 0.5rem;
      border: 1px solid #dc2626;
      border-radius: 0.375rem;
      background: white;
      position: relative;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .favorites-button:hover {
      background: #fef2f2;
    }

    .favorites-button-icon {
      color: #dc2626;
    }

    .favorites-button-icon.filled {
      fill: #dc2626;
    }

    .favorites-count {
      position: absolute;
      top: -0.25rem;
      right: -0.25rem;
      background: #dc2626;
      color: white;
      font-size: 0.75rem;
      border-radius: 50%;
      width: 1.25rem;
      height: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Albert Sans', sans-serif;
    }

    /* Mobile/Tablet Section */
    .mobile-section {
      padding: 0.75rem;
      background: white;
    }

    /* Responsive Breakpoints */
    @media (max-width: 640px) {
      /* Mobile Only */
      .desktop-header {
        display: none !important;
      }
    }

    @media (min-width: 641px) and (max-width: 991px) {
      /* Tablet Only */
      .desktop-header {
        display: none !important;
      }
    }

    @media (min-width: 992px) {
      /* Desktop Only */
      .mobile-header {
        display: none !important;
      }
    }
  `;

  // ================================================================================
  // COMPONENT RENDER
  // ================================================================================

  return (
    <>
      <style>{styles}</style>
      <div className="search-header-container">
        
        {/* ===== MOBILE/TABLET VIEW (≤991px) ===== */}
        {isMobileOrTablet && (
          <div className="mobile-header">
            
            {/* NON-STICKY SECTION: Title & Search (scrolls away) */}
            <div className="mobile-section">
              <h1 className="header-title">
                {showingFavorites ? 'My Favorites' : 'Vehicles for Sale'}
              </h1>
              
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="search-button" onClick={handleSearch}>
                  <SearchIcon />
                </button>
              </div>
            </div>
            
            {/* STICKY SECTION: Filters & Controls (stays on top) */}
            <div className={mobileFiltersOpen ? '' : 'mobile-sticky-wrapper'}>
              
              {/* Applied Filter Pills (part of sticky) */}
              {activeFilters.length > 0 && (
                <div className="filter-pills-section">
                  <div className="filter-pills-container">
                    <button 
                      onClick={clearAllFilters}
                      className="filter-pill clear-all-button"
                    >
                      Clear All
                    </button>
                    {activeFilters.map((filter, index) => (
                      <span key={`${filter.category}-${index}`} className="filter-pill">
                        <CheckIcon />
                        {filter.value}
                        <button 
                          onClick={() => removeAppliedFilter(filter.category, filter.value)}
                          className="filter-pill-remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Control Bar: Filter | Sort | Favorites (sticky) */}
              <div className="mobile-controls">
                {/* Filter Button - Now showing as requested */}
                <button 
                  className="mobile-control-button"
                  onClick={() => onMobileFiltersOpen && onMobileFiltersOpen()}
                >
                  <SlidersIcon />
                  Filter
                  {activeFilterCount > 0 && (
                    <span className="filter-count-badge">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                
                <div className="control-divider" />
                
                {/* Sort Dropdown */}
                <div className="dropdown">
                  <button 
                    className="mobile-control-button"
                    onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                  >
                    <SortIcon />
                    Sort
                  </button>
                  {sortDropdownOpen && (
                    <div className="dropdown-menu">
                      <button 
                        onClick={() => { onSortChange('relevance'); setSortDropdownOpen(false); }} 
                        className="dropdown-item"
                      >
                        Relevance
                      </button>
                      <button 
                        onClick={() => { onSortChange('price_low'); setSortDropdownOpen(false); }} 
                        className="dropdown-item"
                      >
                        Price: Low to High
                      </button>
                      <button 
                        onClick={() => { onSortChange('price_high'); setSortDropdownOpen(false); }} 
                        className="dropdown-item"
                      >
                        Price: High to Low
                      </button>
                      <button 
                        onClick={() => { onSortChange('year_new'); setSortDropdownOpen(false); }} 
                        className="dropdown-item"
                      >
                        Year: Newest
                      </button>
                      <button 
                        onClick={() => { onSortChange('mileage_low'); setSortDropdownOpen(false); }} 
                        className="dropdown-item"
                      >
                        Mileage: Lowest
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="control-divider" />
                
                {/* Favorites Toggle */}
                <button 
                  className={`mobile-control-button ${showingFavorites ? 'favorites-active' : ''}`}
                  onClick={() => onToggleFavorites && onToggleFavorites()}
                >
                  Favorites
                  <div className={`toggle-switch ${showingFavorites ? 'active' : 'inactive'}`}>
                    <div className="toggle-switch-handle" />
                  </div>
                </button>
              </div>
            </div>
            
            {/* Results Count */}
            <div className="results-count">
              {showingFavorites 
                ? `${favoritesCount} Saved Vehicles` 
                : `${totalResults.toLocaleString()} Results`}
              {searchTime > 0 && !showingFavorites && (
                <span> • {searchTime}ms</span>
              )}
            </div>
          </div>
        )}

        {/* ===== DESKTOP VIEW (>991px) ===== */}
        {!isMobileOrTablet && (
          <div className="desktop-header">
            <div className="desktop-container">
              <div>
                <h1 className="header-title-desktop">
                  {showingFavorites ? 'My Favorites' : 'New and Used Vehicles for Sale'}
                </h1>
                <p className="header-subtitle">
                  {showingFavorites ? `${favoritesCount} Vehicles` : `${totalResults.toLocaleString()} Matches`}
                  {searchTime > 0 && !showingFavorites && (
                    <span> • Search: {searchTime}ms</span>
                  )}
                  {totalResults > itemsPerPage && !showingFavorites && (
                    <span> • Page {currentPage}</span>
                  )}
                </p>
              </div>
              
              <div className="desktop-controls">
                {/* Desktop Heart Icon - Always show with red outline */}
                <button 
                  className="favorites-button"
                  onClick={() => onToggleFavorites && onToggleFavorites()}
                >
                  <HeartIcon filled={favoritesCount > 0} className="w-5 h-5" />
                  {favoritesCount > 0 && (
                    <span className="favorites-count">
                      {favoritesCount}
                    </span>
                  )}
                </button>
                
                {/* Sort Dropdown */}
                <select 
                  value={sortBy}
                  onChange={(e) => onSortChange(e.target.value)}
                  className="desktop-select"
                >
                  <option value="relevance">Sort by Relevance</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="year_new">Year: Newest First</option>
                  <option value="mileage_low">Mileage: Low to High</option>
                </select>
                
                {/* Items Per Page */}
                <select 
                  value={itemsPerPage}
                  onChange={(e) => onItemsPerPageChange && onItemsPerPageChange(Number(e.target.value))}
                  className="desktop-select"
                >
                  <option value={10}>View: 10</option>
                  <option value={20}>View: 20</option>
                  <option value={30}>View: 30</option>
                  <option value={50}>View: 50</option>
                  <option value={100}>View: 100</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SearchResultsHeader;

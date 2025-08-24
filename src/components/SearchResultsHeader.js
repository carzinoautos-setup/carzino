import React, { useState } from 'react';
import { Filter, Search, Heart, Check, ChevronDown } from 'lucide-react';

const SearchResultsHeader = ({ 
  totalResults, 
  currentFilters,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  onMobileFiltersOpen,
  favoritesCount = 0,
  showingFavorites = false,
  onToggleFavorites,
  onRemoveFilter,
  onClearAllFilters,
  onSearch
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(30);

  // Calculate active filters for display
  const getActiveFilters = () => {
    const filters = [];
    Object.entries(currentFilters).forEach(([key, value]) => {
      if (key === 'radius' || key === 'termLength' || key === 'interestRate' || key === 'downPayment' || key === 'zipCode') {
        return;
      }
      if (Array.isArray(value) && value.length > 0) {
        value.forEach(item => filters.push({ category: key, value: item }));
      } else if (value && value !== '') {
        if (key === 'priceMin' || key === 'priceMax') {
          const existing = filters.find(f => f.category === 'price');
          if (!existing) {
            const priceRange = [];
            if (currentFilters.priceMin) priceRange.push(`$${currentFilters.priceMin}+`);
            if (currentFilters.priceMax) priceRange.push(`$${currentFilters.priceMax}-`);
            if (priceRange.length > 0) {
              filters.push({ category: 'price', value: priceRange.join(' to ') });
            }
          }
        } else if (key === 'paymentMin' || key === 'paymentMax') {
          const existing = filters.find(f => f.category === 'payment');
          if (!existing) {
            const paymentRange = [];
            if (currentFilters.paymentMin) paymentRange.push(`$${currentFilters.paymentMin}+`);
            if (currentFilters.paymentMax) paymentRange.push(`$${currentFilters.paymentMax}-`);
            if (paymentRange.length > 0) {
              filters.push({ category: 'payment', value: paymentRange.join(' to ') });
            }
          }
        } else {
          filters.push({ category: key, value });
        }
      }
    });
    return filters;
  };

  const activeFilters = getActiveFilters();
  const activeFilterCount = activeFilters.length;

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const sortOptions = [
    { value: 'relevance', label: 'Sort by Relevance' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'year_new', label: 'Year: Newest First' },
    { value: 'mileage_low', label: 'Mileage: Low to High' }
  ];


  return (
    <>
      <style>{`
        :root {
          --primary-red: #dc2626;
          --text-black: #000000;
          --text-gray: #6b7280;
          --text-gray-dark: #374151;
          --border-gray: #e5e7eb;
          --border-gray-dark: #9ca3af;
          --bg-gray-light: #f9fafb;
          --bg-white: #ffffff;
          --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
          --transition-fast: 0.2s ease;
        }

        .search-header {
          background: var(--bg-white);
          border-bottom: 1px solid var(--border-gray);
        }

        /* Mobile Header (0-767px) */
        .mobile-header {
          display: block;
        }

        .header-top {
          padding: 16px;
        }

        .page-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-black);
          margin: 0 0 16px 0;
        }

        .search-container {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }

        .search-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid var(--border-gray);
          border-radius: 8px;
          font-size: 16px;
          outline: none;
        }

        .search-input:focus {
          border-color: var(--primary-red);
        }

        .search-button {
          padding: 12px;
          background: var(--primary-red);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .search-button:hover {
          background: #b91c1c;
        }

        .sticky-wrapper {
          position: sticky;
          top: 0;
          z-index: 50;
          background: var(--bg-white);
          border-bottom: 1px solid var(--border-gray);
        }

        /* Applied Filters - Mobile Only */
        .applied-filters {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-gray);
        }

        .filter-pills-container {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 4px;
        }

        .clear-all-btn {
          background: var(--bg-gray-light);
          color: var(--text-gray-dark);
          border: 1px solid var(--border-gray);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          cursor: pointer;
          flex-shrink: 0;
        }

        .filter-pill {
          background: var(--text-black);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .filter-pill .check-icon {
          width: 12px;
          height: 12px;
          color: var(--primary-red);
        }

        .remove-filter {
          background: none;
          border: none;
          color: white;
          font-size: 16px;
          cursor: pointer;
          padding: 0;
          margin-left: 4px;
        }

        .control-bar {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          gap: 16px;
        }

        .filter-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: 1px solid var(--border-gray);
          border-radius: 8px;
          background: white;
          cursor: pointer;
          position: relative;
        }

        .filter-count {
          background: var(--primary-red);
          color: white;
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
        }

        .divider {
          width: 1px;
          height: 24px;
          background: var(--border-gray);
        }

        .sort-dropdown-container {
          position: relative;
        }

        .sort-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: 1px solid var(--border-gray);
          border-radius: 8px;
          background: white;
          cursor: pointer;
        }

        .sort-dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid var(--border-gray);
          border-radius: 8px;
          box-shadow: var(--shadow-md);
          z-index: 100;
          margin-top: 4px;
        }

        .sort-dropdown-menu button {
          width: 100%;
          padding: 12px 16px;
          border: none;
          background: white;
          text-align: left;
          cursor: pointer;
        }

        .sort-dropdown-menu button:hover {
          background: var(--bg-gray-light);
        }

        .favorites-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: 1px solid var(--border-gray);
          border-radius: 8px;
          background: white;
          cursor: pointer;
        }

        .toggle-switch {
          width: 48px;
          height: 24px;
          background: var(--border-gray-dark);
          border-radius: 12px;
          position: relative;
          transition: background var(--transition-fast);
        }

        .toggle-switch.active {
          background: var(--primary-red);
        }

        .toggle-slider {
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: transform var(--transition-fast);
        }

        .toggle-switch.active .toggle-slider {
          transform: translateX(24px);
        }

        .results-count-bar {
          padding: 12px 16px;
          background: var(--bg-gray-light);
          border-bottom: 1px solid var(--border-gray);
        }

        .results-text {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-gray-dark);
        }

        /* Desktop Header (1024px+) */
        .desktop-header {
          display: none;
          padding: 24px;
        }

        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-left .page-title {
          font-size: 28px;
          font-weight: 700;
          margin: 0 0 4px 0;
        }

        .subtitle {
          color: var(--text-gray);
          font-size: 16px;
          margin: 0;
        }

        .header-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .favorites-button {
          position: relative;
          padding: 10px 16px;
          border: 1px solid var(--border-gray);
          border-radius: 8px;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .favorites-badge {
          background: var(--primary-red);
          color: white;
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
        }

        .view-switcher {
          display: flex;
          border: 1px solid var(--border-gray);
          border-radius: 8px;
          overflow: hidden;
        }

        .switcher-btn {
          padding: 10px 16px;
          border: none;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background var(--transition-fast);
        }

        .switcher-btn.active {
          background: var(--primary-red);
          color: white;
        }

        .switcher-btn:not(.active):hover {
          background: var(--bg-gray-light);
        }

        .sort-select, .view-select {
          padding: 10px 16px;
          border: 1px solid var(--border-gray);
          border-radius: 8px;
          background: white;
          font-size: 14px;
          cursor: pointer;
          outline: none;
        }

        .sort-select:focus, .view-select:focus {
          border-color: var(--primary-red);
        }

        /* Tablet and Desktop Responsive - Hide Mobile Elements */
        @media (min-width: 768px) {
          .mobile-header {
            display: none !important;
          }
          .applied-filters {
            display: none !important;
          }
          .desktop-header {
            display: block;
          }
        }

        /* Mobile Only - Hide Desktop Elements */
        @media (max-width: 767px) {
          .desktop-header {
            display: none !important;
          }
        }
      `}</style>

      <div className="search-header">
        {/* Mobile Version */}
        <div className="mobile-header">
          <div className="header-top">
            <h1 className="page-title">
              {showingFavorites ? 'Saved Vehicles' : 'Vehicles for Sale'}
            </h1>
            
            <form onSubmit={handleSearch} className="search-container">
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search vehicles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-button">
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>
          
          <div className="sticky-wrapper">
            {activeFilters.length > 0 && (
              <div className="applied-filters">
                <div className="filter-pills-container">
                  <button className="clear-all-btn" onClick={onClearAllFilters}>
                    Clear All
                  </button>
                  {activeFilters.map((filter, index) => (
                    <span key={index} className="filter-pill">
                      <Check className="check-icon" />
                      <span>{filter.value}</span>
                      <button 
                        className="remove-filter"
                        onClick={() => onRemoveFilter && onRemoveFilter(filter.category, filter.value)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="control-bar">
              <button className="filter-button" onClick={onMobileFiltersOpen}>
                <Filter className="w-4 h-4" />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="filter-count">{activeFilterCount}</span>
                )}
              </button>
              
              <div className="divider"></div>
              
              <div className="sort-dropdown-container">
                <button 
                  className="sort-button"
                  onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                >
                  <ChevronDown className="w-4 h-4" />
                  <span>Sort</span>
                </button>
                {sortDropdownOpen && (
                  <div className="sort-dropdown-menu">
                    {sortOptions.map(option => (
                      <button
                        key={option.value}
                        onClick={() => {
                          onSortChange(option.value);
                          setSortDropdownOpen(false);
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="divider"></div>
              
              <button className="favorites-toggle" onClick={onToggleFavorites}>
                <span>Favorites</span>
                <div className={`toggle-switch ${showingFavorites ? 'active' : ''}`}>
                  <div className="toggle-slider"></div>
                </div>
              </button>
            </div>
          </div>
          
          <div className="results-count-bar">
            <span className="results-text">
              {showingFavorites ? `Saved Vehicles - ${favoritesCount} Results` : `All Vehicles - ${totalResults.toLocaleString()} Results`}
            </span>
          </div>
        </div>

        {/* Desktop Version */}
        <div className="desktop-header">
          <div className="header-container">
            <div className="header-left">
              <h1 className="page-title">
                {showingFavorites ? 'Saved Vehicles' : 'New and Used Vehicles for sale'}
              </h1>
              <p className="subtitle">
                {showingFavorites ? `${favoritesCount} Saved` : `${totalResults.toLocaleString()} Matches`}
              </p>
            </div>
            
            <div className="header-controls">
              {!showingFavorites ? (
                <button className="favorites-button" onClick={onToggleFavorites}>
                  <Heart className="w-4 h-4" />
                  {favoritesCount > 0 && (
                    <span className="favorites-badge">{favoritesCount}</span>
                  )}
                </button>
              ) : (
                <div className="view-switcher">
                  <button 
                    className={`switcher-btn ${!showingFavorites ? 'active' : ''}`}
                    onClick={() => onToggleFavorites && onToggleFavorites(false)}
                  >
                    All Results
                  </button>
                  <button 
                    className={`switcher-btn ${showingFavorites ? 'active' : ''}`}
                    onClick={() => onToggleFavorites && onToggleFavorites(true)}
                  >
                    <Heart className="w-4 h-4" />
                    Saved ({favoritesCount})
                  </button>
                </div>
              )}
              
              <select 
                className="sort-select"
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <select 
                className="view-select"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
              >
                <option value={30}>View: 30</option>
                <option value={60}>View: 60</option>
                <option value={100}>View: 100</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SearchResultsHeader;

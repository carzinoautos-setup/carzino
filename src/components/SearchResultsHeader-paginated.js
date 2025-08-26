import React, { useState } from 'react';
import { Filter, Search, ChevronDown } from 'lucide-react';

const SearchResultsHeader = ({ 
  totalResults = 0,
  currentPage = 1,
  itemsPerPage = 20,
  startResult = 0,
  endResult = 0,
  sortBy = 'relevance',
  onSortChange,
  onItemsPerPageChange,
  searchTime = 0,
  currentFilters = {},
  onMobileFiltersOpen,
  onSearch
}) => {
  const [searchQuery, setSearchQuery] = useState(currentFilters.search || '');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  const formatSearchTime = (timeMs) => {
    if (timeMs < 1000) {
      return `${timeMs}ms`;
    }
    return `${(timeMs / 1000).toFixed(2)}s`;
  };

  return (
    <div className="search-results-header">
      {/* Main Search Bar */}
      <div className="search-header">
        <div className="search-container">
          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                className="search-input"
                placeholder="Search vehicles (e.g., 'Ford F-150', 'Toyota Camry 2020')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-button">
                Search
              </button>
            </div>
          </form>

          {/* Mobile Filter Button */}
          <button 
            className="mobile-filter-button"
            onClick={onMobileFiltersOpen}
          >
            <Filter size={20} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <div className="results-info">
          <div className="results-count">
            {totalResults > 0 ? (
              <>
                <h1 className="page-title">
                  {formatNumber(totalResults)} Vehicle{totalResults !== 1 ? 's' : ''} Found
                </h1>
                <p className="results-detail">
                  Showing {formatNumber(startResult)}-{formatNumber(endResult)} of {formatNumber(totalResults)} results
                  {searchTime > 0 && (
                    <span className="search-time"> • {formatSearchTime(searchTime)}</span>
                  )}
                </p>
              </>
            ) : (
              <>
                <h1 className="page-title">No Vehicles Found</h1>
                <p className="results-detail">Try adjusting your search filters</p>
              </>
            )}
          </div>

          {/* Page Info */}
          {totalResults > itemsPerPage && (
            <div className="page-info">
              <span className="page-indicator">
                Page {currentPage} of {Math.ceil(totalResults / itemsPerPage)}
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="results-controls">
          {/* Items Per Page */}
          <div className="items-per-page-control">
            <label htmlFor="items-per-page">Show:</label>
            <select
              id="items-per-page"
              className="items-per-page-select"
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange?.(parseInt(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>per page</span>
          </div>

          {/* Sort Dropdown */}
          <div className="sort-control">
            <div className="sort-dropdown-container">
              <button
                className="sort-button"
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              >
                <span>Sort: {getSortLabel(sortBy)}</span>
                <ChevronDown 
                  size={16} 
                  className={`sort-chevron ${sortDropdownOpen ? 'open' : ''}`}
                />
              </button>

              {sortDropdownOpen && (
                <div className="sort-dropdown">
                  <div className="sort-options">
                    {[
                      { value: 'relevance', label: 'Best Match' },
                      { value: 'price_low', label: 'Price: Low to High' },
                      { value: 'price_high', label: 'Price: High to Low' },
                      { value: 'year_new', label: 'Year: Newest First' },
                      { value: 'year_old', label: 'Year: Oldest First' },
                      { value: 'mileage_low', label: 'Mileage: Low to High' },
                      { value: 'mileage_high', label: 'Mileage: High to Low' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        className={`sort-option ${sortBy === option.value ? 'active' : ''}`}
                        onClick={() => {
                          onSortChange?.(option.value);
                          setSortDropdownOpen(false);
                        }}
                      >
                        {option.label}
                        {sortBy === option.value && <span className="check-mark">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Stats (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-stats">
          <span>🔍 Total in database: {formatNumber(totalResults)}</span>
          <span>📄 Current page: {currentPage}</span>
          <span>📊 Per page: {itemsPerPage}</span>
          <span>⏱️ Response time: {formatSearchTime(searchTime)}</span>
        </div>
      )}
    </div>
  );
};

// Helper function to get sort label
const getSortLabel = (sortValue) => {
  const sortLabels = {
    'relevance': 'Best Match',
    'price_low': 'Price: Low to High',
    'price_high': 'Price: High to Low',
    'year_new': 'Year: Newest First',
    'year_old': 'Year: Oldest First',
    'mileage_low': 'Mileage: Low to High',
    'mileage_high': 'Mileage: High to Low',
  };
  
  return sortLabels[sortValue] || 'Best Match';
};

export default SearchResultsHeader;

import React from 'react';
import { Grid, List, Filter } from 'lucide-react';

const SearchResultsHeader = ({ 
  totalResults, 
  currentFilters,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  onMobileFiltersOpen 
}) => {
  const activeFilterCount = Object.entries(currentFilters).reduce((count, [key, value]) => {
    if (key === 'radius' || key === 'termLength' || key === 'interestRate' || key === 'downPayment' || key === 'zipCode') {
      return count;
    }
    if (key === 'priceMin' || key === 'priceMax') {
      if (key === 'priceMin' && (currentFilters.priceMin || currentFilters.priceMax)) {
        return count + 1;
      }
      if (key === 'priceMax') {
        return count;
      }
    }
    if (key === 'paymentMin' || key === 'paymentMax') {
      if (key === 'paymentMin' && (currentFilters.paymentMin || currentFilters.paymentMax)) {
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

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        {/* Left side - Results count and mobile filter */}
        <div className="flex items-center gap-4">
          {/* Mobile filter button */}
          <button
            onClick={onMobileFiltersOpen}
            className="lg:hidden flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors relative"
          >
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filters</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Results count */}
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{totalResults.toLocaleString()}</span> vehicles found
            {activeFilterCount > 0 && (
              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} applied
              </span>
            )}
          </div>
        </div>

        {/* Right side - View mode and sort */}
        <div className="flex items-center gap-4">
          {/* Sort dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm font-medium text-gray-700 hidden sm:block">
              Sort by:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            >
              <option value="relevance">Relevance</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="mileage_low">Mileage: Low to High</option>
              <option value="year_new">Year: Newest First</option>
              <option value="distance">Distance: Nearest First</option>
            </select>
          </div>

          {/* View mode toggle - Desktop only */}
          <div className="hidden sm:flex items-center bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Grid view"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsHeader;

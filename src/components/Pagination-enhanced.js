import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalResults = 0,
  itemsPerPage = 20,
  onPageChange,
  loading = false,
  maxVisiblePages = 7, // How many page numbers to show
  showJumpToPage = true
}) => {
  // Calculate pagination range
  const paginationRange = useMemo(() => {
    const range = [];
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      // Calculate smart range for large page counts
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      // Adjust start if we're near the end
      const adjustedStart = Math.max(1, endPage - maxVisiblePages + 1);
      
      // Add first page and ellipsis if needed
      if (adjustedStart > 1) {
        range.push(1);
        if (adjustedStart > 2) {
          range.push('...');
        }
      }
      
      // Add visible page range
      for (let i = adjustedStart; i <= endPage; i++) {
        range.push(i);
      }
      
      // Add ellipsis and last page if needed
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          range.push('...');
        }
        range.push(totalPages);
      }
    }
    
    return range;
  }, [currentPage, totalPages, maxVisiblePages]);

  const handlePageClick = (page) => {
    if (page !== currentPage && page >= 1 && page <= totalPages && !loading) {
      onPageChange(page);
    }
  };

  const handleJumpToPage = (e) => {
    e.preventDefault();
    const form = e.target;
    const input = form.querySelector('input[name="jumpPage"]');
    const page = parseInt(input.value);
    
    if (page && page >= 1 && page <= totalPages) {
      handlePageClick(page);
      input.value = '';
    }
  };

  // Don't render if only one page
  if (totalPages <= 1) {
    return null;
  }

  const startResult = (currentPage - 1) * itemsPerPage + 1;
  const endResult = Math.min(currentPage * itemsPerPage, totalResults);

  return (
    <div className="pagination-container">
      {/* Results Summary */}
      <div className="pagination-summary">
        <p>
          Showing <strong>{startResult.toLocaleString()}</strong> to{' '}
          <strong>{endResult.toLocaleString()}</strong> of{' '}
          <strong>{totalResults.toLocaleString()}</strong> vehicles
        </p>
      </div>

      {/* Pagination Controls */}
      <div className="pagination-controls">
        {/* First Page */}
        <button
          className="pagination-button pagination-first"
          onClick={() => handlePageClick(1)}
          disabled={currentPage === 1 || loading}
          title="First page"
        >
          <ChevronsLeft size={16} />
        </button>

        {/* Previous Page */}
        <button
          className="pagination-button pagination-prev"
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          title="Previous page"
        >
          <ChevronLeft size={16} />
          <span className="pagination-label">Previous</span>
        </button>

        {/* Page Numbers */}
        <div className="pagination-pages">
          {paginationRange.map((page, index) => {
            if (page === '...') {
              return (
                <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                  ...
                </span>
              );
            }

            return (
              <button
                key={page}
                className={`pagination-page ${
                  page === currentPage ? 'active' : ''
                } ${loading ? 'loading' : ''}`}
                onClick={() => handlePageClick(page)}
                disabled={loading}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          className="pagination-button pagination-next"
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          title="Next page"
        >
          <span className="pagination-label">Next</span>
          <ChevronRight size={16} />
        </button>

        {/* Last Page */}
        <button
          className="pagination-button pagination-last"
          onClick={() => handlePageClick(totalPages)}
          disabled={currentPage === totalPages || loading}
          title="Last page"
        >
          <ChevronsRight size={16} />
        </button>
      </div>

      {/* Jump to Page (for large datasets) */}
      {showJumpToPage && totalPages > 10 && (
        <div className="pagination-jump">
          <form onSubmit={handleJumpToPage} className="jump-form">
            <label htmlFor="jumpPage">Go to page:</label>
            <input
              type="number"
              name="jumpPage"
              min="1"
              max={totalPages}
              placeholder={currentPage}
              className="jump-input"
              disabled={loading}
            />
            <button type="submit" className="jump-button" disabled={loading}>
              Go
            </button>
          </form>
          <span className="jump-info">of {totalPages.toLocaleString()}</span>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="pagination-loading">
          <div className="loading-spinner"></div>
          <span>Loading...</span>
        </div>
      )}
    </div>
  );
};

export default Pagination;

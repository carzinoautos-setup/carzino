import React from 'react';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  totalResults, 
  resultsPerPage, 
  onPageChange 
}) => {
  const startResult = (currentPage - 1) * resultsPerPage + 1;
  const endResult = Math.min(currentPage * resultsPerPage, totalResults);

  const getPaginationPages = () => {
    const pages = [];
    const maxPagesToShow = window.innerWidth <= 640 ? 5 : 7; // Less pages on mobile
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const paginationPages = getPaginationPages();

  return (
    <div className="bg-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Albert+Sans:wght@300;400;500;600;700;800&display=swap');

        .pagination-container {
          border-top: 1px solid #e5e7eb;
          background-color: white;
          padding: 16px;
          margin-top: 16px;
          font-family: 'Albert Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .pagination-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }

        .pagination-info {
          font-size: 14px;
          color: #374151;
          text-align: center;
          font-family: 'Albert Sans', sans-serif;
        }

        .pagination-info .font-medium {
          font-weight: 500;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 4px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .pagination-btn {
          padding: 8px 12px;
          font-size: 14px;
          font-weight: 500;
          background-color: white;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
          font-family: 'Albert Sans', sans-serif;
        }

        .pagination-btn:hover:not(:disabled) {
          background-color: #f9fafb;
        }

        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination-numbers {
          display: flex;
          gap: 4px;
          align-items: center;
          justify-content: center;
        }

        .pagination-page-btn {
          padding: 8px 12px;
          font-size: 14px;
          font-weight: 500;
          border-radius: 6px;
          min-width: 40px;
          flex-shrink: 0;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          font-family: 'Albert Sans', sans-serif;
        }

        .pagination-page-btn.active {
          background-color: #dc2626;
          color: white;
          border: 1px solid #dc2626;
        }

        .pagination-page-btn:not(.active) {
          background-color: white;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .pagination-page-btn:not(.active):hover {
          background-color: #f9fafb;
        }

        .pagination-ellipsis {
          padding: 8px;
          color: #6b7280;
          flex-shrink: 0;
          font-family: 'Albert Sans', sans-serif;
        }

        @media (max-width: 640px) {
          .pagination-container {
            padding: 12px 20px; /* Add the requested 20px left/right padding on mobile */
          }

          .pagination-controls {
            width: 100%;
            justify-content: center;
            /* Remove overflow-x scroll and sliding behavior */
            overflow-x: visible;
          }

          .pagination-btn {
            padding: 8px 10px;
            font-size: 13px;
          }

          .pagination-page-btn {
            padding: 8px 10px;
            font-size: 13px;
            min-width: 36px;
          }

          .pagination-numbers {
            /* No horizontal scrolling - just wrap if needed */
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>

      <div className="pagination-container">
        <div className="pagination-content">
          <div className="pagination-info">
            Showing <span className="font-medium">{startResult}</span> to{' '}
            <span className="font-medium">{endResult}</span> of{' '}
            <span className="font-medium">{totalResults.toLocaleString()}</span> results
          </div>

          <div className="pagination-controls">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              Previous
            </button>

            <div className="pagination-numbers">
              {paginationPages.map((page, index) => {
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
                    onClick={() => onPageChange(page)}
                    className={`pagination-page-btn ${page === currentPage ? 'active' : ''}`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pagination;

import React from 'react';

interface MarketPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

const MarketPagination: React.FC<MarketPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      // Adjust start if we're near the end
      if (end - start + 1 < maxVisiblePages) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="card slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        {/* Page Info */}
        <div className="text-sm text-secondary mb-4 sm:mb-0">
          Showing <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{startItem}</span> to{' '}
          <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{endItem}</span> of{' '}
          <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{totalItems}</span> results
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center gap-2">
          {/* Previous Button */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-l-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              color: 'var(--color-text-secondary)',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border-medium)'
            }}
            onMouseEnter={(e) => {
              if (currentPage !== 1) {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-accent)';
                e.currentTarget.style.borderColor = 'var(--color-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== 1) {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                e.currentTarget.style.borderColor = 'var(--color-border-medium)';
              }
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="sr-only">Previous</span>
          </button>

          {/* Page Numbers */}
          {pageNumbers.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className="relative inline-flex items-center px-3 py-2 text-sm font-medium border transition-all duration-200"
              style={{
                backgroundColor: page === currentPage ? 'var(--color-bg-accent)' : 'var(--color-bg-secondary)',
                borderColor: page === currentPage ? 'var(--color-primary)' : 'var(--color-border-medium)',
                color: page === currentPage ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                zIndex: page === currentPage ? 10 : 'auto'
              }}
              onMouseEnter={(e) => {
                if (page !== currentPage) {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-accent)';
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (page !== currentPage) {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                  e.currentTarget.style.borderColor = 'var(--color-border-medium)';
                }
              }}
            >
              {page}
            </button>
          ))}

          {/* Next Button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center px-3 py-2 text-sm font-medium rounded-r-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              color: 'var(--color-text-secondary)',
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border-medium)'
            }}
            onMouseEnter={(e) => {
              if (currentPage !== totalPages) {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-accent)';
                e.currentTarget.style.borderColor = 'var(--color-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (currentPage !== totalPages) {
                e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)';
                e.currentTarget.style.borderColor = 'var(--color-border-medium)';
              }
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="sr-only">Next</span>
          </button>
        </div>
      </div>

      {/* Quick Navigation */}
      {totalPages > 10 && (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border-light)' }}>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-secondary">Quick jump:</span>
            {[1, Math.floor(totalPages / 2), totalPages].map((page) => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className="transition-all duration-200 hover:underline"
                style={{ color: 'var(--color-primary)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary-dark)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
              >
                {page === 1 ? 'First' : page === totalPages ? 'Last' : `Page ${page}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketPagination;

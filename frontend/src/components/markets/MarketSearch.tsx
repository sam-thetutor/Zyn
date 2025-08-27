import React from 'react';

interface MarketSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onRefresh: () => void;
  loading?: boolean;
}

const MarketSearch: React.FC<MarketSearchProps> = ({
  searchTerm,
  onSearchChange,
  onRefresh,
  loading = false,
}) => {
  return (
    <div className="card mb-6 slide-up mt-32">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Search Input */}
        <div className="flex-1 max-w-md">
          <label htmlFor="search" className="sr-only">
            Search markets
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5" style={{ color: 'var(--color-text-tertiary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search markets by question, description, or category..."
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn-secondary"
            style={{ opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            <svg 
              className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Search Results Info */}
      {searchTerm && (
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-border-light)' }}>
          <p className="text-sm text-secondary">
            Searching for: <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>"{searchTerm}"</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default MarketSearch;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMarkets } from '../hooks/useMarkets';
import { useWallet } from '../hooks/useWallet';
import MarketCard from '../components/markets/MarketCard';
import MarketSearch from '../components/markets/MarketSearch';
import MarketPagination from '../components/markets/MarketPagination';

const Markets: React.FC = () => {
  const { 
    markets, 
    allMarkets,
    loading, 
    error, 
    searchTerm, 
    setSearchTerm, 
    selectedCategory, 
    setSelectedCategory, 
    selectedSubCategory, 
    setSelectedSubCategory,
    volumeFilter,
    setVolumeFilter,
    sortBy,
    setSortBy,
    currentPage, 
    totalPages, 
    setCurrentPage, 
    refetchMarkets,
    categories,
    subCategories,
    totalMarkets
  } = useMarkets();
  
  const { isConnected, isCorrectNetwork, switchToBase } = useWallet();

  useEffect(() => {
    // Scroll to top when page changes
    window.scrollTo(0, 0);
  }, [currentPage]);

  return (
    <div className="container">
      {/* Header with proper spacing */}
      {/* <div className="flex justify-between items-center mt-8 mb-8">
        <div>
          <h1 className="gradient-text">Prediction Markets</h1>
          <p className="text-secondary mt-2">Discover and trade on prediction markets</p>
        </div>
        <div className="flex items-center gap-4">
          {!isConnected ? (
            <Link
              to="/"
              className="btn-primary"
            >
              Connect Wallet
            </Link>
          ) : (
            <Link
              to="/create-market"
              className="btn-primary"
            >
              Create New Market
            </Link>
          )}
        </div>
      </div> */}

      {/* Network Warning - Only show if connected but wrong network */}
      {isConnected && !isCorrectNetwork && (
        <div className="card mb-6 mt-8" style={{ backgroundColor: '#fffbeb', borderColor: '#f59e0b' }}>
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5" style={{ color: '#f59e0b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium" style={{ color: '#92400e' }}>Wrong Network</h3>
              <p className="text-sm mt-1" style={{ color: '#92400e' }}>
                Please switch to Base Mainnet to interact with markets.
              </p>
              <button
                onClick={switchToBase}
                className="mt-2 px-3 py-1 rounded text-sm transition-all duration-200"
                style={{ backgroundColor: '#f59e0b', color: 'white' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d97706'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f59e0b'}
              >
                Switch Network
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      {/* <MarketSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={refetchMarkets}
        loading={loading}
      /> */}
     
      {/* Category Navigation Bar */}
      <div className="mb-6 mt-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setSelectedCategory(category.id);
                setSelectedSubCategory('');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                selectedCategory === category.id 
                  ? 'text-white' 
                  : 'text-secondary hover:text-primary'
              }`}
              style={{
                backgroundColor: selectedCategory === category.id ? category.color : 'transparent',
                border: selectedCategory === category.id ? 'none' : '1px solid var(--color-border-light)'
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-category Filters */}
      {selectedCategory && selectedCategory !== 'all' && subCategories.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedSubCategory('')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                  selectedSubCategory === '' 
                    ? 'text-white' 
                    : 'text-secondary hover:text-primary'
                }`}
                style={{
                  backgroundColor: selectedSubCategory === '' ? 'var(--color-secondary)' : 'transparent',
                  border: selectedSubCategory === '' ? 'none' : '1px solid var(--color-border-light)'
                }}
              >
                All
              </button>
              {subCategories.map((subCat) => (
                <button
                  key={subCat}
                  onClick={() => setSelectedSubCategory(subCat)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                    selectedSubCategory === subCat 
                      ? 'text-white' 
                      : 'text-secondary hover:text-primary'
                  }`}
                  style={{
                    backgroundColor: selectedSubCategory === subCat ? 'var(--color-secondary)' : 'transparent',
                    border: selectedSubCategory === subCat ? 'none' : '1px solid var(--color-border-light)'
                  }}
                >
                  {subCat}
                </button>
              ))}
            </div>
            
            {/* Volume Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-secondary">Volume:</span>
              <select 
                value={volumeFilter} 
                onChange={(e) => setVolumeFilter(e.target.value)}
                className="input-field text-sm" 
                style={{ minWidth: '120px' }}
              >
                <option value="all">All</option>
                <option value="low">Low (&lt;0.1 ETH)</option>
                <option value="medium">Medium (0.1-1 ETH)</option>
                <option value="high">High (1-10 ETH)</option>
                <option value="veryHigh">Very High (&gt;10 ETH)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Sorting Options */}
      <div className="mb-6 flex items-center justify-between">
        {/* <div className="flex items-center gap-2">
          <span className="text-sm text-secondary">Sort by:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="input-field text-sm" 
            style={{ minWidth: '140px' }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="volume">Highest Volume</option>
            <option value="ending">Ending Soon</option>
          </select>
        </div> */}
        
        <div className="text-sm text-secondary">
          Showing {markets.length} of {totalMarkets} markets
        </div>
      </div>

      {/* Markets Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full w-8 h-8 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
          <p className="mt-2 text-secondary">Loading markets...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p style={{ color: 'var(--color-danger)' }}>Error loading markets: {error}</p>
          <button
            onClick={refetchMarkets}
            className="btn-primary mt-4"
          >
            Try Again
          </button>
        </div>
      ) : markets.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-secondary mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>No markets found</h3>
          <p className="text-secondary mb-4">
            {searchTerm || selectedCategory !== 'all' || selectedSubCategory || volumeFilter !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'No markets have been created yet.'}
          </p>
          {!searchTerm && selectedCategory === 'all' && !selectedSubCategory && volumeFilter === 'all' && (
            <div className="space-y-2">
              <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Connect your wallet to create the first market!</p>
              <Link
                to="/"
                className="btn-primary"
              >
                Connect Wallet
              </Link>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {markets.map((market) => (
              <MarketCard key={market.id.toString()} market={market} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <MarketPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalMarkets}
              itemsPerPage={12}
            />
          )}
        </>
      )}

      {/* Wallet Connection Prompt - Only show if not connected */}
      {!isConnected && (
        <div className="fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg fade-in" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <div className="text-sm font-medium">Connect your wallet to trade</div>
              <div className="text-xs opacity-90">View markets without connecting</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Markets;

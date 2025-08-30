import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMarkets } from '../hooks/useMarkets';
import { useWallet } from '../hooks/useWallet';
import MarketCard from '../components/markets/MarketCard';
import MarketPagination from '../components/markets/MarketPagination';

const Markets: React.FC = () => {
  const { isConnected } = useWallet();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const { 
    markets, 
    loading, 
    error, 
    currentPage, 
    totalPages, 
    totalMarkets,
    searchTerm,
    selectedCategory,
    selectedSubCategory,
    volumeFilter,
    sortBy,
    categories,
    subCategories,
    setSearchTerm,
    setSelectedCategory,
    setSelectedSubCategory,
    setVolumeFilter,
    setSortBy,
    setCurrentPage,
    refetchMarkets
  } = useMarkets();

  useEffect(() => {
    // Scroll to top when page changes
    window.scrollTo(0, 0);
  }, [currentPage]);

  const openFilterModal = () => setIsFilterModalOpen(true);
  const closeFilterModal = () => setIsFilterModalOpen(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg text-gray-600">Loading markets...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Markets</h2>
            <p className="text-lg text-gray-600 mb-6">{error}</p>
            <button 
              onClick={() => refetchMarkets()} 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="text-center mb-8 w-full">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Prediction Markets
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover and trade on the future. Browse through our collection of prediction markets and find opportunities to profit from your insights.
          </p>
        </div>

        {/* Mobile Filter Button - Only visible on mobile */}
        <div className="md:hidden mb-6">
          <button
            onClick={openFilterModal}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
            <span>Filters & Sort</span>
            <span className="text-sm text-gray-500">
              {selectedCategory !== 'all' ? `• ${categories.find(c => c.id === selectedCategory)?.name}` : ''}
              {volumeFilter !== 'all' ? ` • ${volumeFilter}` : ''}
              {sortBy !== 'newest' ? ` • ${sortBy}` : ''}
            </span>
          </button>
        </div>

        {/* Desktop Filtering System - Hidden on mobile */}
        <div className="hidden md:block">
          {/* Category Navigation Bar */}
          <div className="mb-6 w-full">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full">
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
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={{
                    backgroundColor: selectedCategory === category.id ? category.color : 'transparent',
                    border: selectedCategory === category.id ? 'none' : '1px solid #e5e7eb'
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Volume Filter */}
          <div className="mb-6 w-full">
            <div className="flex items-center gap-2 w-full">
              <span className="text-sm text-gray-600">Volume:</span>
              <select 
                value={volumeFilter} 
                onChange={(e) => setVolumeFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="low">Low (&lt;0.1 CELO)</option>
                <option value="medium">Medium (0.1-1 CELO)</option>
                <option value="high">High (1-10 CELO)</option>
                <option value="veryHigh">Very High (&gt;10 CELO)</option>
              </select>
            </div>
          </div>

          {/* Sorting Options */}
          <div className="mb-6 w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="volume">Highest Volume</option>
                <option value="ending">Ending Soon</option>
              </select>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {markets.length} of {totalMarkets} markets
            </div>
          </div>
        </div>

        {/* Markets Display */}
        <div className="w-full">
          {!markets || markets.length === 0 ? (
            <div className="text-center py-12 w-full">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No Markets Found</h2>
              <p className="text-lg text-gray-600 mb-6">
                {selectedCategory !== 'all' 
                  ? `No markets found in the "${categories.find(c => c.id === selectedCategory)?.name}" category.`
                  : 'There are currently no prediction markets available.'
                }
              </p>
              <Link 
                to="/create-market" 
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create First Market
              </Link>
            </div>
          ) : (
            <>
              {/* Markets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 w-full">
                {markets.map((market) => (
                  <MarketCard key={market.id} market={market} />
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
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={closeFilterModal}
          ></div>
          
          {/* Modal Content */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-3 max-h-[45vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
              <button
                onClick={closeFilterModal}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Compact Layout */}
            <div className="space-y-3">
              {/* Category Navigation - Single Row */}
              <div>
                <h4 className="text-xs font-medium text-gray-600 mb-2">Category</h4>
                <div className="flex gap-1 overflow-x-auto pb-1">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        setSelectedSubCategory('');
                      }}
                      className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                        selectedCategory === category.id 
                          ? 'text-white' 
                          : 'text-gray-600 border border-gray-200'
                      }`}
                      style={{
                        backgroundColor: selectedCategory === category.id ? category.color : 'transparent'
                      }}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Volume and Sort in Row */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <h4 className="text-xs font-medium text-gray-600 mb-1">Volume</h4>
                  <select 
                    value={volumeFilter} 
                    onChange={(e) => setVolumeFilter(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="veryHigh">Very High</option>
                  </select>
                </div>

                <div>
                  <h4 className="text-xs font-medium text-gray-600 mb-1">Sort</h4>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="volume">Volume</option>
                    <option value="ending">Ending</option>
                  </select>
                </div>
              </div>

              {/* Market Count and Apply Button in Row */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-500">
                  {markets.length} of {totalMarkets} markets
                </span>
                <button
                  onClick={closeFilterModal}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Markets;

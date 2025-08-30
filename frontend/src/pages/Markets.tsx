import React, { useState, useMemo } from 'react';
import MarketCard from '../components/MarketCard';
import { useMarkets } from '../hooks/useMarkets';
import { useAccount } from 'wagmi';

const Markets: React.FC = () => {
  const { isConnected } = useAccount();
  const {
    markets,
    allMarkets,
    loading,
    error,
    currentPage,
    totalPages,
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
    refetchMarkets,
    totalMarkets,
    hasNextPage,
    hasPrevPage
  } = useMarkets();

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const openFilterModal = () => setIsFilterModalOpen(true);
  const closeFilterModal = () => setIsFilterModalOpen(false);

  // Get the current category name for display
  const getCurrentCategoryName = () => {
    if (!selectedCategory || selectedCategory === '') return 'All Markets';
    const category = categories.find(cat => cat.id === selectedCategory);
    return category ? category.name : 'All Markets';
  };

  // Loading state
  if (loading) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading markets...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
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
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Prediction Markets
        </h1>
        <p className="text-lg text-gray-600">
          Discover and trade on the future
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search markets by question..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Mobile Filter Button */}
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
            {selectedCategory && selectedCategory !== '' ? `• ${getCurrentCategoryName()}` : ''}
            {sortBy !== 'newest' ? ` • ${sortBy}` : ''}
          </span>
        </button>
      </div>

      {/* Desktop Filtering and Sorting Section */}
      <div className="hidden md:block mb-8">
        {/* Category Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  (selectedCategory === category.id) || (!selectedCategory && category.id === 'all')
                    ? 'text-white'
                    : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-200'
                }`}
                style={{
                  backgroundColor: (selectedCategory === category.id) || (!selectedCategory && category.id === 'all') ? category.color : undefined
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Sorting Options */}
        <div className="flex items-center justify-center space-x-4">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="volume">Highest Volume</option>
            <option value="ending">Ending Soon</option>
          </select>
        </div>
      </div>

      {/* Markets Display */}
      <div className="mb-8">
        {markets.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No Markets Found
            </h2>
            <p className="text-lg text-gray-600">
              {searchTerm || (selectedCategory && selectedCategory !== '') 
                ? 'Try adjusting your search or filter criteria.'
                : 'There are currently no prediction markets available.'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Market Count */}
            <div className="text-center mb-6">
              <p className="text-gray-600">
                Showing {markets.length} of {totalMarkets} markets
              </p>
            </div>

            {/* Markets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {markets.map((market) => (
                <MarketCard key={market.id.toString()} market={market} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!hasPrevPage}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!hasNextPage}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Market CTA */}
      {/* <div className="text-center">
        <button className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-green-700 transition-colors">
          Create New Market
        </button>
      </div> */}

      {/* Mobile Filter Sidebar */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={closeFilterModal}
          ></div>
          
          {/* Sidebar Content */}
          <div className="absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Filters & Sort</h3>
              <button
                onClick={closeFilterModal}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sidebar Body */}
            <div className="p-4 space-y-6 overflow-y-auto h-full">
              {/* Category Filters */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Category</h4>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        closeFilterModal();
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        (selectedCategory === category.id) || (!selectedCategory && category.id === 'all')
                          ? 'text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      style={{
                        backgroundColor: (selectedCategory === category.id) || (!selectedCategory && category.id === 'all') ? category.color : undefined
                      }}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sorting Options */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Sort By</h4>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as any);
                    closeFilterModal();
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="volume">Highest Volume</option>
                  <option value="ending">Ending Soon</option>
                </select>
              </div>

              {/* Market Count */}
              <div className="pt-4 border-t border-gray-200">
                <div className="text-center text-sm text-gray-600">
                  {markets.length} of {totalMarkets} markets
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Markets;

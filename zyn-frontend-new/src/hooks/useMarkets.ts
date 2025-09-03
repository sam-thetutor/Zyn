import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { usePredictionMarketCore } from './usePredictionMarketCore';
import type { MarketWithUserShares } from '../types/contracts';

export interface UseMarketsReturn {
  // State
  markets: MarketWithUserShares[];
  allMarkets: MarketWithUserShares[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  
  // Filters
  searchTerm: string;
  selectedCategory: string;
  selectedSubCategory: string;
  volumeFilter: string;
  sortBy: 'newest' | 'oldest' | 'volume' | 'ending';
  
  // Categories
  categories: Array<{ id: string; name: string; color: string }>;
  subCategories: string[];
  
  // Actions
  setSearchTerm: (term: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedSubCategory: (subCategory: string) => void;
  setVolumeFilter: (filter: string) => void;
  setSortBy: (sort: 'newest' | 'oldest' | 'volume' | 'ending') => void;
  setCurrentPage: (page: number) => void;
  refetchMarkets: () => Promise<void>;
  updateUserShares: (userAddress: `0x${string}`) => Promise<void>;
  
  // Computed
  totalMarkets: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const useMarkets = (): UseMarketsReturn => {
  const { 
    totalMarkets: totalMarketsCount, 
    getMarket,
    getMarketMetadata
  } = usePredictionMarketCore();

  // Use refs to store the latest functions to avoid infinite loops
  const getMarketRef = useRef(getMarket);
  const getMarketMetadataRef = useRef(getMarketMetadata);

  // Update refs when functions change
  useEffect(() => {
    getMarketRef.current = getMarket;
    getMarketMetadataRef.current = getMarketMetadata;
  }, [getMarket, getMarketMetadata]);
  
  const [markets, setMarkets] = useState<MarketWithUserShares[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('');
  const [volumeFilter, setVolumeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'volume' | 'ending'>('newest');

  // Categories and sub-categories for FLIQ-style layout
  const categories = [
    { id: 'all', name: 'All Markets', color: 'var(--color-primary)' },
    { id: 'politics', name: 'Politics', color: '#ef4444' },
    { id: 'sports', name: 'Sports', color: '#3b82f6' },
    { id: 'technology', name: 'Technology', color: '#10b981' },
    { id: 'entertainment', name: 'Entertainment', color: '#f59e0b' },
    { id: 'finance', name: 'Finance', color: '#8b5cf6' },
    { id: 'science', name: 'Science', color: '#06b6d4' },
    { id: 'health', name: 'Health', color: '#ec4899' },
    { id: 'other', name: 'Other', color: '#6b7280' }
  ];

  const subCategories = {
    politics: ['Elections', 'Policy', 'International', 'Local'],
    sports: ['Football', 'Basketball', 'Baseball', 'Soccer', 'Tennis', 'Olympics'],
    technology: ['AI', 'Blockchain', 'Gaming', 'Social Media', 'Hardware'],
    entertainment: ['Movies', 'Music', 'TV Shows', 'Celebrities', 'Awards'],
    finance: ['Cryptocurrency', 'Stocks', 'Real Estate', 'Commodities'],
    science: ['Space', 'Medicine', 'Climate', 'Physics', 'Biology'],
    health: ['Pandemic', 'Medical Research', 'Public Health', 'Fitness'],
    other: ['Weather', 'Food', 'Travel', 'Education']
  };

  // Fetch all markets
  const fetchMarkets = useCallback(async () => {
    if (!totalMarketsCount || totalMarketsCount === 0n) {
      setMarkets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const marketPromises: Promise<MarketWithUserShares | null>[] = [];
      
      // Fetch markets from ID 1 to totalMarkets
      for (let i = 1; i <= Number(totalMarketsCount); i++) {
        marketPromises.push(
          (async () => {
            try {
              const market = await getMarketRef.current(BigInt(i));
              if (!market) return null;

              // Fetch metadata separately
              const metadata = await getMarketMetadataRef.current(BigInt(i));

              // Calculate additional market data
              const now = Math.floor(Date.now() / 1000);
              const timeRemaining = Math.max(0, Number(market.endTime) - now);
              const isEnded = timeRemaining <= 0;
              const isActive = market.status === 0 && !isEnded; // 0 = ACTIVE status

              // Get user shares (placeholder - will be updated when user connects)
              const userYesShares = 0n;
              const userNoShares = 0n;

              return {
                ...market,
                description: metadata.description,
                category: metadata.category,
                image: metadata.image,
                source: metadata.source,
                timeRemaining,
                isEnded,
                isActive,
                userYesShares,
                userNoShares,
              };
            } catch (err) {
              console.warn(`Failed to fetch market ${i}:`, err);
              return null;
            }
          })()
        );
      }

      const marketResults = await Promise.all(marketPromises);
      const validMarkets = marketResults.filter((market): market is MarketWithUserShares => market !== null);
      
      setMarkets(validMarkets);
    } catch (err) {
      console.error('Error fetching markets:', err);
      setError('Failed to load markets');
    } finally {
      setLoading(false);
    }
  }, [totalMarketsCount]); // Removed getMarket and getMarketMetadata from dependencies

  // Fetch markets when totalMarkets changes
  useEffect(() => {
    if (totalMarketsCount && totalMarketsCount > 0n) {
      fetchMarkets();
    }
  }, [totalMarketsCount]); // Removed fetchMarkets from dependencies

  // Filter and sort markets
  const filteredAndSortedMarkets = useMemo(() => {
    let filtered = markets;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(market =>
        market.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        market.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(market =>
        market.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Apply sub-category filter
    if (selectedSubCategory) {
      filtered = filtered.filter(market =>
        market.category.toLowerCase().includes(selectedSubCategory.toLowerCase())
      );
    }

    // Apply volume filter
    if (volumeFilter !== 'all') {
      const totalVolume = (market: MarketWithUserShares) => Number(market.totalYes + market.totalNo);
      const volumeThresholds = {
        low: 0.01,      // 0.01 CELO
        medium: 0.1,    // 0.1 CELO
        high: 1,        // 1 CELO
        veryHigh: 10    // 10 CELO
      };

      filtered = filtered.filter(market => {
        const volume = totalVolume(market);
        switch (volumeFilter) {
          case 'low':
            return volume < volumeThresholds.medium;
          case 'medium':
            return volume >= volumeThresholds.medium && volume < volumeThresholds.high;
          case 'high':
            return volume >= volumeThresholds.high && volume < volumeThresholds.veryHigh;
          case 'veryHigh':
            return volume >= volumeThresholds.veryHigh;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return Number(b.id) - Number(a.id);
        case 'oldest':
          return Number(a.id) - Number(b.id);
        case 'volume':
          return Number(b.totalYes + b.totalNo) - Number(a.totalYes + a.totalNo);
        case 'ending':
          return a.timeRemaining - b.timeRemaining;
        default:
          return 0;
      }
    });

    return filtered;
  }, [markets, searchTerm, selectedCategory, selectedSubCategory, volumeFilter, sortBy]);

  // Pagination
  const itemsPerPage = 12;
  const totalPages = Math.ceil(filteredAndSortedMarkets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMarkets = filteredAndSortedMarkets.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedSubCategory, volumeFilter, sortBy]);

  // Update user shares when wallet connects (placeholder for now)
  const updateUserShares = useCallback(async (userAddress: `0x${string}`) => {
    // TODO: Implement user shares update without infinite loops
    console.log('updateUserShares called for:', userAddress);
  }, []);

  return {
    // State
    markets: paginatedMarkets,
    allMarkets: filteredAndSortedMarkets,
    loading,
    error,
    currentPage,
    totalPages,
    searchTerm,
    selectedCategory,
    selectedSubCategory,
    volumeFilter,
    sortBy,
    
    // Categories
    categories,
    subCategories: selectedCategory ? subCategories[selectedCategory as keyof typeof subCategories] || [] : [],
    
    // Actions
    setSearchTerm,
    setSelectedCategory,
    setSelectedSubCategory,
    setVolumeFilter,
    setSortBy,
    setCurrentPage,
    refetchMarkets: fetchMarkets,
    updateUserShares,
    
    // Computed
    totalMarkets: filteredAndSortedMarkets.length,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};

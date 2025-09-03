import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePredictionMarket } from './usePredictionMarket';
import type { WinnerInfo, MarketWithMetadata } from '../utils/contracts';

export interface MarketWithUserShares extends MarketWithMetadata {
  timeRemaining: number;
  isEnded: boolean;
  isActive: boolean;
  userYesShares: bigint;
  userNoShares: bigint;
  userParticipation?: {
    participated: boolean;
    side: boolean;
    yesShares: bigint;
    noShares: bigint;
  };
  winnerInfo?: WinnerInfo;
}

export const useMarkets = () => {
  const { 
    totalMarkets, 
    // refetchTotalMarkets,
    getMarket,
    getMarketMetadata,
    getUserShares,
    getUserParticipation,
    getWinnerInfo
  } = usePredictionMarket();
  
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
    if (!totalMarkets || totalMarkets === 0n) {
      setMarkets([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const marketPromises: Promise<MarketWithUserShares | null>[] = [];
      
      // Fetch markets from ID 1 to totalMarkets
      for (let i = 1; i <= Number(totalMarkets); i++) {
        marketPromises.push(
          (async () => {
            try {
              const market = await getMarket(BigInt(i));
              if (!market) return null;

              // Fetch metadata separately
              const metadata = await getMarketMetadata(BigInt(i));
              const metadataTyped = metadata as any;

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
                description: metadataTyped.description as string,
                category: metadataTyped.category as string,
                image: metadataTyped.image as string,
                source: metadataTyped.source as string,
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
  }, [totalMarkets, getMarket, getMarketMetadata]);

  // Fetch markets when totalMarkets changes
  useEffect(() => {
    fetchMarkets();
  }, [totalMarkets, getMarket, getMarketMetadata]);

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

  // Update user shares when wallet connects
  const updateUserShares = useCallback(async (userAddress: `0x${string}`) => {
    if (!userAddress) return;

    setMarkets(prevMarkets => 
      prevMarkets.map(market => ({ ...market }))
    );

    // Update user shares and participation for each market
    for (const market of markets) {
      try {
        const [yesShares, noShares, userParticipation, winnerInfo] = await Promise.all([
          getUserShares(market.id, userAddress, true),
          getUserShares(market.id, userAddress, false),
          getUserParticipation(market.id, userAddress),
          getWinnerInfo(market.id, userAddress)
        ]);

        setMarkets(prevMarkets =>
          prevMarkets.map(m =>
            m.id === market.id
              ? { 
                  ...m, 
                  userYesShares: BigInt(yesShares), 
                  userNoShares: BigInt(noShares),
                  userParticipation: userParticipation || undefined,
                  winnerInfo: winnerInfo || undefined
                }
              : m
          )
        );
      } catch (err) {
        console.warn(`Failed to fetch user data for market ${market.id}:`, err);
      }
    }
  }, [markets, getUserShares, getUserParticipation, getWinnerInfo]);

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

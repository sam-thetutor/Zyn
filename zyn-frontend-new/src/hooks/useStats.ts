import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMarkets } from './useMarkets';
import type { DashboardStats } from '../types/contracts';

export interface UseStatsReturn {
  // Stats data
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
  
  // Actions
  refetchStats: () => Promise<void>;
}

export const useStats = (): UseStatsReturn => {
  const { allMarkets, loading: marketsLoading } = useMarkets();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format ether value helper
  const formatEther = useCallback((value: bigint): string => {
    const etherValue = Number(value) / 1e18;
    if (etherValue >= 1000000) {
      return `${(etherValue / 1000000).toFixed(1)}M`;
    } else if (etherValue >= 1000) {
      return `${(etherValue / 1000).toFixed(1)}K`;
    } else if (etherValue >= 1) {
      return etherValue.toFixed(2);
    } else {
      return etherValue.toFixed(4);
    }
  }, []);

  // Calculate stats from markets data
  const stats = useMemo((): DashboardStats => {
    if (!allMarkets.length) {
      return {
        totalMarkets: 0,
        activeTraders: 0,
        totalVolume: '0',
        resolvedMarkets: 0,
        totalVolumeWei: 0n
      };
    }

    // Calculate total volume across all markets
    const totalVolumeWei = allMarkets.reduce((sum, market) => {
      return sum + market.totalYes + market.totalNo;
    }, 0n);

    // Count resolved markets
    const resolvedMarkets = allMarkets.filter(market => market.status === 1).length;

    // Count unique traders (creators + participants)
    // This is a simplified calculation - in a real app you'd track unique participants
    const uniqueTraders = new Set<string>();
    allMarkets.forEach(market => {
      uniqueTraders.add(market.creator);
      // Note: We can't easily get all participants without additional contract calls
      // This is a placeholder - you might want to track this differently
    });

    return {
      totalMarkets: allMarkets.length,
      activeTraders: uniqueTraders.size,
      totalVolume: formatEther(totalVolumeWei),
      resolvedMarkets,
      totalVolumeWei
    };
  }, [allMarkets, formatEther]);

  // Refetch stats
  const refetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Stats are calculated from markets data, so we don't need to fetch anything additional
      // The markets hook will handle the data fetching
      setLoading(false);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load statistics');
      setLoading(false);
    }
  }, []);

  // Update loading state based on markets loading
  useEffect(() => {
    setLoading(marketsLoading);
  }, [marketsLoading]);

  return {
    stats,
    loading,
    error,
    refetchStats
  };
};

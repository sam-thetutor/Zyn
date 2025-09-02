import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useEventsStore, type UserLeaderboardStats } from '../stores/eventsStore';
import { formatEther } from 'viem';

export const useUserPnL = (userAddress?: string) => {
  const { address: connectedAddress } = useAccount();
  const { 
    logs, 
    userActivities, 
    processUserActivities, 
    calculateUserStats,
    getUserActivities,
    fetchAllLogs 
  } = useEventsStore();
  
  const [userStats, setUserStats] = useState<UserLeaderboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use provided address or connected address
  const targetAddress = userAddress || connectedAddress;

  // Process user activities when logs change (only if not already processed)
  useEffect(() => {
    if (logs.length > 0 && userActivities.length === 0) {
      console.log('🔄 Processing user activities from logs...');
      processUserActivities();
    }
  }, [logs, userActivities.length]);

  // Calculate user stats when activities change
  useEffect(() => {
    if (targetAddress && userActivities.length > 0) {
      console.log('📊 Calculating user stats for:', targetAddress);
      const stats = calculateUserStats(targetAddress);
      setUserStats(stats);
    }
  }, [targetAddress, userActivities]);

  // Fetch logs if not available
  const refreshStats = useCallback(async () => {
    if (!targetAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Only fetch if we don't have logs yet
      if (logs.length === 0) {
        console.log('📥 Fetching logs for PnL calculation...');
        await fetchAllLogs();
      } else {
        console.log('📊 Using existing logs for PnL calculation...');
        // Data is already available, just recalculate
        setLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      console.error('Error refreshing stats:', err);
    } finally {
      setLoading(false);
    }
  }, [targetAddress, logs.length, fetchAllLogs]);

  // Auto-refresh on mount (only if no data available)
  useEffect(() => {
    if (targetAddress && logs.length === 0 && !userStats) {
      refreshStats();
    }
  }, [targetAddress, logs.length, userStats]);

  // Get user activities
  const activities = targetAddress ? getUserActivities(targetAddress) : [];

  // Format stats for display
  const formattedStats = userStats ? {
    ...userStats,
    totalPnLFormatted: formatEther(userStats.totalPnL),
    totalInvestedFormatted: formatEther(userStats.totalInvested),
    totalWinningsFormatted: formatEther(userStats.totalWinnings),
    totalVolumeFormatted: formatEther(userStats.totalVolume),
    winRateFormatted: `${userStats.winRate.toFixed(1)}%`,
    riskAdjustedReturnFormatted: `${(userStats.riskAdjustedReturn * 100).toFixed(2)}%`,
    lastActivityFormatted: new Date(userStats.lastActivity).toLocaleDateString(),
  } : null;

  return {
    // Data
    userStats: formattedStats,
    activities,
    
    // State
    loading,
    error,
    
    // Actions
    refreshStats,
    
    // Computed values
    hasStats: !!userStats,
    isProfitable: userStats ? userStats.totalPnL > 0n : false,
    isActive: userStats ? userStats.totalMarkets > 0 : false,
  };
};

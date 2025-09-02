import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useEventsStore } from '../stores/eventsStore';
import { formatEther } from 'viem';

export type Timeframe = 'daily' | 'weekly' | 'monthly' | 'all';

export const useLeaderboard = (timeframe: Timeframe = 'all') => {
  const { address } = useAccount();
  const { 
    logs, 
    leaderboardStats, 
    userActivities,
    generateLeaderboard,
    getUserRank,
    getTopUsers,
    fetchAllLogs,
    processUserActivities 
  } = useEventsStore();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // Generate leaderboard when dependencies change
  const refreshLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // If we already have leaderboard data, just regenerate with new timeframe
      if (leaderboardStats.length > 0) {
        console.log(`🏆 Regenerating ${timeframe} leaderboard from existing data...`);
        generateLeaderboard(timeframe);
        setLastUpdated(Date.now());
        setLoading(false);
        return;
      }

      // Fetch logs if not available
      if (logs.length === 0) {
        console.log('📥 Fetching logs for leaderboard...');
        await fetchAllLogs();
      }
      
      // Process activities if not done
      if (logs.length > 0 && userActivities.length === 0) {
        console.log('📊 Processing user activities...');
        processUserActivities();
      }
      
      // Generate leaderboard
      console.log(`🏆 Generating ${timeframe} leaderboard...`);
      generateLeaderboard(timeframe);
      setLastUpdated(Date.now());
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate leaderboard';
      setError(errorMessage);
      console.error('Error refreshing leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [logs.length, userActivities.length, leaderboardStats.length, timeframe, fetchAllLogs, processUserActivities, generateLeaderboard]);

  // Auto-refresh on mount or timeframe change
  useEffect(() => {
    // Only refresh if we don't have data or if timeframe changed
    if (leaderboardStats.length === 0 || lastUpdated === null) {
      refreshLeaderboard();
    } else {
      // Just regenerate with new timeframe if we have data
      console.log(`🏆 Switching to ${timeframe} leaderboard...`);
      generateLeaderboard(timeframe);
      setLastUpdated(Date.now());
    }
  }, [timeframe]); // Only depend on timeframe, not the entire refreshLeaderboard function

  // Get current user's rank
  const userRank = address ? getUserRank(address) : 0;
  const userStats = address ? leaderboardStats.find(stats => 
    stats.address.toLowerCase() === address.toLowerCase()
  ) : null;

  // Format leaderboard data for display
  const formattedLeaderboard = leaderboardStats.map((stats, index) => ({
    ...stats,
    rank: index + 1,
    totalPnLFormatted: formatEther(stats.totalPnL),
    totalInvestedFormatted: formatEther(stats.totalInvested),
    totalWinningsFormatted: formatEther(stats.totalWinnings),
    totalVolumeFormatted: formatEther(stats.totalVolume),
    winRateFormatted: `${stats.winRate.toFixed(1)}%`,
    riskAdjustedReturnFormatted: `${(stats.riskAdjustedReturn * 100).toFixed(2)}%`,
    lastActivityFormatted: new Date(stats.lastActivity).toLocaleDateString(),
    isCurrentUser: address ? stats.address.toLowerCase() === address.toLowerCase() : false,
  }));

  // Get top users
  const topUsers = getTopUsers(10).map((stats, index) => ({
    ...stats,
    rank: index + 1,
    totalPnLFormatted: formatEther(stats.totalPnL),
    winRateFormatted: `${stats.winRate.toFixed(1)}%`,
    isCurrentUser: address ? stats.address.toLowerCase() === address.toLowerCase() : false,
  }));
  
  // Debug logging
  console.log('🏆 useLeaderboard debug:', {
    leaderboardStatsLength: leaderboardStats.length,
    topUsersLength: topUsers.length,
    userRank,
    hasUserStats: !!userStats,
    timeframe
  });

  // Get user's position in leaderboard
  const userPosition = address ? {
    rank: userRank,
    stats: userStats ? {
      ...userStats,
      totalPnLFormatted: formatEther(userStats.totalPnL),
      totalInvestedFormatted: formatEther(userStats.totalInvested),
      totalWinningsFormatted: formatEther(userStats.totalWinnings),
      totalVolumeFormatted: formatEther(userStats.totalVolume),
      winRateFormatted: `${userStats.winRate.toFixed(1)}%`,
      riskAdjustedReturnFormatted: `${(userStats.riskAdjustedReturn * 100).toFixed(2)}%`,
      lastActivityFormatted: new Date(userStats.lastActivity).toLocaleDateString(),
    } : null,
  } : null;

  return {
    // Data
    leaderboard: formattedLeaderboard,
    topUsers,
    userPosition,
    
    // State
    loading,
    error,
    lastUpdated,
    
    // Actions
    refreshLeaderboard,
    
    // Computed values
    totalUsers: leaderboardStats.length,
    hasData: leaderboardStats.length > 0,
    timeframe,
  };
};

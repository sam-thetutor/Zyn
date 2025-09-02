import { useEffect, useRef } from 'react';
import { useEventsStore } from '../stores/eventsStore';

export const useInitializeEvents = () => {
  const { 
    fetchAllLogs, 
    logs, 
    loading, 
    error, 
    lastFetched,
    processUserActivities,
    generateLeaderboard,
    userActivities,
    leaderboardStats
  } = useEventsStore();
  const hasInitializedRef = useRef(false);
  const hasProcessedActivitiesRef = useRef(false);

  useEffect(() => {
    // Only fetch if we haven't fetched before and we're not currently loading
    if (!hasInitializedRef.current && !loading && logs.length === 0) {
      hasInitializedRef.current = true;
      console.log('🚀 Initializing events and leaderboard data...');
      fetchAllLogs();
    }
  }, [loading, logs.length]);

  // Process user activities when logs are available
  useEffect(() => {
    if (logs.length > 0 && !hasProcessedActivitiesRef.current && userActivities.length === 0) {
      hasProcessedActivitiesRef.current = true;
      console.log('📊 Processing user activities from logs...');
      processUserActivities();
    }
  }, [logs.length, userActivities.length]);

  // Generate leaderboard when activities are processed
  useEffect(() => {
    if (userActivities.length > 0 && leaderboardStats.length === 0) {
      console.log('🏆 Generating initial leaderboard...');
      generateLeaderboard('all');
    }
  }, [userActivities.length, leaderboardStats.length]);

  return {
    logs,
    loading,
    error,
    lastFetched,
    refetch: fetchAllLogs,
    userActivities,
    leaderboardStats,
    isInitialized: hasInitializedRef.current,
    isActivitiesProcessed: hasProcessedActivitiesRef.current,
  };
};

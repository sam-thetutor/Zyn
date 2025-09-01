import { useEffect, useRef } from 'react';
import { useEventsStore } from '../stores/eventsStore';

export const useInitializeEvents = () => {
  const { fetchAllLogs, logs, loading, error, lastFetched } = useEventsStore();
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // Only fetch if we haven't fetched before and we're not currently loading
    if (!hasInitializedRef.current && !loading && logs.length === 0) {
      hasInitializedRef.current = true;
      fetchAllLogs();
    }
  }, [fetchAllLogs, loading, logs.length]);

  return {
    logs,
    loading,
    error,
    lastFetched,
    refetch: fetchAllLogs,
  };
};

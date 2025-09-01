import { useState, useEffect, useCallback } from 'react';
import { usePredictionMarket } from './usePredictionMarket';
import type { Market } from '../utils/contracts';
import { MarketStatus } from '../utils/contracts';

export const useAdminMarkets = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { totalMarkets, getMarket } = usePredictionMarket();

  const fetchMarket = useCallback(async (marketId: bigint): Promise<Market | null> => {
    try {
      const market = await getMarket(marketId);
      return market;
    } catch (error) {
      console.error(`Error fetching market ${marketId}:`, error);
      return null;
    }
  }, [getMarket]);

  const fetchAllMarkets = useCallback(async () => {
    if (!totalMarkets) return;

    setLoading(true);
    setError(null);

    try {
      const marketPromises: Promise<Market | null>[] = [];
      
      for (let i = 1; i <= Number(totalMarkets); i++) {
        marketPromises.push(fetchMarket(BigInt(i)));
      }

      const marketResults = await Promise.all(marketPromises);
      const validMarkets = marketResults.filter((market): market is Market => market !== null);
      
      // Sort markets by creation time (newest first)
      const sortedMarkets = validMarkets.sort((a, b) => Number(b.endTime - a.endTime));
      
      setMarkets(sortedMarkets);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch markets'));
    } finally {
      setLoading(false);
    }
  }, [totalMarkets, fetchMarket]);

  useEffect(() => {
    if (totalMarkets) {
      fetchAllMarkets();
    }
  }, [totalMarkets, fetchAllMarkets]);

  const refetchMarkets = useCallback(() => {
    fetchAllMarkets();
  }, [fetchAllMarkets]);

  // Get markets by status
  const getMarketsByStatus = useCallback((status: MarketStatus) => {
    return markets.filter(market => market.status === status);
  }, [markets]);

  // Get active markets
  const activeMarkets = getMarketsByStatus(MarketStatus.ACTIVE);
  
  // Get resolved markets
  const resolvedMarkets = getMarketsByStatus(MarketStatus.RESOLVED);
  
  // Get markets that can be resolved (ended but not resolved)
  const resolvableMarkets = activeMarkets.filter(market => 
    market.endTime <= BigInt(Math.floor(Date.now() / 1000))
  );

  // Get markets that need resolution (ended but still active)
  const marketsNeedingResolution = activeMarkets.filter(market => 
    market.endTime <= BigInt(Math.floor(Date.now() / 1000))
  );

  return {
    markets,
    activeMarkets,
    resolvedMarkets,
    resolvableMarkets,
    marketsNeedingResolution,
    loading,
    error,
    refetchMarkets,
    totalMarkets: totalMarkets || 0n,
  };
};

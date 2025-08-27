import { useState, useEffect, useCallback } from 'react';
import { useReadContract, usePublicClient } from 'wagmi';
import { CONTRACTS } from '../utils/contracts';
import { Market, MarketStatus } from '../utils/contracts';

export const useAdminMarkets = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const publicClient = usePublicClient();

  // Get total number of markets
  const { data: totalMarkets } = useReadContract({
    address: CONTRACTS.PREDICTION_MARKET.address,
    abi: CONTRACTS.PREDICTION_MARKET.abi,
    functionName: 'getTotalMarkets',
  });

  const fetchMarket = useCallback(async (marketId: bigint): Promise<Market | null> => {
    try {
      const marketData = await publicClient.readContract({
        address: CONTRACTS.PREDICTION_MARKET.address,
        abi: CONTRACTS.PREDICTION_MARKET.abi,
        functionName: 'getMarket',
        args: [marketId],
      });

      if (!marketData) return null;

      const [
        id, question, description, category, image, endTime,
        status, outcome, totalYes, totalNo, totalPool
      ] = marketData;

      return {
        id,
        question,
        description,
        category,
        image,
        endTime,
        status: status as MarketStatus,
        outcome,
        totalYes,
        totalNo,
        totalPool,
      };
    } catch (error) {
      console.error(`Error fetching market ${marketId}:`, error);
      return null;
    }
  }, [publicClient]);

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

import { useCallback } from 'react';
import { useReadContract, usePublicClient } from 'wagmi';
import { CONTRACTS } from '../utils/constants';
import type { Market } from '../utils/contracts';

// Hook to get a specific market by ID
export const useMarket = (marketId: bigint | undefined) => {
  const { data: marketData, error, isLoading, refetch } = useReadContract({
    address: CONTRACTS.PREDICTION_MARKET.address,
    abi: CONTRACTS.PREDICTION_MARKET.abi,
    functionName: 'getMarket',
    args: marketId ? [marketId] : undefined,
  });

  const market: Market | null = useCallback(() => {
    if (!marketData) return null;
    
    try {
      // Transform the tuple to Market interface
      const [id, question, description, category, image, endTime, status, outcome, totalYes, totalNo, totalPool] = marketData as any;
      return {
        id,
        question,
        description,
        category,
        image,
        endTime,
        status,
        outcome,
        totalYes,
        totalNo,
        totalPool,
      };
    } catch (error) {
      console.error('Error transforming market data:', error);
      return null;
    }
  }, [marketData])();

  return {
    market,
    error,
    isLoading,
    refetch,
  };
};

// Hook to get user shares for a specific market
export const useUserShares = (
  marketId: bigint | undefined, 
  userAddress: `0x${string}` | undefined, 
  outcome: boolean | undefined
) => {
  const { data: shares, error, isLoading, refetch } = useReadContract({
    address: CONTRACTS.PREDICTION_MARKET.address,
    abi: CONTRACTS.PREDICTION_MARKET.abi,
    functionName: 'getUserShares',
    args: marketId && userAddress && outcome !== undefined ? [marketId, userAddress, outcome] : undefined,
  });

  return {
    shares: shares || 0n,
    error,
    isLoading,
    refetch,
  };
};

// Legacy hook for backward compatibility
export const useMarketData = () => {
  const contractAddress = CONTRACTS.PREDICTION_MARKET.address;
  const publicClient = usePublicClient();

  // Get market by ID - now uses real contract call with public client
  const getMarket = useCallback(async (marketId: bigint): Promise<Market | null> => {
    try {
      if (!publicClient) {
        console.error('Public client not available');
        return null;
      }

      const result = await publicClient.readContract({
        address: contractAddress,
        abi: CONTRACTS.PREDICTION_MARKET.abi,
        functionName: 'getMarket',
        args: [marketId],
      });
      
      console.log('result', result);
      if (!result) return null;
      
      // Transform the tuple to Market interface
      const [id, question, description, category, image, endTime, status, outcome, totalYes, totalNo, totalPool] = result as any;
      return {
        id,
        question,
        description,
        category,
        image,
        endTime,
        status,
        outcome,
        totalYes,
        totalNo,
        totalPool,
      };
    } catch (error) {
      console.error('Error fetching market:', error);
      return null;
    }
  }, [contractAddress, publicClient]);

  // Get user shares for a market - now uses real contract call with public client
  const getUserShares = useCallback(async (
    marketId: bigint, 
    userAddress: `0x${string}`, 
    outcome: boolean
  ): Promise<bigint> => {
    try {
      if (!publicClient) {
        console.error('Public client not available');
        return 0n;
      }

      const result = await publicClient.readContract({
        address: contractAddress,
        abi: CONTRACTS.PREDICTION_MARKET.abi,
        functionName: 'getUserShares',
        args: [marketId, userAddress, outcome],
      });
      
      return (result as bigint) || 0n;
    } catch (error) {
      console.error('Error fetching user shares:', error);
      return 0n;
    }
  }, [contractAddress, publicClient]);

  return {
    getMarket,
    getUserShares,
  };
};

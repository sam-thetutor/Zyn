import { useCallback } from 'react';
import { useReadContract, usePublicClient } from 'wagmi';
import { useContractAddress } from './useContractAddress';
import type { Market } from '../utils/contracts';

// Hook to get a specific market by ID
export const useMarket = (marketId: bigint | undefined) => {
  const { coreContractAddress, coreContractABI } = useContractAddress();
  
  const { data: marketData, error, isLoading, refetch } = useReadContract({
    address: coreContractAddress || '0x0000000000000000000000000000000000000000',
    abi: coreContractABI || [],
    functionName: 'getMarket',
    args: marketId ? [marketId] : undefined,
  });

  const market: Market | null = useCallback(() => {
    if (!marketData) return null;
    
    try {
      // Transform the struct to Market interface
      const m = marketData as any;
      return {
        id: m.id,
        question: m.question,
        description: m.description,
        category: m.category,
        image: m.image,
        source: m.source,
        endTime: m.endTime,
        totalPool: m.totalPool,
        totalYes: m.totalYes,
        totalNo: m.totalNo,
        status: m.status,
        outcome: m.outcome,
        createdAt: m.createdAt,
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
  const { coreContractAddress, coreContractABI } = useContractAddress();
  
  const { data, error, isLoading, refetch } = useReadContract({
    address: coreContractAddress || '0x0000000000000000000000000000000000000000',
    abi: coreContractABI || [],
    functionName: 'getUserParticipation',
    args: marketId && userAddress && outcome !== undefined ? [marketId, userAddress] : undefined,
  });

  let shares: bigint = 0n;
  try {
    if (data) {
      const [, , yes, no] = data as unknown as [boolean, boolean, bigint, bigint];
      shares = outcome ? (yes || 0n) : (no || 0n);
    }
  } catch {}

  return {
    shares,
    error,
    isLoading,
    refetch,
  };
};

// Legacy hook for backward compatibility
export const useMarketData = () => {
  const { coreContractAddress, coreContractABI } = useContractAddress();
  const publicClient = usePublicClient();

  // Get market by ID - now uses real contract call with public client
  const getMarket = useCallback(async (marketId: bigint): Promise<Market | null> => {
    try {
      if (!publicClient) {
        console.error('Public client not available');
        return null;
      }

      if (!coreContractAddress || !coreContractABI) {
        console.error('Core contract not found on current network');
        return null;
      }

      const result = await publicClient.readContract({
        address: coreContractAddress,
        abi: coreContractABI,
        functionName: 'getMarket',
        args: [marketId],
      });
      
      console.log('result', result);
      if (!result) return null;
      
      // Transform the struct to Market interface
      const m = result as any;
      return {
        id: m.id,
        question: m.question,
        description: m.description,
        category: m.category,
        image: m.image,
        source: m.source,
        endTime: m.endTime,
        totalPool: m.totalPool,
        totalYes: m.totalYes,
        totalNo: m.totalNo,
        status: m.status,
        outcome: m.outcome,
        createdAt: m.createdAt,
      };
    } catch (error) {
      console.error('Error fetching market:', error);
      return null;
    }
  }, [coreContractAddress, coreContractABI, publicClient]);

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

      if (!coreContractAddress || !coreContractABI) {
        console.error('Core contract not found on current network');
        return 0n;
      }

      const data = await publicClient.readContract({
        address: coreContractAddress,
        abi: coreContractABI,
        functionName: 'getUserParticipation',
        args: [marketId, userAddress],
      });
      
      const [, , yes, no] = data as unknown as [boolean, boolean, bigint, bigint];
      return outcome ? (yes || 0n) : (no || 0n);
    } catch (error) {
      console.error('Error fetching user shares:', error);
      return 0n;
    }
  }, [coreContractAddress, coreContractABI, publicClient]);

  return {
    getMarket,
    getUserShares,
  };
};

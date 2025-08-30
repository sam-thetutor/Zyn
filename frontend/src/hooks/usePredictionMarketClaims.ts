import { useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { useContractAddress } from './useContractAddress';
import { formatEther, parseEther } from 'viem';
import type { WinnerInfo } from '../utils/contracts';

export const usePredictionMarketClaims = () => {
  const { claimsContractAddress, claimsContractABI, isSupportedNetwork } = useContractAddress();
  const publicClient = usePublicClient();

  const contractConfig = {
    address: claimsContractAddress || '0x0000000000000000000000000000000000000000',
    abi: claimsContractABI || [],
  };

  // Write contract functions
  const { writeContract, data: hash, isPending } = useWriteContract();

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess, isError } = useWaitForTransactionReceipt({
    hash,
  });

  // Calculate winners for a market
  const calculateWinners = useCallback(async (marketId: bigint) => {
    if (!isSupportedNetwork || !claimsContractAddress || !claimsContractABI) {
      throw new Error('Claims contract not found on current network');
    }

    writeContract({
      ...contractConfig,
      functionName: 'calculateWinners',
      args: [marketId],
    });
  }, [writeContract, claimsContractAddress, isSupportedNetwork, claimsContractABI, contractConfig]);

  // Claim winnings
  const claimWinnings = useCallback(async (marketId: bigint) => {
    if (!isSupportedNetwork || !claimsContractAddress || !claimsContractABI) {
      throw new Error('Claims contract not found on current network');
    }

    writeContract({
      ...contractConfig,
      functionName: 'claimWinnings',
      args: [marketId],
    });
  }, [writeContract, claimsContractAddress, isSupportedNetwork, claimsContractABI, contractConfig]);

  // Check if user is a winner
  const isWinner = useCallback(async (marketId: bigint, userAddress: string): Promise<boolean> => {
    if (!isSupportedNetwork || !claimsContractAddress || !claimsContractABI) {
      throw new Error('Claims contract not found on current network');
    }

    try {
      if (!publicClient) {
        throw new Error('Public client not available');
      }
      
      const winner = await publicClient.readContract({
        ...contractConfig,
        functionName: 'isWinner',
        args: [marketId, userAddress as `0x${string}`],
      });

      return Boolean(winner);
    } catch (error) {
      console.error('Error checking if user is winner:', error);
      return false;
    }
  }, [claimsContractAddress, isSupportedNetwork, claimsContractABI, contractConfig]);

  // Calculate user winnings
  const calculateUserWinnings = useCallback(async (marketId: bigint, userAddress: string): Promise<number> => {
    if (!isSupportedNetwork || !claimsContractAddress || !claimsContractABI) {
      throw new Error('Claims contract not found on current network');
    }

    try {
      if (!publicClient) {
        throw new Error('Public client not available');
      }
      
      const winnings = await publicClient.readContract({
        ...contractConfig,
        functionName: 'calculateUserWinnings',
        args: [marketId, userAddress as `0x${string}`],
      });

      return Number(winnings);
    } catch (error) {
      console.error('Error calculating user winnings:', error);
      return 0;
    }
  }, [claimsContractAddress, isSupportedNetwork, claimsContractABI, contractConfig]);

  // Check if user has already claimed
  const hasClaimed = useCallback(async (marketId: bigint, userAddress: string): Promise<boolean> => {
    if (!isSupportedNetwork || !claimsContractAddress || !claimsContractABI) {
      throw new Error('Claims contract not found on current network');
    }

    try {
      if (!publicClient) {
        throw new Error('Public client not available');
      }
      
      const claimed = await publicClient.readContract({
        ...contractConfig,
        functionName: 'hasClaimed',
        args: [marketId, userAddress as `0x${string}`],
      });

      return Number(claimed) > 0;
    } catch (error) {
      console.error('Error checking if user has claimed:', error);
      return false;
    }
  }, [claimsContractAddress, isSupportedNetwork, claimsContractABI, contractConfig]);

  // Get total winning shares for a market
  const getTotalWinningShares = useCallback(async (marketId: bigint): Promise<number> => {
    if (!isSupportedNetwork || !claimsContractAddress || !claimsContractABI) {
      throw new Error('Claims contract not found on current network');
    }

    try {
      if (!publicClient) {
        throw new Error('Public client not available');
      }
      
      const totalShares = await publicClient.readContract({
        ...contractConfig,
        functionName: 'totalWinningShares',
        args: [marketId],
      });

      return Number(totalShares);
    } catch (error) {
      console.error('Error getting total winning shares:', error);
      return 0;
    }
  }, [claimsContractAddress, isSupportedNetwork, claimsContractABI, contractConfig]);

  // Get comprehensive winner info for a user
  const getWinnerInfo = useCallback(async (marketId: bigint, userAddress: string): Promise<WinnerInfo | null> => {
    if (!isSupportedNetwork || !claimsContractAddress || !claimsContractABI) {
      throw new Error('Claims contract not found on current network');
    }

    try {
      const [isWinnerResult, winnings, hasClaimedResult] = await Promise.all([
        isWinner(marketId, userAddress),
        calculateUserWinnings(marketId, userAddress),
        hasClaimed(marketId, userAddress),
      ]);

      return {
        isWinner: isWinnerResult,
        winnings: BigInt(winnings),
        hasClaimed: hasClaimedResult,
      };
    } catch (error) {
      console.error('Error getting winner info:', error);
      return null;
    }
  }, [claimsContractAddress, isSupportedNetwork, claimsContractABI, isWinner, calculateUserWinnings, hasClaimed]);

  // Utility functions
  const formatEtherValue = useCallback((value: bigint | undefined): string => {
    if (!value) return '0';
    return formatEther(value);
  }, []);

  const parseEtherValue = useCallback((value: string): bigint => {
    return parseEther(value);
  }, []);

  return {
    // Contract state
    claimsContractAddress,
    
    // Transaction state
    isPending,
    isConfirming,
    isSuccess,
    isError,
    hash,
    
    // Write functions
    calculateWinners,
    claimWinnings,
    
    // Read functions (async)
    isWinner,
    calculateUserWinnings,
    hasClaimed,
    getTotalWinningShares,
    getWinnerInfo,
    
    // Utility functions
    formatEtherValue,
    parseEtherValue,
  };
};

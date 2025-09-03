import { useCallback, useEffect, useState } from 'react';
import { formatEther, parseEther, encodeFunctionData } from 'viem';
import { useAccount, usePublicClient, useWalletClient, useWriteContract } from 'wagmi';
import { getClaimsContractConfig } from '../config/contracts';
import { celo } from 'viem/chains';
import type { WinnerInfo } from '../types/contracts';

export const usePredictionMarketClaims = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { writeContractAsync } = useWriteContract();
  
  // Default to Celo mainnet for reading claims without wallet connection
  const defaultChainId = celo.id;
  
  // Transaction state management
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [hash, setHash] = useState<`0x${string}` | undefined>(undefined);

  // Reset state function
  const resetState = useCallback(() => {
    setIsPending(false);
    setIsConfirming(false);
    setIsSuccess(false);
    setIsError(false);
    setHash(undefined);
  }, []);

  // Update state function
  const updateState = useCallback((updates: {
    isPending?: boolean;
    isConfirming?: boolean;
    isSuccess?: boolean;
    isError?: boolean;
    hash?: `0x${string}`;
  }) => {
    if (updates.isPending !== undefined) setIsPending(updates.isPending);
    if (updates.isConfirming !== undefined) setIsConfirming(updates.isConfirming);
    if (updates.isSuccess !== undefined) setIsSuccess(updates.isSuccess);
    if (updates.isError !== undefined) setIsError(updates.isError);
    if (updates.hash !== undefined) setHash(updates.hash);
  }, []);

  // Calculate winners for a market
  const calculateWinners = useCallback(async (marketId: bigint) => {
    try {
      resetState();
      updateState({ isPending: true, isError: false });

      if (!address) {
        throw new Error('Wallet connection required');
      }

      const contractConfig = getClaimsContractConfig(defaultChainId);
      
      if (contractConfig.address === '0x0000000000000000000000000000000000000000') {
        throw new Error(`No claims contract deployed on current network. Please switch to Celo Mainnet or Base Mainnet.`);
      }

      const hash = await writeContractAsync({
        ...contractConfig,
        functionName: 'calculateWinners',
        args: [marketId],
      });

      updateState({ hash, isPending: false, isConfirming: true });
      
      // Wait for transaction receipt
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      updateState({ isConfirming: false, isSuccess: true });
      return { success: true, transactionHash: hash };
    } catch (error: any) {
      console.error('Calculate winners error:', error);
      updateState({ isPending: false, isConfirming: false, isError: true });
      return { success: false, error: error.message };
    }
  }, [address, defaultChainId, writeContractAsync, publicClient, resetState, updateState]);

  // Claim winnings
  const claimWinnings = useCallback(async (marketId: bigint) => {
    try {
      resetState();
      updateState({ isPending: true, isError: false });

      if (!address) {
        throw new Error('Wallet connection required');
      }

      const contractConfig = getClaimsContractConfig(defaultChainId);
      
      if (contractConfig.address === '0x0000000000000000000000000000000000000000') {
        throw new Error(`No claims contract deployed on current network. Please switch to Celo Mainnet or Base Mainnet.`);
      }

      const hash = await writeContractAsync({
        ...contractConfig,
        functionName: 'claimWinnings',
        args: [marketId],
      });

      updateState({ hash, isPending: false, isConfirming: true });
      
      // Wait for transaction receipt
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      updateState({ isConfirming: false, isSuccess: true });
      return { success: true, transactionHash: hash };
    } catch (error: any) {
      console.error('Claim winnings error:', error);
      updateState({ isPending: false, isConfirming: false, isError: true });
      return { success: false, error: error.message };
    }
  }, [address, defaultChainId, writeContractAsync, publicClient, resetState, updateState]);

  // Check if user is a winner
  const isWinner = useCallback(async (marketId: bigint, userAddress: string): Promise<boolean> => {
    try {
      const contractConfig = getClaimsContractConfig(defaultChainId);
      
      if (contractConfig.address === '0x0000000000000000000000000000000000000000') {
        throw new Error(`No claims contract deployed on current network.`);
      }

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
  }, [defaultChainId, publicClient]);

  // Calculate user winnings
  const calculateUserWinnings = useCallback(async (marketId: bigint, userAddress: string): Promise<number> => {
    try {
      const contractConfig = getClaimsContractConfig(defaultChainId);
      
      if (contractConfig.address === '0x0000000000000000000000000000000000000000') {
        throw new Error(`No claims contract deployed on current network.`);
      }

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
  }, [defaultChainId, publicClient]);

  // Check if user has already claimed
  const hasClaimed = useCallback(async (marketId: bigint, userAddress: string): Promise<boolean> => {
    try {
      const contractConfig = getClaimsContractConfig(defaultChainId);
      
      if (contractConfig.address === '0x0000000000000000000000000000000000000000') {
        throw new Error(`No claims contract deployed on current network.`);
      }

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
  }, [defaultChainId, publicClient]);

  // Get total winning shares for a market
  const getTotalWinningShares = useCallback(async (marketId: bigint): Promise<number> => {
    try {
      const contractConfig = getClaimsContractConfig(defaultChainId);
      
      if (contractConfig.address === '0x0000000000000000000000000000000000000000') {
        throw new Error(`No claims contract deployed on current network.`);
      }

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
  }, [defaultChainId, publicClient]);

  // Get detailed winnings breakdown
  const getWinningsBreakdown = useCallback(async (marketId: bigint, userAddress: string) => {
    try {
      const contractConfig = getClaimsContractConfig(defaultChainId);
      
      if (contractConfig.address === '0x0000000000000000000000000000000000000000') {
        throw new Error(`No claims contract deployed on current network.`);
      }

      if (!userAddress) {
        throw new Error('User address is required');
      }

      if (!publicClient) {
        throw new Error('Public client not available');
      }
      
      const breakdown = await publicClient.readContract({
        ...contractConfig,
        functionName: 'getWinningsBreakdown',
        args: [marketId, userAddress as `0x${string}`],
      });

      return breakdown;
    } catch (error) {
      console.error('Error getting winnings breakdown:', error);
      return null;
    }
  }, [defaultChainId, publicClient]);

  // Get comprehensive winner info for a user
  const getWinnerInfo = useCallback(async (marketId: bigint, userAddress: string): Promise<WinnerInfo | null> => {
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
  }, [isWinner, calculateUserWinnings, hasClaimed]);

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
    claimsContractAddress: getClaimsContractConfig(defaultChainId).address,
    
    // Transaction state
    isPending,
    isConfirming,
    isSuccess,
    isError,
    hash,
    
    // Wallet state
    userAddress: address,
    isConnected: !!address,
    
    // Write functions
    calculateWinners,
    claimWinnings,
    
    // Read functions (async)
    isWinner,
    calculateUserWinnings,
    hasClaimed,
    getTotalWinningShares,
    getWinningsBreakdown,
    getWinnerInfo,
    
    // Utility functions
    formatEtherValue,
    parseEtherValue,
  };
};

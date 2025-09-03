import { useCallback, useEffect, useState } from 'react';
import { formatEther, parseEther, encodeFunctionData } from 'viem';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { useContractAddress } from './useContractAddress.ts';
import type { WinnerInfo } from '../utils/contracts';
import { DIVVI_CONSUMER_ADDRESS } from '../utils/constants';
import { getReferralTag, submitReferral } from '@divvi/referral-sdk';

export const usePredictionMarketClaims = () => {
  const { 
    claimsContractAddress, 
    claimsContractABI, 
    isSupportedNetwork, 
    isConnected 
  } = useContractAddress();
  
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  // Transaction state management
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [hash, setHash] = useState<`0x${string}` | undefined>(undefined);



  // Handle referral submission when transaction succeeds
  useEffect(() => {
    if (isSuccess && hash && address) {
      const submitReferralData = async () => {
        try {
          await submitReferral({
            txHash: hash,
            chainId: 42220, // Celo Mainnet
          });
          console.log('Referral submitted successfully for claims transaction:', hash);
        } catch (error) {
          console.warn('Referral submission failed for claims, but transaction succeeded:', error);
        }
      };
      
      submitReferralData();
    }
  }, [isSuccess, hash, address]);

  // Generic transaction handler for claims
  const executeClaimsTransaction = useCallback(async (
    functionName: string,
    args: any[]
  ) => {
    if (!address) {
      throw new Error('Wallet connection required');
    }
    
    if (!isSupportedNetwork || !claimsContractAddress || !claimsContractABI || !walletClient) {
      throw new Error('Claims contract not found on current network');
    }

    try {
      setIsPending(true);
      setIsError(false);
      setIsSuccess(false);
      setHash(undefined);

      // Generate referral tag
      const referralTag = getReferralTag({
        user: address as `0x${string}`,
        consumer: DIVVI_CONSUMER_ADDRESS,
      });

      console.log(`Executing claims ${functionName} with referral tag:`, referralTag);

      // Encode the contract function call
      const contractData = encodeFunctionData({
        abi: claimsContractABI as any,
        functionName,
        args,
      });

      // Execute transaction with referral tag appended to data
      const txHash = await walletClient.sendTransaction({
        account: address as `0x${string}`,
        to: claimsContractAddress as `0x${string}`,
        data: (contractData + referralTag) as `0x${string}`,
      });

      console.log(`Claims transaction hash:`, txHash);

      setHash(txHash);
      setIsPending(false);
      setIsConfirming(true);

      // Wait for transaction receipt
      const receipt = await publicClient?.waitForTransactionReceipt({
        hash: txHash,
      });

      // Get chain ID and submit the referral
      const chainId = await walletClient.getChainId();
      await submitReferral({
        txHash: txHash,
        chainId: chainId,
      });

      setIsConfirming(false);
      setIsSuccess(true);
      
      return receipt;
    } catch (error) {
      setIsPending(false);
      setIsConfirming(false);
      setIsError(true);
      console.error(`Error executing claims ${functionName}:`, error);
      throw error;
    }
  }, [address, isSupportedNetwork, claimsContractAddress, claimsContractABI, walletClient, publicClient]);

  // Calculate winners for a market
  const calculateWinners = useCallback(async (marketId: bigint) => {
    return executeClaimsTransaction('calculateWinners', [marketId]);
  }, [executeClaimsTransaction]);

  // Claim winnings
  const claimWinnings = useCallback(async (marketId: bigint) => {
    return executeClaimsTransaction('claimWinnings', [marketId]);
  }, [executeClaimsTransaction]);

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
        address: claimsContractAddress as `0x${string}`,
        abi: claimsContractABI as any,
        functionName: 'isWinner',
        args: [marketId, userAddress as `0x${string}`],
      });

      return Boolean(winner);
    } catch (error) {
      console.error('Error checking if user is winner:', error);
      return false;
    }
  }, [claimsContractAddress, isSupportedNetwork, claimsContractABI, publicClient]);

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
        address: claimsContractAddress as `0x${string}`,
        abi: claimsContractABI as any,
        functionName: 'calculateUserWinnings',
        args: [marketId, userAddress as `0x${string}`],
      });

      return Number(winnings);
    } catch (error) {
      console.error('Error calculating user winnings:', error);
      return 0;
    }
  }, [claimsContractAddress, isSupportedNetwork, claimsContractABI, publicClient]);

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
        address: claimsContractAddress as `0x${string}`,
        abi: claimsContractABI as any,
        functionName: 'hasClaimed',
        args: [marketId, userAddress as `0x${string}`],
      });

      return Number(claimed) > 0;
    } catch (error) {
      console.error('Error checking if user has claimed:', error);
      return false;
    }
  }, [claimsContractAddress, isSupportedNetwork, claimsContractABI, publicClient]);

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
        address: claimsContractAddress as `0x${string}`,
        abi: claimsContractABI as any,
        functionName: 'totalWinningShares',
        args: [marketId],
      });

      return Number(totalShares);
    } catch (error) {
      console.error('Error getting total winning shares:', error);
      return 0;
    }
  }, [claimsContractAddress, isSupportedNetwork, claimsContractABI, publicClient]);

  // Get detailed winnings breakdown
  const getWinningsBreakdown = useCallback(async (marketId: bigint, userAddress: string) => {
    if (!isSupportedNetwork || !claimsContractAddress || !claimsContractABI) {
      throw new Error('Claims contract not found on current network');
    }

    if (!userAddress) {
      throw new Error('User address is required');
    }

    try {
      if (!publicClient) {
        throw new Error('Public client not available');
      }
      
      const breakdown = await publicClient.readContract({
        address: claimsContractAddress as `0x${string}`,
        abi: claimsContractABI as any,
        functionName: 'getWinningsBreakdown',
        args: [marketId, userAddress as `0x${string}`],
      });

      return breakdown;
    } catch (error) {
      console.error('Error getting winnings breakdown:', error);
      return null;
    }
  }, [claimsContractAddress, isSupportedNetwork, claimsContractABI, publicClient]);

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
    
    // Wallet state
    userAddress: address,
    isConnected,
    
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
import { useCallback, useMemo, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useReadContract } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { useContractAddress } from './useContractAddress.ts';
import type { Market, MarketStatus, UserParticipation } from '../utils/contracts';
import { getReferralTag, submitReferral } from '@divvi/referral-sdk';


export const usePredictionMarketCore = () => {
  const { coreContractAddress, coreContractABI, isSupportedNetwork } = useContractAddress();
  const publicClient = usePublicClient();
  const { address: userAddress } = useAccount();

  
  const contractConfig = useMemo(() => ({
    address: coreContractAddress || '0x0000000000000000000000000000000000000000',
    abi: coreContractABI || [],
  }), [coreContractAddress, coreContractABI]);

  // Read contract functions - Only require wallet for write operations
  const { data: totalMarkets = 0n, refetch: refetchTotalMarkets } = useReadContract({
    ...contractConfig,
    functionName: 'getMarketCount',
  });

  // Read market creation fee from contract
  const { data: marketCreationFeeData, refetch: refetchMarketCreationFee } = useReadContract({
    ...contractConfig,
    functionName: 'getMarketCreationFee',
  });

  // Default values for fees since they don't exist in the contract
  // Username change fee constant (unused but kept for reference)

  // Write contract functions
  const { writeContract, data: hash, isPending } = useWriteContract();
  console.log('hash', hash);

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess, isError } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle referral submission when transaction succeeds
  useEffect(() => {
    if (isSuccess && hash && userAddress) {
      const submitReferralData = async () => {
        try {
          await submitReferral({
            txHash: hash,
            chainId: 42220, // Celo Mainnet
          });
          console.log('Referral submitted successfully for transaction:', hash);
        } catch (error) {
          console.warn('Referral submission failed, but transaction succeeded:', error);
        }
      };
      
      submitReferralData();
    }
  }, [isSuccess, hash, userAddress]);

  // Create market - Requires wallet connection
  const createMarket = useCallback(async (
    question: string,
    description: string,
    category: string,
    image: string,
    source: string,
    endTime: bigint,
    value: bigint
  ) => {
    console.log('createMarket called with userAddress:', userAddress);
    console.log('isSupportedNetwork:', isSupportedNetwork);
    console.log('coreContractAddress:', coreContractAddress);
    
    if (!userAddress) {
      throw new Error('Wallet connection required to create markets');
    }
    
    if (!isSupportedNetwork || !coreContractAddress || !coreContractABI) {
      throw new Error('Core contract not found on current network');
    }

    try {
      // Use the userAddress from wagmi instead of creating a new wallet client
      console.log('Using userAddress for referral tag:', userAddress);

      // Step 1: Generate a referral tag for the user
      const referralTag = getReferralTag({
        user: userAddress as `0x${string}`, // Use the validated userAddress from wagmi
        consumer: '0x21D654daaB0fe1be0e584980ca7C1a382850939f', // Your Divvi Identifier
      });

      console.log('Creating market with referral tag:', referralTag);

      // Step 2: Send the transaction using wagmi's writeContract
      writeContract({
        ...contractConfig,
        functionName: 'createMarket',
        args: [question, description, category, image, source, endTime],
        value,
      });

      // Note: The transaction hash will be available in the hash state from useWriteContract
      // Referral tracking will be handled when the transaction succeeds
    } catch (error) {
      console.error('Error creating market:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('InvalidAddressError') || error.message.includes('Invalid Ethereum address')) {
          throw new Error('Wallet connection issue. Please reconnect your wallet and try again.');
        } else if (error.message.includes('Failed to get valid wallet account')) {
          throw new Error('Unable to access your wallet account. Please check your wallet connection.');
        }
      }
      
      throw error;
    }
  
  }, [writeContract, coreContractAddress, isSupportedNetwork, coreContractABI, contractConfig, userAddress]);

  // Buy shares - Requires wallet connection
  const buyShares = useCallback(async (
    marketId: bigint,
    outcome: boolean,
    value: bigint
  ) => {
    if (!userAddress) {
      throw new Error('Wallet connection required to buy shares');
    }
    
    if (!isSupportedNetwork || !coreContractAddress || !coreContractABI) {
      throw new Error('Core contract not found on current network');
    }

    try {
      // Use the userAddress from wagmi instead of creating a new wallet client
      console.log('Using userAddress for buyShares referral tag:', userAddress);

      // Step 1: Generate a referral tag for the user
      const referralTag = getReferralTag({
        user: userAddress as `0x${string}`, // Use the validated userAddress from wagmi
        consumer: '0x21D654daaB0fe1be0e584980ca7C1a382850939f', // Your Divvi Identifier
      });

      console.log('Buying shares with referral tag:', referralTag);

      // Step 2: Use wagmi's writeContract
      writeContract({
        ...contractConfig,
        functionName: 'buyShares',
        args: [marketId, outcome],
        value,
      });

      // Note: The transaction hash will be available in the hash state from useWriteContract
      // Referral tracking will be handled when the transaction succeeds
    } catch (error) {
      console.error('Error buying shares:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('InvalidAddressError') || error.message.includes('Invalid Ethereum address')) {
          throw new Error('Wallet connection issue. Please reconnect your wallet and try again.');
        } else if (error.message.includes('Failed to get valid wallet account')) {
          throw new Error('Unable to access your wallet account. Please check your wallet connection.');
        }
      }
      
      throw error;
    }
  }, [writeContract, coreContractAddress, isSupportedNetwork, coreContractABI, contractConfig, userAddress]);

  // Resolve market - Requires wallet connection
  const resolveMarket = useCallback(async (
    marketId: bigint,
    outcome: boolean
  ) => {
    if (!userAddress) {
      throw new Error('Wallet connection required to resolve markets');
    }
    
    if (!isSupportedNetwork || !coreContractAddress || !coreContractABI) {
      throw new Error('Core contract not found on current network');
    }

    writeContract({
      ...contractConfig,
      functionName: 'resolveMarket',
      args: [marketId, outcome],
    });
  }, [writeContract, coreContractAddress, isSupportedNetwork, coreContractABI, contractConfig, userAddress]);

  // Set username - Requires wallet connection
  const setUsername = useCallback(async (username: string) => {
    if (!userAddress) {
      throw new Error('Wallet connection required to set username');
    }
    
    if (!isSupportedNetwork || !coreContractAddress || !coreContractABI) {
      throw new Error('Core contract not found on current network');
    }

    writeContract({
      ...contractConfig,
      functionName: 'setUsername',
      args: [username],
    });
  }, [writeContract, coreContractAddress, isSupportedNetwork, coreContractABI, contractConfig, userAddress]);

  // Change username - Requires wallet connection
  const changeUsername = useCallback(async (newUsername: string) => {
    if (!userAddress) {
      throw new Error('Wallet connection required to change username');
    }
    
    if (!isSupportedNetwork || !coreContractAddress || !coreContractABI) {
      throw new Error('Core contract not found on current network');
    }

    writeContract({
      ...contractConfig,
      functionName: 'changeUsername',
      args: [newUsername],
    });
  }, [writeContract, coreContractAddress, isSupportedNetwork, coreContractABI, contractConfig, userAddress]);

  // Get market by ID - No wallet required
  const getMarket = useCallback(async (marketId: bigint): Promise<Market> => {
    if (!coreContractAddress || !coreContractABI || !publicClient) {
      throw new Error('Core contract not found');
    }

    try {
      const marketData = await publicClient.readContract({
        address: coreContractAddress as `0x${string}`,
        abi: coreContractABI as any,
        functionName: 'getMarket',
        args: [marketId],
      });

      if (!marketData) {
        throw new Error('Market data not found');
      }

      // Access marketData as an object with named properties
      const marketDataTyped = marketData as any;
      const market = {
        id: marketDataTyped.id as bigint,
        question: marketDataTyped.question as string,
        description: marketDataTyped.description as string,
        category: marketDataTyped.category as string,
        image: marketDataTyped.image as string,
        source: marketDataTyped.source as string,
        endTime: marketDataTyped.endTime as bigint,
        totalPool: marketDataTyped.totalPool as bigint,
        totalYes: marketDataTyped.totalYes as bigint,
        totalNo: marketDataTyped.totalNo as bigint,
        status: marketDataTyped.status as MarketStatus,
        outcome: marketDataTyped.outcome as boolean,
        createdAt: marketDataTyped.createdAt as bigint,
      };

      return market;
    } catch (error) {
      console.error('Error fetching market:', error);
      throw error;
    }
  }, [publicClient, coreContractAddress, coreContractABI]);

  // Get user participation - Requires wallet connection
  const getUserParticipation = useCallback(async (marketId: bigint, userAddress: string): Promise<UserParticipation | null> => {
    if (!userAddress) {
      return null; // Return null if no wallet connected
    }
    
    if (!coreContractAddress || !coreContractABI || !publicClient) {
      throw new Error('Core contract not found');
    }

    try {
      const participation = await publicClient.readContract({
        ...contractConfig,
        functionName: 'getUserParticipation',
        args: [marketId, userAddress as `0x${string}`],
      });

      if (!participation) return null;

      // Type assertion for the tuple
      const participationData = participation as [boolean, boolean, bigint, bigint];
      
      return {
        participated: participationData[0],
        side: participationData[1],
        yesShares: participationData[2],
        noShares: participationData[3],
      };
    } catch (error) {
      console.error('Error fetching user participation:', error);
      return null;
    }
  }, [coreContractAddress, coreContractABI, contractConfig, publicClient]);

  // Get user shares - Requires wallet connection
  const getUserShares = useCallback(async (marketId: bigint, userAddress: string, outcome: boolean): Promise<number> => {
    if (!userAddress) {
      return 0; // Return 0 if no wallet connected
    }
    
    if (!coreContractAddress || !coreContractABI || !publicClient) {
      throw new Error('Core contract not found');
    }

    try {
      const shares = await publicClient.readContract({
        ...contractConfig,
        functionName: 'getUserShares',
        args: [marketId, userAddress as `0x${string}`, outcome],
      });

      return Number(shares);
    } catch (error) {
      console.error('Error fetching user shares:', error);
      return 0;
    }
  }, [coreContractAddress, coreContractABI, contractConfig, publicClient]);

  // Get username - No wallet required
  const getUsername = useCallback(async (userAddress: string): Promise<string> => {
    if (!coreContractAddress || !coreContractABI || !publicClient) {
      throw new Error('Core contract not found');
    }

    try {
      const username = await publicClient.readContract({
        ...contractConfig,
        functionName: 'getUsername',
        args: [userAddress as `0x${string}`],
      });

      return username as string;
    } catch (error) {
      console.error('Error fetching username:', error);
      return '';
    }
  }, [coreContractAddress, coreContractABI, contractConfig, publicClient]);

  // Check if username is available - No wallet required
  const isUsernameAvailable = useCallback(async (username: string): Promise<boolean> => {
    if (!coreContractAddress || !coreContractABI || !publicClient) {
      throw new Error('Core contract not found');
    }

    try {
      const isAvailable = await publicClient.readContract({
        ...contractConfig,
        functionName: 'isUsernameAvailable',
        args: [username],
      });

      return isAvailable as boolean;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  }, [coreContractAddress, coreContractABI, contractConfig, publicClient]);

  // Username change fee function (unused but kept for reference)

  // Utility functions
  const formatEtherValue = useCallback((value: bigint | undefined): string => {
    if (!value) return '0';
    return formatEther(value);
  }, []);

  const parseEtherValue = useCallback((value: string): bigint => {
    return parseEther(value);
  }, []);

  // Memoized values
  const formattedMarketCreationFee = useMemo(() => {
    if (marketCreationFeeData) {
      return formatEther(marketCreationFeeData as bigint);
    }
    return "0.001"; // Fallback value
  }, [marketCreationFeeData]);
  
  const formattedUsernameChangeFee = useMemo(() => "0.00001", []); // Default value from contract constant

  // Handle referral submission after successful transactions
  const submitReferralAfterTransaction = useCallback(async (
    type: 'market_creation' | 'share_trading',
    marketId?: bigint,
    outcome?: boolean,
    txHash?: `0x${string}`
  ) => {
    if (!userAddress || !txHash) return;

    try {
      // Submit referral data to Divvi
      await submitReferral({
        txHash,
        chainId: 42220, // Celo Mainnet
        baseUrl: 'https://api.divvi.com', // Divvi API base URL
      });
      
      console.log('Referral submitted successfully:', { type, marketId, outcome, txHash });
    } catch (error) {
      console.error('Error submitting referral:', error);
    }
  }, [userAddress]);

  return {
    // Contract state
    coreContractAddress,
    totalMarkets,
    marketCreationFee: formattedMarketCreationFee,
    usernameChangeFee: formattedUsernameChangeFee,
    
    // Transaction state
    isPending,
    isConfirming,
    isSuccess,
    isError,
    hash,
    
    // Read functions
    refetchTotalMarkets,
    refetchMarketCreationFee,
    refetchUsernameChangeFee: () => {}, // No-op since we use default values
    
    // Write functions
    createMarket,
    buyShares,
    resolveMarket,
    setUsername,
    changeUsername,
    
    // Referral functions
    submitReferralAfterTransaction,
    
    // Read functions (async)
    getMarket,
    getUserParticipation,
    getUserShares,
    getUsername,
    isUsernameAvailable,
    
    // Utility functions
    formatEtherValue,
    parseEtherValue,
  };
};
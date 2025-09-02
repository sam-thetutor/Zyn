import { useCallback, useMemo, useEffect, useState } from 'react';
import { formatEther, parseEther, encodeFunctionData } from 'viem';
import { useContractAddress } from './useContractAddress.ts';
import useViemHook from './useViemHook.ts';
import type { Market, MarketStatus, UserParticipation } from '../utils/contracts';
import { getReferralTag, submitReferral } from '@divvi/referral-sdk';


export const usePredictionMarketCore = () => {
  const { 
    coreContractAddress, 
    coreContractABI, 
    isSupportedNetwork, 
    userAddress, 
    isConnected,
    connectWallet,
    disconnectWallet 
  } = useContractAddress();
  
  const { publicClient, walletClient } = useViemHook();
  
  // Transaction state management
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [hash, setHash] = useState<`0x${string}` | undefined>(undefined);
  
  // Contract data state
  const [totalMarkets, setTotalMarkets] = useState<bigint>(0n);
  const [marketCreationFeeData, setMarketCreationFeeData] = useState<bigint | undefined>(undefined);

  
  const contractConfig = useMemo(() => ({
    address: coreContractAddress || '0x0000000000000000000000000000000000000000',
    abi: coreContractABI || [],
  }), [coreContractAddress, coreContractABI]);

  // Manual data fetching functions
  const fetchTotalMarkets = useCallback(async () => {
    if (!publicClient || !coreContractAddress || !coreContractABI) return;
    
    try {
      const count = await publicClient.readContract({
        address: coreContractAddress as `0x${string}`,
        abi: coreContractABI as any,
        functionName: 'getMarketCount',
        args: [],
      });
      setTotalMarkets(count as bigint);
    } catch (error) {
      console.error('Error fetching total markets:', error);
    }
  }, [publicClient, coreContractAddress, coreContractABI]);

  const fetchMarketCreationFee = useCallback(async () => {
    if (!publicClient || !coreContractAddress || !coreContractABI) return;
    
    try {
      const fee = await publicClient.readContract({
        address: coreContractAddress as `0x${string}`,
        abi: coreContractABI as any,
        functionName: 'getMarketCreationFee',
        args: [],
      });
      setMarketCreationFeeData(fee as bigint);
    } catch (error) {
      console.error('Error fetching market creation fee:', error);
    }
  }, [publicClient, coreContractAddress, coreContractABI]);

  // Load initial data
  useEffect(() => {
    fetchTotalMarkets();
    fetchMarketCreationFee();
  }, [publicClient, coreContractAddress, coreContractABI]);

  // Note: Referral submission is now handled directly in executeTransaction

  // Generic transaction handler
  const executeTransaction = useCallback(async (
    functionName: string,
    args: any[],
    value?: bigint
  ) => {
    if (!userAddress) {
      throw new Error('Wallet connection required');
    }
    
    if (!isSupportedNetwork || !coreContractAddress || !coreContractABI || !walletClient) {
      throw new Error('Core contract not found on current network');
    }

    try {
      setIsPending(true);
      setIsError(false);
      setIsSuccess(false);
      setHash(undefined);

      // Generate referral tag
      const referralTag = getReferralTag({
        user: userAddress as `0x${string}`,
        consumer: '0x21D654daaB0fe1be0e584980ca7C1a382850939f',
      });

      console.log(`Executing ${functionName} with referral tag:`, referralTag);

      // Encode the contract function call
      const contractData = encodeFunctionData({
        abi: coreContractABI as any,
        functionName,
        args,
      });

      // Execute transaction with referral tag appended to data
      const txHash = await walletClient.sendTransaction({
        account: userAddress as `0x${string}`,
        to: coreContractAddress as `0x${string}`,
        data: (contractData + referralTag) as `0x${string}`, 
        value: value || 0n,
      });

      console.log(`Transaction hash:`, txHash);

     
      setIsPending(false);
      setIsConfirming(true);

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({
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
      
      // Refresh data after successful transaction
      fetchTotalMarkets();
      
      return receipt;
    } catch (error) {
      setIsPending(false);
      setIsConfirming(false);
      setIsError(true);
      console.error(`Error executing ${functionName}:`, error);
      throw error;
    }
  }, [userAddress, isSupportedNetwork, coreContractAddress, coreContractABI, walletClient, publicClient, fetchTotalMarkets]);

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
    return executeTransaction(
      'createMarket',
      [question, description, category, image, source, endTime],
      value
    );
  }, [executeTransaction]);

  // Buy shares - Requires wallet connection
  const buyShares = useCallback(async (
    marketId: bigint,
    outcome: boolean,
    value: bigint
  ) => {
    return executeTransaction(
      'buyShares',
      [marketId, outcome],
      value
    );
  }, [executeTransaction]);

  // Resolve market - Requires wallet connection
  const resolveMarket = useCallback(async (
    marketId: bigint,
    outcome: boolean
  ) => {
    return executeTransaction(
      'resolveMarket',
      [marketId, outcome]
    );
  }, [executeTransaction]);

  // Set username - Requires wallet connection
  const setUsername = useCallback(async (username: string) => {
    return executeTransaction(
      'setUsername',
      [username]
    );
  }, [executeTransaction]);

  // Change username - Requires wallet connection
  const changeUsername = useCallback(async (newUsername: string) => {
    return executeTransaction(
      'changeUsername',
      [newUsername]
    );
  }, [executeTransaction]);

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
        endTime: marketDataTyped.endTime as bigint,
        totalPool: marketDataTyped.totalPool as bigint,
        totalYes: marketDataTyped.totalYes as bigint,
        totalNo: marketDataTyped.totalNo as bigint,
        status: marketDataTyped.status as MarketStatus,
        outcome: marketDataTyped.outcome as boolean,
        createdAt: marketDataTyped.createdAt as bigint,
        creator: marketDataTyped.creator as string,
      };

      return market;
    } catch (error) {
      console.error('Error fetching market:', error);
      throw error;
    }
  }, [publicClient, coreContractAddress, coreContractABI]);

  // Get market metadata by ID - No wallet required
  const getMarketMetadata = useCallback(async (marketId: bigint) => {
    if (!coreContractAddress || !coreContractABI || !publicClient) {
      throw new Error('Core contract not found');
    }

    try {
      const metadata = await publicClient.readContract({
        address: coreContractAddress as `0x${string}`,
        abi: coreContractABI as any,
        functionName: 'getMarketMetadata',
        args: [marketId],
      });

      return metadata;
    } catch (error) {
      console.error('Error fetching market metadata:', error);
      throw error;
    }
  }, [coreContractAddress, coreContractABI, publicClient]);

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
    
    // Wallet state
    userAddress,
    isConnected,
    connectWallet,
    disconnectWallet,
    
    // Read functions (refetch)
    refetchTotalMarkets: fetchTotalMarkets,
    refetchMarketCreationFee: fetchMarketCreationFee,
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
    getMarketMetadata,
    getUserParticipation,
    getUserShares,
    getUsername,
    isUsernameAvailable,
    
    // Utility functions
    formatEtherValue,
    parseEtherValue,
  };
};
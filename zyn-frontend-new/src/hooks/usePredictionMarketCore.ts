import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  useAccount, 
  useSwitchChain, 
  useWriteContract
} from 'wagmi';
import { 
  parseEther, 
  formatEther,
  createPublicClient,
  http
} from 'viem';
import type { Hex } from 'viem';
import { celo, base } from 'viem/chains';
import { 
  getCoreContractConfig
} from '../config/contracts';
import type { 
  Market, 
  MarketMetadata, 
  MarketStatus, 
  UserParticipation, 
  CreatorFeeData,
  ContractState 
} from '../types/contracts';

// Get referral data suffix (placeholder - implement if needed)
const getReferralDataSuffix = () => {
  // TODO: Implement referral logic if needed
  return '';
};

// Submit referral (placeholder - implement if needed)
const submitDivviReferral = async (txHash: Hex, chainId: number) => {
  // TODO: Implement referral submission if needed
  console.log('Referral submission placeholder:', { txHash, chainId });
};

interface UsePredictionMarketCoreReturn {
  contractState: ContractState;
  
  // Read functions
  totalMarkets: bigint | undefined;
  marketCreationFee: string;
  usernameChangeFee: string;
  
  // Loading states
  isLoadingMarkets: boolean;
  totalMarketsError: Error | null;
  marketCreationFeeError: Error | null;
  usernameChangeFeeError: Error | null;
  
  // Refetch functions
  refetchTotalMarkets: () => Promise<void>;
  
  // Write functions
  createMarket: (params: {
    question: string;
    description: string;
    category: string;
    image: string;
    source: string;
    endTime: bigint;
    value: bigint;
  }) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  
  buyShares: (params: {
    marketId: bigint;
    outcome: boolean;
    value: bigint;
  }) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  
  resolveMarket: (params: {
    marketId: bigint;
    outcome: boolean;
  }) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  
  setUsername: (username: string) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  
  changeUsername: (newUsername: string) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  
  claimCreatorFee: (marketId: bigint) => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  
  // Read functions (async)
  getMarket: (marketId: bigint) => Promise<Market>;
  getMarketMetadata: (marketId: bigint) => Promise<MarketMetadata>;
  getCreatorFeeInfo: (marketId: bigint) => Promise<CreatorFeeData>;
  getUserParticipation: (marketId: bigint, userAddress: string) => Promise<UserParticipation | null>;
  getUserShares: (marketId: bigint, userAddress: string, outcome: boolean) => Promise<number>;
  getUsername: (userAddress: string) => Promise<string>;
  isUsernameAvailable: (username: string) => Promise<boolean>;
  
  // Utility functions
  formatEtherValue: (value: bigint | undefined) => string;
  parseEtherValue: (value: string) => bigint;
  resetState: () => void;
  switchToChain: (chainId: number) => Promise<boolean>;
}

export function usePredictionMarketCore(selectedChainId?: number): UsePredictionMarketCoreReturn {
  const { address: userAddress, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  
  const [fallbackChainId, setFallbackChainId] = useState<number | undefined>(undefined);
  
  const [contractState, setContractState] = useState<ContractState>({
    isLoading: false,
    error: null,
    success: false
  });

  useEffect(() => {
    if (chainId) {
      setFallbackChainId(chainId);
    }
  }, [chainId]);

  const updateState = useCallback((updates: Partial<ContractState>) => {
    setContractState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetState = useCallback(() => {
    setContractState({
      isLoading: false,
      error: null,
      success: false
    });
  }, []);

  const ensureCorrectChain = useCallback(async (targetChainId?: number): Promise<void> => {
    try {
      const currentChainId = chainId || fallbackChainId;
      const desiredChainId = targetChainId || selectedChainId || celo.id;
      
      if (!currentChainId || currentChainId !== desiredChainId) {
        console.log(`Switching to chain ${desiredChainId}. Current chain: ${currentChainId || 'undefined'}`);
        await switchChain({ chainId: desiredChainId });
        await new Promise(resolve => setTimeout(resolve, 1000));
        setFallbackChainId(desiredChainId);
      }
    } catch (error) {
      console.error('Chain switching failed:', error);
      console.warn('Chain switching failed, but continuing with operation. Please ensure you are on the correct network.');
    }
  }, [chainId, fallbackChainId, switchChain, selectedChainId]);

  const switchToChain = useCallback(async (targetChainId: number): Promise<boolean> => {
    try {
      await switchChain({ chainId: targetChainId });
      await new Promise(resolve => setTimeout(resolve, 1000));
      setFallbackChainId(targetChainId);
      return true;
    } catch (error) {
      console.error('Chain switching failed:', error);
      return false;
    }
  }, [switchChain]);

  // Read contract data using createPublicClient for better control
  // Default to Celo mainnet when no chainId is provided
  const defaultChainId = chainId || celo.id;
  const contractConfig = useMemo(() => getCoreContractConfig(defaultChainId), [defaultChainId]);
  
  // Use useState and useEffect to fetch data with createPublicClient
  const [totalMarkets, setTotalMarkets] = useState<bigint | undefined>(undefined);
  const [totalMarketsError, setTotalMarketsError] = useState<Error | null>(null);
  const [isLoadingMarkets, setIsLoadingMarkets] = useState(true);

  useEffect(() => {
    const fetchTotalMarkets = async () => {
      try {
        setIsLoadingMarkets(true);
        setTotalMarketsError(null);
        
        const client = createPublicClient({
          chain: defaultChainId === base.id ? base : celo,
          transport: http()
        });

        const result = await client.readContract({
          ...contractConfig,
          functionName: 'getMarketCount',
          args: []
        }) as bigint;

        setTotalMarkets(result);
      } catch (error: any) {
        setTotalMarketsError(error);
      } finally {
        setIsLoadingMarkets(false);
      }
    };

    fetchTotalMarkets();
  }, [defaultChainId, contractConfig]);

  // Refetch function for total markets
  const refetchTotalMarkets = useCallback(async () => {
    try {
      setIsLoadingMarkets(true);
      setTotalMarketsError(null);
      
      const client = createPublicClient({
        chain: defaultChainId === celo.id ? celo : base,
        transport: http()
      });

      const result = await client.readContract({
        ...contractConfig,
        functionName: 'getMarketCount',
        args: []
      }) as bigint;

      setTotalMarkets(result);
    } catch (error: any) {
      setTotalMarketsError(error);
    } finally {
      setIsLoadingMarkets(false);
    }
  }, [defaultChainId, contractConfig]);



  // Use useState and useEffect for market creation fee as well
  const [marketCreationFeeWei, setMarketCreationFeeWei] = useState<bigint | undefined>(undefined);
  const [marketCreationFeeError, setMarketCreationFeeError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMarketCreationFee = async () => {
      try {
        setMarketCreationFeeError(null);
        
        const client = createPublicClient({
          chain: defaultChainId === celo.id ? celo : base,
          transport: http()
        });

        const result = await client.readContract({
          ...contractConfig,
          functionName: 'marketCreationFee',
          args: []
        }) as bigint;

        setMarketCreationFeeWei(result);
      } catch (error: any) {
        setMarketCreationFeeError(error);
      }
    };

    fetchMarketCreationFee();
  }, [defaultChainId, contractConfig]);

  // Use useState and useEffect for username change fee as well
  const [usernameChangeFeeWei, setUsernameChangeFeeWei] = useState<bigint | undefined>(undefined);
  const [usernameChangeFeeError, setUsernameChangeFeeError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUsernameChangeFee = async () => {
      try {
        setUsernameChangeFeeError(null);
        
        const client = createPublicClient({
          chain: defaultChainId === celo.id ? celo : base,
          transport: http()
        });

        const result = await client.readContract({
          ...contractConfig,
          functionName: 'usernameChangeFee',
          args: []
        }) as bigint;

        setUsernameChangeFeeWei(result);
      } catch (error: any) {
        setUsernameChangeFeeError(error);
      }
    };

    fetchUsernameChangeFee();
  }, [defaultChainId, contractConfig]);

  // Format fee values
  const marketCreationFee = marketCreationFeeWei ? formatEther(marketCreationFeeWei) : '0.01';
  const usernameChangeFee = usernameChangeFeeWei ? formatEther(usernameChangeFeeWei) : '0.00001';

  // Create market
  const createMarket = useCallback(async (params: {
    question: string;
    description: string;
    category: string;
    image: string;
    source: string;
    endTime: bigint;
    value: bigint;
  }): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
    try {
      resetState();
      updateState({ isLoading: true, error: null });

      if (!isConnected || !userAddress) {
        throw new Error('Wallet not connected - please connect your wallet first');
      }

      await ensureCorrectChain();
      await new Promise(resolve => setTimeout(resolve, 500));

      const hash = await writeContractAsync({
        ...getCoreContractConfig(chainId),
        functionName: 'createMarket',
        args: [
          params.question,
          params.description,
          params.category,
          params.image,
          params.source,
          params.endTime
        ],
        value: params.value,
        // @ts-ignore dataSuffix not in wagmi types yet
        dataSuffix: getReferralDataSuffix()
      });

      updateState({ transactionHash: hash });
      updateState({ isLoading: false, success: true });

      // Submit referral asynchronously
      const finalChainId = chainId || fallbackChainId || celo.id;
      submitDivviReferral(hash as Hex, finalChainId).catch(() => {});

      return { success: true, transactionHash: hash };
    } catch (error: any) {
      console.error('Create market error:', error);
      
      let errorMessage = error.message || 'Failed to create market';
      
      if (error.message?.includes('getChainId is not a function')) {
        errorMessage = 'Wallet connection issue detected. Please try disconnecting and reconnecting your wallet.';
      }
      
      updateState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [updateState, resetState, isConnected, userAddress, writeContractAsync, ensureCorrectChain, chainId, fallbackChainId]);

  // Buy shares
  const buyShares = useCallback(async (params: {
    marketId: bigint;
    outcome: boolean;
    value: bigint;
  }): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
    try {
      resetState();
      updateState({ isLoading: true, error: null });

      if (!isConnected || !userAddress) {
        throw new Error('Wallet not connected - please connect your wallet first');
      }

      await ensureCorrectChain();
      await new Promise(resolve => setTimeout(resolve, 500));

      const hash = await writeContractAsync({
        ...getCoreContractConfig(chainId),
        functionName: 'buyShares',
        args: [params.marketId, params.outcome],
        value: params.value,
        // @ts-ignore dataSuffix not in wagmi types yet
        dataSuffix: getReferralDataSuffix()
      });

      updateState({ transactionHash: hash });
      updateState({ isLoading: false, success: true });

      const finalChainId = chainId || fallbackChainId || celo.id;
      submitDivviReferral(hash as Hex, finalChainId).catch(() => {});

      return { success: true, transactionHash: hash };
    } catch (error: any) {
      console.error('Buy shares error:', error);
      
      let errorMessage = error.message || 'Failed to buy shares';
      
      if (error.message?.includes('getChainId is not a function')) {
        errorMessage = 'Wallet connection issue detected. Please try disconnecting and reconnecting your wallet.';
      }
      
      updateState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [updateState, resetState, isConnected, userAddress, ensureCorrectChain, writeContractAsync, chainId, fallbackChainId]);

  // Resolve market
  const resolveMarket = useCallback(async (params: {
    marketId: bigint;
    outcome: boolean;
  }): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
    try {
      resetState();
      updateState({ isLoading: true, error: null });

      if (!isConnected || !userAddress) {
        throw new Error('Wallet not connected - please connect your wallet first');
      }

      await ensureCorrectChain();
      await new Promise(resolve => setTimeout(resolve, 500));

      const hash = await writeContractAsync({
        ...getCoreContractConfig(chainId),
        functionName: 'resolveMarket',
        args: [params.marketId, params.outcome],
        // @ts-ignore dataSuffix not in wagmi types yet
        dataSuffix: getReferralDataSuffix()
      });

      updateState({ transactionHash: hash });
      updateState({ isLoading: false, success: true });

      const finalChainId = chainId || fallbackChainId || celo.id;
      submitDivviReferral(hash as Hex, finalChainId).catch(() => {});

      return { success: true, transactionHash: hash };
    } catch (error: any) {
      console.error('Resolve market error:', error);
      updateState({ isLoading: false, error: error.message || 'Failed to resolve market' });
      return { success: false, error: error.message || 'Failed to resolve market' };
    }
  }, [updateState, resetState, isConnected, userAddress, ensureCorrectChain, writeContractAsync, chainId, fallbackChainId]);

  // Set username
  const setUsername = useCallback(async (username: string): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
    try {
      resetState();
      updateState({ isLoading: true, error: null });

      if (!isConnected || !userAddress) {
        throw new Error('Wallet not connected - please connect your wallet first');
      }

      await ensureCorrectChain();
      await new Promise(resolve => setTimeout(resolve, 500));

      const hash = await writeContractAsync({
        ...getCoreContractConfig(chainId),
        functionName: 'setUsername',
        args: [username],
        // @ts-ignore dataSuffix not in wagmi types yet
        dataSuffix: getReferralDataSuffix()
      });

      updateState({ transactionHash: hash });
      updateState({ isLoading: false, success: true });

      const finalChainId = chainId || fallbackChainId || celo.id;
      submitDivviReferral(hash as Hex, finalChainId).catch(() => {});

      return { success: true, transactionHash: hash };
    } catch (error: any) {
      console.error('Set username error:', error);
      updateState({ isLoading: false, error: error.message || 'Failed to set username' });
      return { success: false, error: error.message || 'Failed to set username' };
    }
  }, [updateState, resetState, isConnected, userAddress, ensureCorrectChain, writeContractAsync, chainId, fallbackChainId]);

  // Change username
  const changeUsername = useCallback(async (newUsername: string): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
    try {
      resetState();
      updateState({ isLoading: true, error: null });

      if (!isConnected || !userAddress) {
        throw new Error('Wallet not connected - please connect your wallet first');
      }

      await ensureCorrectChain();
      await new Promise(resolve => setTimeout(resolve, 500));

      const hash = await writeContractAsync({
        ...getCoreContractConfig(chainId),
        functionName: 'changeUsername',
        args: [newUsername],
        // @ts-ignore dataSuffix not in wagmi types yet
        dataSuffix: getReferralDataSuffix()
      });

      updateState({ transactionHash: hash });
      updateState({ isLoading: false, success: true });

      const finalChainId = chainId || fallbackChainId || celo.id;
      submitDivviReferral(hash as Hex, finalChainId).catch(() => {});

      return { success: true, transactionHash: hash };
    } catch (error: any) {
      console.error('Change username error:', error);
      updateState({ isLoading: false, error: error.message || 'Failed to change username' });
      return { success: false, error: error.message || 'Failed to change username' };
    }
  }, [updateState, resetState, isConnected, userAddress, ensureCorrectChain, writeContractAsync, chainId, fallbackChainId]);

  // Claim creator fee
  const claimCreatorFee = useCallback(async (marketId: bigint): Promise<{ success: boolean; transactionHash?: string; error?: string }> => {
    try {
      resetState();
      updateState({ isLoading: true, error: null });

      if (!isConnected || !userAddress) {
        throw new Error('Wallet not connected - please connect your wallet first');
      }

      await ensureCorrectChain();
      await new Promise(resolve => setTimeout(resolve, 500));

      const hash = await writeContractAsync({
        ...getCoreContractConfig(chainId),
        functionName: 'claimCreatorFee',
        args: [marketId],
        // @ts-ignore dataSuffix not in wagmi types yet
        dataSuffix: getReferralDataSuffix()
      });

      updateState({ transactionHash: hash });
      updateState({ isLoading: false, success: true });

      const finalChainId = chainId || fallbackChainId || celo.id;
      submitDivviReferral(hash as Hex, finalChainId).catch(() => {});

      return { success: true, transactionHash: hash };
    } catch (error: any) {
      console.error('Claim creator fee error:', error);
      updateState({ isLoading: false, error: error.message || 'Failed to claim creator fee' });
      return { success: false, error: error.message || 'Failed to claim creator fee' };
    }
  }, [updateState, resetState, isConnected, userAddress, ensureCorrectChain, writeContractAsync, chainId, fallbackChainId]);

  // Read functions using createPublicClient
  const getMarket = useCallback(async (marketId: bigint): Promise<Market> => {
    try {
      const client = createPublicClient({
        chain: defaultChainId === base.id ? base : celo,
        transport: http()
      });

      const result = await client.readContract({
        ...getCoreContractConfig(defaultChainId),
        functionName: 'getMarket',
        args: [marketId]
      }) as any;

      return {
        id: result.id as bigint,
        question: result.question as string,
        endTime: result.endTime as bigint,
        totalPool: result.totalPool as bigint,
        totalYes: result.totalYes as bigint,
        totalNo: result.totalNo as bigint,
        status: result.status as MarketStatus,
        outcome: result.outcome as boolean,
        createdAt: result.createdAt as bigint,
        creator: result.creator as string,
      };
    } catch (error: any) {
      console.error('Get market error:', error);
      throw error;
    }
  }, [defaultChainId]);

  const getMarketMetadata = useCallback(async (marketId: bigint): Promise<MarketMetadata> => {
    try {
      const client = createPublicClient({
        chain: defaultChainId === base.id ? base : celo,
        transport: http()
      });

      const result = await client.readContract({
        ...getCoreContractConfig(defaultChainId),
        functionName: 'getMarketMetadata',
        args: [marketId]
      }) as any;

      return {
        description: result.description as string,
        category: result.category as string,
        image: result.image as string,
        source: result.source as string,
      };
    } catch (error: any) {
      console.error('Get market metadata error:', error);
      throw error;
    }
  }, [defaultChainId]);

  const getCreatorFeeInfo = useCallback(async (marketId: bigint): Promise<CreatorFeeData> => {
    try {
      const client = createPublicClient({
        chain: defaultChainId === base.id ? base : celo,
        transport: http()
      });

      const result = await client.readContract({
        ...getCoreContractConfig(defaultChainId),
        functionName: 'getCreatorFeeInfo',
        args: [marketId]
      }) as [string, bigint, boolean];

      return {
        creator: result[0],
        fee: result[1],
        claimed: result[2]
      };
    } catch (error: any) {
      console.error('Get creator fee info error:', error);
      throw error;
    }
  }, [defaultChainId]);

  const getUserParticipation = useCallback(async (marketId: bigint, userAddress: string): Promise<UserParticipation | null> => {
    if (!userAddress) return null;
    
    try {
      const client = createPublicClient({
        chain: defaultChainId === base.id ? base : celo,
        transport: http()
      });

      const result = await client.readContract({
        ...getCoreContractConfig(defaultChainId),
        functionName: 'getUserParticipation',
        args: [marketId, userAddress as `0x${string}`]
      }) as [boolean, boolean, bigint, bigint];

      return {
        participated: result[0],
        side: result[1],
        yesShares: result[2],
        noShares: result[3],
      };
    } catch (error: any) {
      console.error('Get user participation error:', error);
      return null;
    }
  }, [defaultChainId]);

  const getUserShares = useCallback(async (marketId: bigint, userAddress: string, outcome: boolean): Promise<number> => {
    if (!userAddress) return 0;
    
    try {
      const client = createPublicClient({
        chain: defaultChainId === base.id ? base : celo,
        transport: http()
      });

      const result = await client.readContract({
        ...getCoreContractConfig(defaultChainId),
        functionName: 'getUserShares',
        args: [marketId, userAddress as `0x${string}`, outcome]
      }) as bigint;

      return Number(result);
    } catch (error: any) {
      console.error('Get user shares error:', error);
      return 0;
    }
  }, [defaultChainId]);

  const getUsername = useCallback(async (userAddress: string): Promise<string> => {
    try {
      const client = createPublicClient({
        chain: defaultChainId === base.id ? base : celo,
        transport: http()
      });

      const result = await client.readContract({
        ...getCoreContractConfig(defaultChainId),
        functionName: 'getUsername',
        args: [userAddress as `0x${string}`]
      }) as string;

      return result;
    } catch (error: any) {
      console.error('Get username error:', error);
      return '';
    }
  }, [defaultChainId]);

  const isUsernameAvailable = useCallback(async (username: string): Promise<boolean> => {
    try {
      const client = createPublicClient({
        chain: defaultChainId === base.id ? base : celo,
        transport: http()
      });

      const result = await client.readContract({
        ...getCoreContractConfig(defaultChainId),
        functionName: 'isUsernameAvailable',
        args: [username]
      }) as boolean;

      return result;
    } catch (error: any) {
      console.error('Is username available error:', error);
      return false;
    }
  }, [defaultChainId]);

  // Utility functions
  const formatEtherValue = useCallback((value: bigint | undefined): string => {
    if (!value) return '0';
    return formatEther(value);
  }, []);

  const parseEtherValue = useCallback((value: string): bigint => {
    return parseEther(value);
  }, []);

  return {
    contractState,
    
    // Read data
    totalMarkets,
    marketCreationFee,
    usernameChangeFee,
    
    // Loading states
    isLoadingMarkets,
    totalMarketsError,
    marketCreationFeeError,
    usernameChangeFeeError,
    
    // Refetch functions
    refetchTotalMarkets,
    
    // Write functions
    createMarket,
    buyShares,
    resolveMarket,
    setUsername,
    changeUsername,
    claimCreatorFee,
    
    // Read functions (async)
    getMarket,
    getMarketMetadata,
    getCreatorFeeInfo,
    getUserParticipation,
    getUserShares,
    getUsername,
    isUsernameAvailable,
    
    // Utility functions
    formatEtherValue,
    parseEtherValue,
    resetState,
    switchToChain
  };
}

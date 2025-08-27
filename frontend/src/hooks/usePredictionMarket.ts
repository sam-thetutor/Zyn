import { useCallback, useMemo } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '../utils/constants';
import { formatEther, parseEther } from 'viem';
import { readContract } from 'viem/actions';

export const usePredictionMarket = () => {
  const contractAddress = CONTRACTS.PREDICTION_MARKET.address;

  let contractCONFIG = {
    address: CONTRACTS.PREDICTION_MARKET.address,
    abi: CONTRACTS.PREDICTION_MARKET.abi,
  }
    
  // console.log('🔍 usePredictionMarket - Contract Address:', contractAddress);
  // console.log('🔍 usePredictionMarket - ABI imported:', !!PREDICTION_MARKET_ABI);

  // Read contract functions
  const { data: totalMarkets = 0n, refetch: refetchTotalMarkets, error: totalMarketsError } = useReadContract({
    ...contractCONFIG,
    functionName: 'getTotalMarkets',
  });


  const getTotalMarkets = useCallback(async () => {
    const totalMarkets = await useReadContract({
      ...contractCONFIG,
      functionName: 'getTotalMarkets',
    });
    return totalMarkets;
  }, [contractCONFIG]);

  // console.log('🔍 usePredictionMarket - totalMarkets:', totalMarkets, 'error:', totalMarketsError);
  // console.log('🔍 usePredictionMarket - totalMarkets type:', typeof totalMarkets);
  // console.log('🔍 usePredictionMarket - totalMarketsError type:', typeof totalMarketsError);

  const { data: feeInfo, refetch: refetchFeeInfo } = useReadContract({
    ...contractCONFIG,
    functionName: 'getFeeInfo',
  });

  const { data: creationFee, refetch: refetchCreationFee } = useReadContract({
    ...contractCONFIG,
    functionName: 'marketCreationFee',
  });

  const { data: tradingFee, refetch: refetchTradingFee } = useReadContract({
    ...contractCONFIG,
    functionName: 'tradingFee',
  });

  // Write contract functions
  const { writeContract, data: hash, isPending } = useWriteContract();

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess, isError } = useWaitForTransactionReceipt({
    hash,
  });

  // Create market
  const createMarket = useCallback(async (
    question: string,
    description: string,
    category: string,
    image: string,
    endTime: bigint,
    value: bigint
  ) => {
    writeContract({
      ...contractCONFIG,
      functionName: 'createMarket',
      args: [question, description, category, image, endTime],
      value,
    });
  }, [writeContract, contractAddress]);

  // Buy shares
  const buyShares = useCallback(async (
    marketId: bigint,
    outcome: boolean,
    value: bigint
  ) => {
    writeContract({
      ...contractCONFIG,
      functionName: 'buyShares',
      args: [marketId, outcome],
      value,
    });
  }, [writeContract, contractAddress]);



  // Resolve market
  const resolveMarket = useCallback(async (
    marketId: bigint,
    outcome: boolean
  ) => {
    writeContract({
      ...contractCONFIG,
      functionName: 'resolveMarket',
      args: [marketId, outcome],
    });
  }, [writeContract, contractAddress]);

  // Claim winnings
  const claimWinnings = useCallback(async (marketId: bigint) => {
    writeContract({
        ...contractCONFIG,
      functionName: 'claimWinnings',
      args: [marketId],
    });
  }, [writeContract, contractAddress]);

  // Utility functions
  const formatEtherValue = useCallback((value: bigint | undefined): string => {
    if (!value) return '0';
    return formatEther(value);
  }, []);

  const parseEtherValue = useCallback((value: string): bigint => {
    return parseEther(value);
  }, []);

  // Memoized values
  const formattedCreationFee = useMemo(() => formatEtherValue(creationFee as bigint | undefined), [creationFee, formatEtherValue]);
  const formattedTradingFee = useMemo(() => formatEtherValue(tradingFee as bigint | undefined), [tradingFee, formatEtherValue]);

  return {
    // Contract state
    contractAddress,
    totalMarkets,
    feeInfo,
    creationFee: formattedCreationFee,
    tradingFee: formattedTradingFee,
    
    // Transaction state
    isPending,
    isConfirming,
    isSuccess,
    isError,
    hash,
    
    // Read functions
    refetchTotalMarkets,
    refetchFeeInfo,
    refetchCreationFee,
    refetchTradingFee,
    
    // Write functions
    createMarket,
    buyShares,
    resolveMarket,
    claimWinnings,
    
    // Utility functions
    formatEtherValue,
    parseEtherValue,
  };
};

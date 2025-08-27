import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '../utils/contracts';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';

export const useMarketResolution = () => {
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<Error | null>(null);
  const [resolveSuccess, setResolveSuccess] = useState(false);

  const { writeContract, data: hash, error: writeError } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const resolveMarket = async (marketId: bigint, outcome: boolean) => {
    if (!marketId) {
      throw new Error('Market ID is required');
    }

    setResolving(true);
    setResolveError(null);
    setResolveSuccess(false);

    try {
      writeContract({
        address: CONTRACTS.PREDICTION_MARKET.address,
        abi: CONTRACTS.PREDICTION_MARKET.abi,
        functionName: 'resolveMarket',
        args: [marketId, outcome],
      });
    } catch (error) {
      setResolveError(error instanceof Error ? error : new Error('Failed to resolve market'));
      setResolving(false);
      throw error;
    }
  };

  // Handle transaction confirmation
  if (isConfirmed && !resolveSuccess) {
    setResolveSuccess(true);
    setResolving(false);
  }

  // Handle write errors
  if (writeError && !resolveError) {
    setResolveError(new Error(writeError.message));
    setResolving(false);
  }

  // Reset success state after a delay
  if (resolveSuccess) {
    setTimeout(() => {
      setResolveSuccess(false);
    }, 3000);
  }

  return {
    resolveMarket,
    resolving: resolving || isConfirming,
    resolveError,
    resolveSuccess,
    transactionHash: hash,
  };
};

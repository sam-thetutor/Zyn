import { useCallback, useState } from 'react';
import { usePredictionMarket } from './usePredictionMarket';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import type { WinnerInfo } from '../utils/contracts';

export const useMarketResolution = (marketId: bigint) => {
  const { 
    resolveMarket, 
    calculateWinners, 
    claimWinnings,
    getWinnerInfo,
    // isWinner,
    // calculateUserWinnings,
    // hasClaimed
  } = usePredictionMarket();
  
  const { address: userAddress } = useAccount();
  
  const [winnerInfo, setWinnerInfo] = useState<WinnerInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve market
  const handleResolveMarket = useCallback(async (outcome: boolean) => {
    if (!marketId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await resolveMarket(marketId, outcome);
      
      // After resolution, calculate winners
      await calculateWinners(marketId);
      
    } catch (err) {
      console.error('Error resolving market:', err);
      setError(err instanceof Error ? err.message : 'Failed to resolve market');
    } finally {
      setLoading(false);
    }
  }, [marketId, resolveMarket, calculateWinners]);

  // Calculate winners for a market
  const handleCalculateWinners = useCallback(async () => {
    if (!marketId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await calculateWinners(marketId);
      
    } catch (err) {
      console.error('Error calculating winners:', err);
      setError(err instanceof Error ? err.message : 'Failed to calculate winners');
    } finally {
      setLoading(false);
    }
  }, [marketId, calculateWinners]);

  // Claim winnings
  const handleClaimWinnings = useCallback(async () => {
    if (!marketId || !userAddress) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await claimWinnings(marketId);
      
      // Refresh winner info after claiming
      if (userAddress) {
        const newWinnerInfo = await getWinnerInfo(marketId, userAddress);
        setWinnerInfo(newWinnerInfo);
      }
      
    } catch (err) {
      console.error('Error claiming winnings:', err);
      setError(err instanceof Error ? err.message : 'Failed to claim winnings');
    } finally {
      setLoading(false);
    }
  }, [marketId, userAddress, claimWinnings, getWinnerInfo]);

  // Check if user is winner and get winnings info
  const checkUserWinnings = useCallback(async () => {
    if (!marketId || !userAddress) return;
    
    try {
      console.log('useMarketResolution: Starting checkUserWinnings for market:', marketId.toString());
      setLoading(true);
      setError(null);
      
      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: getWinnerInfo took too long')), 8000);
      });
      
      const info = await Promise.race([
        getWinnerInfo(marketId, userAddress),
        timeoutPromise
      ]);
      
      console.log('useMarketResolution: getWinnerInfo result:', info);
      if (info) {
        if (info && typeof info === 'object' && 'isWinner' in info && 'winnings' in info && 'hasClaimed' in info) {
          setWinnerInfo(info as WinnerInfo);
        }
      }
      
    } catch (err) {
      console.error('Error checking user winnings:', err);
      setError(err instanceof Error ? err.message : 'Failed to check user winnings');
    } finally {
      console.log('useMarketResolution: Setting loading to false');
      setLoading(false);
    }
  }, [marketId, userAddress, getWinnerInfo]);

  // Check if user can claim (is winner and hasn't claimed)
  const canClaim = winnerInfo?.isWinner && !winnerInfo?.hasClaimed;

  // Get formatted winnings amount
  const formattedWinnings = winnerInfo?.winnings ? `${formatEther(winnerInfo.winnings)} CELO` : '0 CELO';

  return {
    // State
    winnerInfo,
    loading,
    error,
    
    // Computed values
    canClaim,
    formattedWinnings,
    
    // Actions
    resolveMarket: handleResolveMarket,
    calculateWinners: handleCalculateWinners,
    claimWinnings: handleClaimWinnings,
    checkUserWinnings,
    
    // Utility functions
    isWinner: winnerInfo?.isWinner || false,
    hasClaimed: winnerInfo?.hasClaimed || false,
    winnings: winnerInfo?.winnings || 0,
  };
};

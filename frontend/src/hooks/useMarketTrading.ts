import { useCallback, useState } from 'react';
import { usePredictionMarket } from './usePredictionMarket';
import { useAccount } from 'wagmi';
import { parseEther } from 'viem';

export const useMarketTrading = (marketId: bigint) => {
  const { buyShares, getUserShares, getUserParticipation } = usePredictionMarket();
  const { address: userAddress } = useAccount();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userShares, setUserShares] = useState<{
    yesShares: bigint;
    noShares: bigint;
  }>({ yesShares: 0n, noShares: 0n });

  // Buy shares in a market
  const handleBuyShares = useCallback(async (outcome: boolean, amount: string) => {
    if (!marketId || !userAddress) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const value = parseEther(amount);
      await buyShares(marketId, outcome, value);
      
      // Refresh user shares after purchase
      await refreshUserShares();
      
    } catch (err) {
      console.error('Error buying shares:', err);
      setError(err instanceof Error ? err.message : 'Failed to buy shares');
    } finally {
      setLoading(false);
    }
  }, [marketId, userAddress, buyShares]);

  // Refresh user shares for the current market
  const refreshUserShares = useCallback(async () => {
    if (!marketId || !userAddress) return;
    
    try {
      const [yesShares, noShares] = await Promise.all([
        getUserShares(marketId, userAddress, true),
        getUserShares(marketId, userAddress, false)
      ]);
      
      setUserShares({ yesShares: yesShares || 0n, noShares: noShares || 0n });
    } catch (err) {
      console.error('Error refreshing user shares:', err);
    }
  }, [marketId, userAddress, getUserShares]);

  // Get user participation info
  const getUserParticipationInfo = useCallback(async () => {
    if (!marketId || !userAddress) return null;
    
    try {
      return await getUserParticipation(marketId, userAddress);
    } catch (err) {
      console.error('Error getting user participation:', err);
      return null;
    }
  }, [marketId, userAddress, getUserParticipation]);

  // Check if user has any shares in this market
  const hasShares = userShares.yesShares > 0n || userShares.noShares > 0n;

  // Get total user investment
  const totalInvestment = userShares.yesShares + userShares.noShares;

  return {
    // State
    loading,
    error,
    userShares,
    
    // Computed values
    hasShares,
    totalInvestment,
    
    // Actions
    buyShares: handleBuyShares,
    refreshUserShares,
    getUserParticipationInfo,
    
    // Utility functions
    clearError: () => setError(null),
  };
};

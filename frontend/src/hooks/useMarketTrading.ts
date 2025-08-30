import { useCallback, useState, useEffect } from 'react';
import { usePredictionMarket } from './usePredictionMarket';
import { useAccount } from 'wagmi';
import { usePublicClient } from 'wagmi';
import { parseEther } from 'viem';

export const useMarketTrading = (marketId: bigint) => {
  const { buyShares, getUserParticipation } = usePredictionMarket();
  const { address: userAddress } = useAccount();
  const publicClient = usePublicClient();
  
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

  // Refresh user shares for the current market by fetching from events
  const refreshUserShares = useCallback(async () => {
    if (!marketId || !userAddress || !publicClient) return;
    
    try {
      console.log('refreshUserShares: Fetching shares from events for market:', marketId.toString(), 'user:', userAddress);
      
      // Get all SharesBought events for this market and user
      const events = await publicClient.getLogs({
        address: '0xEF2B2cc9c95996213CC6525B55E2B8CF11fc5E38', // Contract address
        event: {
          type: 'event',
          name: 'SharesBought',
          inputs: [
            { type: 'uint256', name: 'marketId', indexed: true },
            { type: 'address', name: 'buyer', indexed: true },
            { type: 'bool', name: 'isYesShares', indexed: false },
            { type: 'uint256', name: 'amount', indexed: false }
          ]
        },
        args: {
          marketId: marketId,
          buyer: userAddress
        },
        fromBlock: 'earliest',
        toBlock: 'latest'
      });
      
      console.log('refreshUserShares: Found events:', events);
      
      // Calculate total shares from events
      let yesShares = 0n;
      let noShares = 0n;
      
      events.forEach((event) => {
        if (event.args && event.args.isYesShares !== undefined && event.args.amount) {
          if (event.args.isYesShares) {
            yesShares += BigInt(event.args.amount);
          } else {
            noShares += BigInt(event.args.amount);
          }
        }
      });
      
      console.log('refreshUserShares: Calculated shares:', { yesShares, noShares });
      
      setUserShares({ yesShares, noShares });
      
      console.log('refreshUserShares: Updated userShares state');
    } catch (err) {
      console.error('Error refreshing user shares from events:', err);
    }
  }, [marketId, userAddress, publicClient]);

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

  // Automatically fetch user shares when hook is initialized
  useEffect(() => {
    if (marketId && userAddress) {
      console.log('useMarketTrading: Auto-fetching user shares for market:', marketId.toString());
      refreshUserShares();
    }
  }, [marketId, userAddress, refreshUserShares]);

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

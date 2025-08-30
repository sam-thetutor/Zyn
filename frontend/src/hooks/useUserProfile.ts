import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { usePublicClient } from 'wagmi';
import { useContractAddress } from './useContractAddress';
import { useMarkets } from './useMarkets';
import { formatEther } from 'viem';

export interface UserActivity {
  id: string;
  type: 'market_created' | 'shares_bought' | 'market_resolved' | 'claim';
  timestamp: Date;
  marketId?: bigint;
  marketQuestion?: string;
  outcome?: boolean;
  amount?: bigint;
  transactionHash?: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface UserStats {
  marketsCreated: number;
  totalInvested: bigint;
  activePositions: number;
  marketsWon: number;
  totalActivities: number;
}

export const useUserProfile = () => {
  const { address: userAddress } = useAccount();
  const { coreContractAddress, coreContractABI } = useContractAddress();
  const publicClient = usePublicClient();
  const { allMarkets } = useMarkets();

  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user activities from smart contract events
  const fetchUserActivities = useCallback(async () => {
    if (!userAddress || !coreContractAddress || !publicClient) return;

    try {
      setLoading(true);
      setError(null);

      const activities: UserActivity[] = [];

      // Fetch SharesBought events for the user
      const sharesBoughtLogs = await publicClient.getLogs({
        address: coreContractAddress as `0x${string}`,
        event: {
          type: 'event',
          name: 'SharesBought',
          inputs: [
            { type: 'uint256', name: 'marketId', indexed: true },
            { type: 'address', name: 'buyer', indexed: true },
            { type: 'bool', name: 'outcome', indexed: false },
            { type: 'uint256', name: 'amount', indexed: false }
          ]
        },
        args: {
          buyer: userAddress
        },
        fromBlock: 0n,
        toBlock: 'latest'
      });

      // Process SharesBought events
      sharesBoughtLogs.forEach((log) => {
        const { marketId, outcome, amount } = log.args;
        if (!marketId || outcome === undefined || !amount) return;

        // Find market question from allMarkets
        const market = allMarkets.find(m => m.id === marketId);
        
        activities.push({
          id: `shares_${log.transactionHash}_${marketId}_${outcome}`,
          type: 'shares_bought',
          timestamp: new Date(Number(log.blockNumber) * 1000), // Approximate timestamp
          marketId,
          marketQuestion: market?.question || 'Unknown Market',
          outcome,
          amount,
          transactionHash: log.transactionHash,
          status: 'confirmed'
        });
      });

      // Fetch MarketCreated events for the user
      const marketCreatedLogs = await publicClient.getLogs({
        address: coreContractAddress as `0x${string}`,
        event: {
          type: 'event',
          name: 'MarketCreated',
          inputs: [
            { type: 'uint256', name: 'marketId', indexed: true },
            { type: 'address', name: 'creator', indexed: true },
            { type: 'string', name: 'question', indexed: false },
            { type: 'string', name: 'description', indexed: false },
            { type: 'string', name: 'category', indexed: false },
            { type: 'string', name: 'image', indexed: false },
            { type: 'address', name: 'source', indexed: false },
            { type: 'uint256', name: 'endTime', indexed: false }
          ]
        },
        args: {
          creator: userAddress
        },
        fromBlock: 0n,
        toBlock: 'latest'
      });

      // Process MarketCreated events
      marketCreatedLogs.forEach((log) => {
        const { marketId, question } = log.args;
        if (!marketId || !question) return;

        activities.push({
          id: `market_${log.transactionHash}_${marketId}`,
          type: 'market_created',
          timestamp: new Date(Number(log.blockNumber) * 1000), // Approximate timestamp
          marketId,
          marketQuestion: question as string,
          transactionHash: log.transactionHash,
          status: 'confirmed'
        });
      });

      // Sort activities by timestamp (newest first)
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setUserActivities(activities);

    } catch (err) {
      console.error('Error fetching user activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  }, [userAddress, coreContractAddress, publicClient, allMarkets]);

  // Calculate user statistics
  const stats = useMemo((): UserStats => {
    const marketsCreated = userActivities.filter(a => a.type === 'market_created').length;
    const totalInvested = userActivities
      .filter(a => a.type === 'shares_bought' && a.amount)
      .reduce((sum, a) => sum + (a.amount || 0n), 0n);
    const activePositions = userActivities.filter(a => a.type === 'shares_bought').length;
    const marketsWon = 0; // This would need additional logic to determine wins
    const totalActivities = userActivities.length;

    return {
      marketsCreated,
      totalInvested,
      activePositions,
      marketsWon,
      totalActivities
    };
  }, [userActivities]);

  // Fetch activities when dependencies change
  useEffect(() => {
    fetchUserActivities();
  }, [fetchUserActivities]);

  return {
    userActivities,
    loading,
    error,
    stats,
    refetchActivities: fetchUserActivities
  };
};

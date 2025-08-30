// User Activity Hook - Tracks user interactions with prediction markets
import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { useContractAddress } from './useContractAddress';

export interface UserActivity {
  id: string;
  type: 'market_created' | 'shares_bought' | 'market_resolved' | 'winnings_claimed';
  timestamp: number;
  marketId: bigint;
  question: string;
  category: string;
  details: {
    amount?: bigint;
    outcome?: boolean;
    winnings?: bigint;
    outcomeResult?: boolean;
  };
  transactionHash: string;
}

export const useUserActivity = () => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { coreContractAddress, coreContractABI, claimsContractAddress, claimsContractABI } = useContractAddress();
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user activity from contract events
  const fetchUserActivity = useCallback(async () => {
    if (!isConnected || !address || !publicClient) return;

    setLoading(true);
    setError(null);

    try {
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock - 10000n; // Last ~10000 blocks (roughly 1-2 days on Base)

      const allActivities: UserActivity[] = [];

      // 1. Fetch Market Created events
      try {
        const marketCreatedLogs = await publicClient.getLogs({
          address: coreContractAddress,
          event: {
            type: 'event',
            name: 'MarketCreated',
            inputs: [
              { type: 'uint256', name: 'marketId', indexed: true },
              { type: 'address', name: 'creator', indexed: true },
              { type: 'string', name: 'question', indexed: false },
              { type: 'string', name: 'category', indexed: false },
              { type: 'uint256', name: 'endTime', indexed: false }
            ]
          },
          args: { creator: address },
          fromBlock,
          toBlock: currentBlock,
        });

        for (const log of marketCreatedLogs) {
          const decodedLog = log as any;
          allActivities.push({
            id: `market_created_${decodedLog.args.marketId}_${decodedLog.transactionHash}`,
            type: 'market_created',
            timestamp: Number(decodedLog.blockNumber),
            marketId: decodedLog.args.marketId,
            question: decodedLog.args.question,
            category: decodedLog.args.category,
            details: {},
            transactionHash: decodedLog.transactionHash,
          });
        }
      } catch (err) {
        console.warn('Error fetching MarketCreated events:', err);
      }

      // 2. Fetch Shares Bought events
      try {
        const sharesBoughtLogs = await publicClient.getLogs({
          address: coreContractAddress,
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
          args: { buyer: address },
          fromBlock,
          toBlock: currentBlock,
        });

        for (const log of sharesBoughtLogs) {
          const decodedLog = log as any;
          allActivities.push({
            id: `shares_bought_${decodedLog.args.marketId}_${decodedLog.transactionHash}`,
            type: 'shares_bought',
            timestamp: Number(decodedLog.blockNumber),
            marketId: decodedLog.args.marketId,
            question: 'Market #' + decodedLog.args.marketId.toString(), // Will be updated with actual question
            category: 'Trading',
            details: {
              amount: decodedLog.args.amount,
              outcome: decodedLog.args.isYesShares,
            },
            transactionHash: decodedLog.transactionHash,
          });
        }
      } catch (err) {
        console.warn('Error fetching SharesBought events:', err);
      }

      // 3. Fetch Market Resolved events (for markets the user participated in)
      try {
        const marketResolvedLogs = await publicClient.getLogs({
          address: coreContractAddress,
          event: {
            type: 'event',
            name: 'MarketResolved',
            inputs: [
              { type: 'uint256', name: 'marketId', indexed: true },
              { type: 'address', name: 'resolver', indexed: true },
              { type: 'bool', name: 'outcome', indexed: false }
            ]
          },
          fromBlock,
          toBlock: currentBlock,
        });

        // Filter for markets where user participated
        for (const log of marketResolvedLogs) {
          const decodedLog = log as any;
          const marketId = decodedLog.args.marketId;
          
          // Check if user participated in this market
          const userParticipated = allActivities.some(activity => 
            activity.marketId === marketId && 
            (activity.type === 'shares_bought' || activity.type === 'market_created')
          );

          if (userParticipated) {
            allActivities.push({
              id: `market_resolved_${marketId}_${decodedLog.transactionHash}`,
              type: 'market_resolved',
              timestamp: Number(decodedLog.blockNumber),
              marketId,
              question: 'Market #' + marketId.toString(), // Will be updated with actual question
              category: 'Resolution',
              details: {
                outcomeResult: decodedLog.args.outcome,
              },
              transactionHash: decodedLog.transactionHash,
            });
          }
        }
      } catch (err) {
        console.warn('Error fetching MarketResolved events:', err);
      }

      // 4. Fetch Winnings Claimed events
      try {
        const winningsClaimedLogs = await publicClient.getLogs({
          address: claimsContractAddress,
          event: {
            type: 'event',
            name: 'WinningsClaimed',
            inputs: [
              { type: 'uint256', name: 'marketId', indexed: true },
              { type: 'address', name: 'user', indexed: true },
              { type: 'uint256', name: 'amount', indexed: false }
            ]
          },
          args: { user: address },
          fromBlock,
          toBlock: currentBlock,
        });

        for (const log of winningsClaimedLogs) {
          const decodedLog = log as any;
          allActivities.push({
            id: `winnings_claimed_${decodedLog.args.marketId}_${decodedLog.transactionHash}`,
            type: 'winnings_claimed',
            timestamp: Number(decodedLog.blockNumber),
            marketId: decodedLog.args.marketId,
            question: 'Market #' + decodedLog.args.marketId.toString(), // Will be updated with actual question
            category: 'Winnings',
            details: {
              winnings: decodedLog.args.amount,
            },
            transactionHash: decodedLog.transactionHash,
          });
        }
      } catch (err) {
        console.warn('Error fetching WinningsClaimed events:', err);
      }

      // Sort activities by timestamp (newest first)
      const sortedActivities = allActivities.sort((a, b) => b.timestamp - a.timestamp);

      // Update market questions and categories for activities that don't have them
      const updatedActivities = await Promise.all(
        sortedActivities.map(async (activity) => {
          if (activity.question.startsWith('Market #')) {
            try {
              const marketData = await publicClient.readContract({
                address: coreContractAddress,
                abi: coreContractABI,
                functionName: 'getMarket',
                args: [activity.marketId],
              });

              if (marketData) {
                const [id, question, category, image, endTime, status, outcome, totalYes, totalNo, totalPool] = marketData as any;
                return {
                  ...activity,
                  question: question || `Market #${activity.marketId}`,
                  category: category || 'Unknown',
                };
              }
            } catch (err) {
              console.warn(`Error fetching market ${activity.marketId}:`, err);
            }
          }
          return activity;
        })
      );

      setActivities(updatedActivities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user activity');
      console.error('Error fetching user activity:', err);
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, publicClient]);

  // Fetch activity when component mounts or dependencies change
  useEffect(() => {
    fetchUserActivity();
  }, [fetchUserActivity]);

  // Get activity statistics
  const getActivityStats = useCallback(() => {
    const totalMarkets = activities.filter(a => a.type === 'market_created').length;
    const totalTrades = activities.filter(a => a.type === 'shares_bought').length;
    const totalResolved = activities.filter(a => a.type === 'market_resolved').length;
    const totalWinnings = activities
      .filter(a => a.type === 'winnings_claimed')
      .reduce((sum, a) => sum + (a.details.winnings || 0n), 0n);

    return {
      totalMarkets,
      totalTrades,
      totalResolved,
      totalWinnings,
    };
  }, [activities]);

  // Get activities by type
  const getActivitiesByType = useCallback((type: UserActivity['type']) => {
    return activities.filter(activity => activity.type === type);
  }, [activities]);

  // Get recent activities (last 10)
  const getRecentActivities = useCallback(() => {
    return activities.slice(0, 10);
  }, [activities]);

  return {
    activities,
    loading,
    error,
    refetch: fetchUserActivity,
    stats: getActivityStats(),
    getActivitiesByType,
    getRecentActivities,
  };
};

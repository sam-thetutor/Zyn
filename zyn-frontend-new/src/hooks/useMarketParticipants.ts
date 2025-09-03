import { useState, useEffect, useCallback } from 'react';
import { usePredictionMarketCore } from './usePredictionMarketCore';
import { formatEther } from 'viem';

export interface MarketParticipant {
  address: string;
  totalYesShares: bigint;
  totalNoShares: bigint;
  totalInvestment: bigint;
  lastParticipation: boolean | null; // true for Yes, false for No, null if no participation
  transactions: {
    side: boolean;
    amount: bigint;
    timestamp: number;
    transactionHash: string;
  }[];
}

export interface UseMarketParticipantsReturn {
  participants: MarketParticipant[];
  loading: boolean;
  error: string | null;
  totalParticipants: number;
  refetch: (marketId?: bigint) => Promise<void>;
}

export const useMarketParticipants = (marketId: bigint | undefined): UseMarketParticipantsReturn => {
  const [participants, setParticipants] = useState<MarketParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { getMarketLogs } = usePredictionMarketCore();

  const fetchParticipants = useCallback(async (id?: bigint) => {
    const currentMarketId = id || marketId;
    if (!currentMarketId) {
      setParticipants([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get all logs for this market
      const logs = await getMarketLogs(currentMarketId);
      
      // Filter for SharesBought events
      const sharesBoughtLogs = logs.filter(log => log.eventName === 'SharesBought');
      
      // Group by buyer address and calculate totals
      const participantMap = new Map<string, MarketParticipant>();
      
      sharesBoughtLogs.forEach(log => {
        const buyer = log.args.buyer as string;
        const side = log.args.side as boolean; // true for Yes, false for No
        const amount = BigInt(log.args.amount || 0);
        const timestamp = log.timestamp || Date.now();
        const transactionHash = log.transactionHash;
        
        if (!participantMap.has(buyer)) {
          participantMap.set(buyer, {
            address: buyer,
            totalYesShares: 0n,
            totalNoShares: 0n,
            totalInvestment: 0n,
            lastParticipation: null,
            transactions: []
          });
        }
        
        const participant = participantMap.get(buyer)!;
        
        if (side) {
          participant.totalYesShares += amount;
        } else {
          participant.totalNoShares += amount;
        }
        
        participant.totalInvestment += amount;
        participant.lastParticipation = side;
        participant.transactions.push({
          side,
          amount,
          timestamp,
          transactionHash
        });
      });
      
      // Convert to array and sort by total investment (descending)
      const participantsArray = Array.from(participantMap.values())
        .sort((a, b) => Number(b.totalInvestment - a.totalInvestment));
      
      setParticipants(participantsArray);
    } catch (err) {
      console.error('Error fetching market participants:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch participants');
    } finally {
      setLoading(false);
    }
  }, [marketId, getMarketLogs]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const totalParticipants = participants.length;

  return {
    participants,
    loading,
    error,
    totalParticipants,
    refetch: (id?: bigint) => fetchParticipants(id)
  };
};

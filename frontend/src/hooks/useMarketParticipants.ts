import { useState, useEffect, useMemo } from 'react';
import { useContractAddress } from './useContractAddress';
import { usePublicClient } from 'wagmi';
import { formatEther } from 'viem';

export interface MarketParticipant {
  address: string;
  totalYesShares: bigint;
  totalNoShares: bigint;
  totalInvestment: bigint;
  lastParticipation: boolean; // true = Yes, false = No
  investmentPercentage: number; // % of total pool
}

export const useMarketParticipants = (marketId: bigint | undefined) => {
  const { coreContractAddress, coreContractABI } = useContractAddress();
  const publicClient = usePublicClient();
  
  const [participants, setParticipants] = useState<MarketParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch participants from events
  const fetchParticipants = async () => {
    if (!marketId || !coreContractAddress || !publicClient) return;

    try {
      setLoading(true);
      setError(null);

      // Get all SharesBought events for this market
      const logs = await publicClient.getLogs({
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
          marketId: marketId
        },
        fromBlock: 0n,
        toBlock: 'latest'
      });

      // Process events to aggregate participant data
      const participantMap = new Map<string, {
        address: string;
        totalYesShares: bigint;
        totalNoShares: bigint;
        totalInvestment: bigint;
        lastParticipation: boolean;
      }>();

      logs.forEach((log) => {
        const { buyer, outcome, amount } = log.args;
        if (!buyer || outcome === undefined || !amount) return;

        const address = buyer as string;
        const current = participantMap.get(address) || {
          address,
          totalYesShares: 0n,
          totalNoShares: 0n,
          totalInvestment: 0n,
          lastParticipation: outcome
        };

        if (outcome) {
          current.totalYesShares += amount;
        } else {
          current.totalNoShares += amount;
        }
        current.totalInvestment += amount;
        current.lastParticipation = outcome;

        participantMap.set(address, current);
      });

      // Convert to array and calculate percentages
      const participantsArray = Array.from(participantMap.values()).map(participant => ({
        ...participant,
        investmentPercentage: 0 // Will be calculated below
      }));

      // Calculate total pool for percentage calculation
      const totalPool = participantsArray.reduce((sum, p) => sum + p.totalInvestment, 0n);

      // Calculate investment percentages
      const participantsWithPercentages = participantsArray.map(participant => ({
        ...participant,
        investmentPercentage: totalPool > 0n 
          ? Number((participant.totalInvestment * 10000n) / totalPool) / 100 
          : 0
      }));

      // Sort by total investment (highest first)
      participantsWithPercentages.sort((a, b) => 
        a.totalInvestment > b.totalInvestment ? -1 : 1
      );

      setParticipants(participantsWithPercentages);

    } catch (err) {
      console.error('Error fetching market participants:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch participants');
    } finally {
      setLoading(false);
    }
  };

  // Fetch participants when marketId changes
  useEffect(() => {
    fetchParticipants();
  }, [marketId, coreContractAddress, publicClient]);

  // Memoized values for better performance
  const totalParticipants = useMemo(() => participants.length, [participants]);
  
  const totalPool = useMemo(() => 
    participants.reduce((sum, p) => sum + p.totalInvestment, 0n), 
    [participants]
  );

  const yesParticipants = useMemo(() => 
    participants.filter(p => p.lastParticipation), 
    [participants]
  );

  const noParticipants = useMemo(() => 
    participants.filter(p => !p.lastParticipation), 
    [participants]
  );

  return {
    // State
    participants,
    loading,
    error,
    
    // Computed values
    totalParticipants,
    totalPool,
    yesParticipants,
    noParticipants,
    
    // Actions
    refetch: fetchParticipants,
  };
};

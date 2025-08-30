import React, { useState, useEffect } from 'react';
import { useContractAddress } from '../../hooks/useContractAddress';
import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';

interface MarketParticipant {
  address: string;
  username: string;
  yesShares: bigint;
  noShares: bigint;
  totalInvestment: bigint;
  participationSide: boolean;
}

interface MarketParticipantsProps {
  marketId: number;
}

const MarketParticipants: React.FC<MarketParticipantsProps> = ({ marketId }) => {
  const { contractAddress, contractABI } = useContractAddress();
  const [participants, setParticipants] = useState<MarketParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Get market count to determine if we need to fetch participants manually
  const { data: marketCount } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getMarketCount',
    query: {
      enabled: !!contractAddress,
    },
  });

  // Since our simplified contract doesn't have getAllParticipants, we'll simulate it
  // by checking each address that might have participated
  useEffect(() => {
    const fetchParticipants = async () => {
      if (!contractAddress || !marketId) return;

      try {
        setLoading(true);
        setError('');

        // For now, we'll show a placeholder since our simplified contract
        // doesn't have the getAllParticipants function
        // In a real implementation, you would call the contract function
        setParticipants([
          {
            address: '0x21D654daaB0fe1be0e584980ca7C1a382850939f',
            username: 'admin_user',
            yesShares: BigInt(0),
            noShares: BigInt(0),
            totalInvestment: BigInt(0),
            participationSide: false,
          },
        ]);
      } catch (err) {
        setError('Failed to fetch market participants');
        console.error('Error fetching participants:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [contractAddress, marketId]);

  if (loading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Market Participants
        </h3>
        <div className="text-center py-8">
          <div className="text-secondary">Loading participants...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Market Participants
        </h3>
        <div className="text-center py-8">
          <div className="text-danger">❌ {error}</div>
        </div>
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Market Participants
        </h3>
        <div className="text-center py-8">
          <div className="text-secondary">No participants yet</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
        Market Participants ({participants.length})
      </h3>
      
      <div className="space-y-4">
        {participants.map((participant, index) => (
          <div
            key={participant.address}
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                     style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}>
                  {participant.username ? participant.username.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                  <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {participant.username || 'Anonymous'}
                  </div>
                  <div className="text-xs font-mono text-secondary">
                    {participant.address.slice(0, 6)}...{participant.address.slice(-4)}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-secondary">Participation</div>
                <div className={`font-medium ${
                  participant.participationSide ? 'text-green-500' : 'text-red-500'
                }`}>
                  {participant.participationSide ? 'YES' : 'NO'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-secondary mb-1">YES Shares</div>
                <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {formatEther(participant.yesShares)} CELO
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-secondary mb-1">NO Shares</div>
                <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {formatEther(participant.noShares)} CELO
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-secondary mb-1">Total Investment</div>
                <div className="font-medium" style={{ color: 'var(--color-accent)' }}>
                  {formatEther(participant.totalInvestment)} CELO
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Note about simplified contract */}
      <div className="mt-4 p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="text-secondary">
          ℹ️ Note: This is a simplified view. The full contract implementation would show all actual participants.
        </div>
      </div>
    </div>
  );
};

export default MarketParticipants;

import React, { useState, useEffect } from 'react';
import { formatEther } from 'viem';
import { usePredictionMarket } from '../hooks/usePredictionMarket';
import { usePredictionMarketCore } from '../hooks/usePredictionMarketCore';

interface CreatorFeeClaimProps {
  marketId: bigint;
  marketQuestion: string;
  className?: string;
}

const CELO_PRICE_USD = 0.311331;

export const CreatorFeeClaim: React.FC<CreatorFeeClaimProps> = ({
  marketId,
  className = ''
}) => {
  const [creatorFeeInfo, setCreatorFeeInfo] = useState<any>(null);
  const [marketStatus, setMarketStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getCreatorFeeInfo, claimCreatorFee } = usePredictionMarket();
  const { getMarket } = usePredictionMarketCore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch market data to get current status
        const market = await getMarket(marketId);
        setMarketStatus(Number(market.status));
        
        // Fetch creator fee info
        const feeInfo = await getCreatorFeeInfo(marketId);
        setCreatorFeeInfo(feeInfo);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load market information');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [marketId, getMarket, getCreatorFeeInfo]);

  const handleClaimCreatorFee = async () => {
    try {
      setClaiming(true);
      setError(null);
      await claimCreatorFee(marketId);
      // Refresh the fee info after claiming
      const updatedFeeInfo = await getCreatorFeeInfo(marketId);
      setCreatorFeeInfo(updatedFeeInfo);
    } catch (err) {
      console.error('Error claiming creator fee:', err);
      setError('Failed to claim creator fee');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Loading creator fee info...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="text-red-500 text-xl">⚠️</div>
          <div>
            <div className="text-sm font-medium text-red-800">Error</div>
            <div className="text-sm text-red-600">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!creatorFeeInfo) {
    return null;
  }

  const feeInfo = creatorFeeInfo as any;
  const creatorFee = feeInfo.fee as bigint;
  const creatorFeeClaimed = feeInfo.claimed as boolean;

  // Debug logging
  console.log('CreatorFeeClaim Debug:', {
    marketId: marketId.toString(),
    marketStatus,
    creatorFee: creatorFee.toString(),
    creatorFeeClaimed,
    feeInfo
  });

  // Only show if market is resolved and there's a creator fee to claim
  if (marketStatus === null || marketStatus !== 1 || creatorFee === 0n || creatorFeeClaimed) {
    console.log('CreatorFeeClaim: Not showing because:', {
      marketStatusNull: marketStatus === null,
      marketStatusNot1: marketStatus !== 1,
      creatorFeeIs0: creatorFee === 0n,
      alreadyClaimed: creatorFeeClaimed
    });
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="text-orange-600 text-xl">💰</div>
            <div>
              <h4 className="font-medium text-orange-900">Creator Fee Available</h4>
              <p className="text-sm text-orange-700">
                You can claim your 15% creator fee for this resolved market
              </p>
            </div>
          </div>
          
          <div className="text-sm text-orange-800">
            <div className="font-medium">
              Fee Amount: {formatEther(creatorFee)} CELO
            </div>
            <div className="text-orange-600">
              USD Value: ${(Number(formatEther(creatorFee)) * CELO_PRICE_USD).toFixed(2)}
            </div>
          </div>
        </div>
        
        <div className="ml-4">
          <button
            onClick={handleClaimCreatorFee}
            disabled={claiming || creatorFeeClaimed}
            className="px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {claiming ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Claiming...</span>
              </div>
            ) : creatorFeeClaimed ? (
              'Already Claimed'
            ) : (
              'Claim Fee'
            )}
          </button>
        </div>
      </div>
      
      {creatorFeeClaimed && (
        <div className="mt-3 p-2 bg-green-100 border border-green-200 rounded text-sm text-green-800">
          ✅ Creator fee has been successfully claimed
        </div>
      )}
    </div>
  );
};

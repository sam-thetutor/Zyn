import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { usePredictionMarket } from '../hooks/usePredictionMarket';
import { useMarketData } from '../hooks/useMarketData';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '../utils/constants';
import type { Market } from '../utils/contracts';

interface MarketDetailData extends Market {
  timeRemaining: number;
  isEnded: boolean;
  isActive: boolean;
  userYesShares: bigint;
  userNoShares: bigint;
  hasParticipated: boolean;
  participationSide: boolean | null;
}

const MarketDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isConnected, address } = useAccount();
  const { creationFee, tradingFee } = usePredictionMarket();
  const { getMarket, getUserShares } = useMarketData();

  const [market, setMarket] = useState<MarketDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tradeAmount, setTradeAmount] = useState<string>('');
  const [tradeType, setTradeType] = useState<'yes' | 'no' | null>(null);
  const [showTradeForm, setShowTradeForm] = useState(false);

  // Contract interaction hooks
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isPending, isSuccess, isError } = useWaitForTransactionReceipt({ hash });

  // Read user participation status
  const { data: hasParticipated } = useReadContract({
    address: CONTRACTS.PREDICTION_MARKET.address,
    abi: [
      {
        inputs: [
          { name: "marketId", type: "uint256" },
          { name: "user", type: "address" }
        ],
        name: "hasUserParticipated",
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "view",
        type: "function"
      }
    ],
    functionName: 'hasUserParticipated',
    args: [id ? BigInt(id) : 0n, address || '0x0000000000000000000000000000000000000000']
  });

  const { data: participationSide } = useReadContract({
    address: CONTRACTS.PREDICTION_MARKET.address,
    abi: [
      {
        inputs: [
          { name: "marketId", type: "uint256" },
          { name: "user", type: "address" }
        ],
        name: "getUserParticipationSide",
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "view",
        type: "function"
      }
    ],
    functionName: 'getUserParticipationSide',
    args: [id ? BigInt(id) : 0n, address || '0x0000000000000000000000000000000000000000']
  });

  // Fetch market data
  useEffect(() => {
    const fetchMarketData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const marketId = BigInt(id);
        
        // Get market details
        const marketData = await getMarket(marketId);
        if (!marketData) {
          setError('Market not found');
          return;
        }

        // Get user shares if connected
        let userYesShares = 0n;
        let userNoShares = 0n;
        
        if (isConnected && address) {
          try {
            userYesShares = await getUserShares(marketId, address, true);
            userNoShares = await getUserShares(marketId, address, false);
          } catch (err) {
            console.warn('Could not fetch user shares:', err);
          }
        }

        // Calculate additional market data
        const now = Math.floor(Date.now() / 1000);
        const timeRemaining = Math.max(0, Number(marketData.endTime) - now);
        const isEnded = timeRemaining <= 0;
        const isActive = marketData.status === 0 && !isEnded; // 0 = ACTIVE status

        setMarket({
          ...marketData,
          timeRemaining,
          isEnded,
          isActive,
          userYesShares,
          userNoShares,
          hasParticipated: hasParticipated || false,
          participationSide: hasParticipated ? (participationSide || null) : null,
        });
      } catch (err) {
        console.error('Error fetching market:', err);
        setError('Failed to load market data');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
  }, [id, isConnected, address, getMarket, getUserShares, hasParticipated, participationSide]);

  // Handle trade submission
  const handleTrade = async () => {
    if (!market || !tradeAmount || !tradeType || !isConnected) return;

    try {
      const amount = parseEther(tradeAmount);
      
      writeContract({
        address: CONTRACTS.PREDICTION_MARKET.address,
        abi: [
          {
            inputs: [
              { name: "marketId", type: "uint256" },
              { name: "outcome", type: "bool" }
            ],
            name: "buyShares",
            outputs: [],
            stateMutability: "payable",
            type: "function"
          }
        ],
        functionName: 'buyShares',
        args: [market.id, tradeType === 'yes'],
        value: amount
      });
      
      // Reset form
      setTradeAmount('');
      setTradeType(null);
      setShowTradeForm(false);
    } catch (err) {
      console.error('Trade failed:', err);
    }
  };

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'Ended';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${seconds}s`;
  };

  // Calculate percentages
  const totalShares = market ? market.totalYes + market.totalNo : 0n;
  const yesPercentage = totalShares > 0n ? (Number(market!.totalYes) / Number(totalShares)) * 100 : 50;
  const noPercentage = 100 - yesPercentage;
  const totalVolume = market ? market.totalYes + market.totalNo : 0n;

  // Check if user can trade
  const canTradeYes = !market?.hasParticipated || market?.participationSide === true;
  const canTradeNo = !market?.hasParticipated || market?.participationSide === false;

  const getStatusBadge = () => {
    if (market?.status === 1) { // 1 = RESOLVED status
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white" style={{ backgroundColor: 'var(--color-accent)' }}>
          Resolved
        </span>
      );
    } else if (market?.isEnded) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white" style={{ backgroundColor: '#f59e0b' }}>
          Ended
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
          Active
        </span>
      );
    }
  };

  const formatFee = (fee: bigint) => {
    return formatEther(fee);
  };

  return (
    <div className="container">
      {/* Header with proper spacing */}
      <div className="mt-8 mb-6">
        <Link to="/markets" className="inline-flex items-center text-secondary hover:text-primary mb-4 transition-colors">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Markets
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full w-8 h-8 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
          <p className="mt-2 text-secondary">Loading market details...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p style={{ color: 'var(--color-danger)' }}>Error loading market: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary mt-4"
          >
            Try Again
          </button>
        </div>
      ) : !market ? (
        <div className="text-center py-12">
          <p style={{ color: 'var(--color-danger)' }}>Market not found</p>
          <Link to="/markets" className="btn-primary mt-4">
            Back to Markets
          </Link>
        </div>
      ) : (
        <>
          {/* Market Header */}
          <div className="card mb-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Market Image */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-bg-accent)', border: '1px solid var(--color-border-accent)' }}>
                  {market.image ? (
                    <img 
                      src={market.image} 
                      alt={market.question}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold hidden" style={{ color: 'var(--color-primary)' }}>
                    {market.question.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Market Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                      {market.question}
                    </h1>
                    {market.category && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-3" style={{ backgroundColor: 'var(--color-bg-accent)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-accent)' }}>
                        {market.category}
                      </span>
                    )}
                  </div>
                  
                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    {getStatusBadge()}
                  </div>
                </div>

                {/* Market Description */}
                {market.description && (
                  <p className="text-secondary mb-4 leading-relaxed">
                    {market.description}
                  </p>
                )}

                {/* Time Remaining */}
                <div className="text-sm text-secondary">
                  {market.isEnded ? (
                    <span>Market has ended</span>
                  ) : (
                    <span>Ends in: {formatTimeRemaining(market.timeRemaining)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Market Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="card text-center">
              <div className="text-2xl font-bold mb-1" style={{ color: 'var(--color-accent)' }}>
                {yesPercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-secondary">Yes Shares</div>
            </div>
            
            <div className="card text-center">
              <div className="text-2xl font-bold mb-1" style={{ color: 'var(--color-danger)' }}>
                {noPercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-secondary">No Shares</div>
            </div>
            
            <div className="card text-center">
              <div className="text-2xl font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
                {formatEther(totalVolume)}
              </div>
              <div className="text-sm text-secondary">Total Volume (ETH)</div>
            </div>
          </div>

          {/* User Participation Status */}
          {isConnected && hasParticipated && (
            <div className="card mb-6" style={{ backgroundColor: 'var(--color-bg-accent)', borderColor: 'var(--color-border-accent)' }}>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" style={{ color: 'var(--color-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    You have already participated in this market
                  </h3>
                  <p className="text-sm text-secondary">
                    You {participationSide ? 'bought Yes shares' : 'bought No shares'}. 
                    You cannot change your position once you've participated.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Trading Section */}
          {isConnected && !market.isEnded && market.status === 0 && (
            <div className="card mb-6">
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Trade Shares
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Buy Yes */}
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-3" style={{ color: 'var(--color-accent)' }}>
                    Buy Yes Shares
                  </h3>
                  <p className="text-sm text-secondary mb-4">
                    Bet that the outcome will be "Yes"
                  </p>
                  <button
                    onClick={() => {
                      setTradeType('yes');
                      setShowTradeForm(true);
                    }}
                    disabled={!canTradeYes}
                    className="btn-primary w-full"
                    style={{ 
                      opacity: canTradeYes ? 1 : 0.5,
                      cursor: canTradeYes ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Buy Yes
                  </button>
                  {!canTradeYes && (
                    <p className="text-xs text-secondary mt-2">
                      {hasParticipated ? 'Already participated' : 'Connect wallet to trade'}
                    </p>
                  )}
                </div>

                {/* Buy No */}
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-3" style={{ color: 'var(--color-danger)' }}>
                    Buy No Shares
                  </h3>
                  <p className="text-sm text-secondary mb-4">
                    Bet that the outcome will be "No"
                  </p>
                  <button
                    onClick={() => {
                      setTradeType('no');
                      setShowTradeForm(true);
                    }}
                    disabled={!canTradeNo}
                    className="btn-primary w-full"
                    style={{ 
                      backgroundColor: 'var(--color-danger)',
                      opacity: canTradeNo ? 1 : 0.5,
                      cursor: canTradeNo ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Buy No
                  </button>
                  {!canTradeNo && (
                    <p className="text-xs text-secondary mt-2">
                      {hasParticipated ? 'Already participated' : 'Connect wallet to trade'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* User Shares */}
          {isConnected && (market?.userYesShares > 0n || market?.userNoShares > 0n) && (
            <div className="card mb-6">
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                Your Shares
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-accent)', border: '1px solid var(--color-border-accent)' }}>
                  <div className="text-2xl font-bold mb-1" style={{ color: 'var(--color-accent)' }}>
                    {formatEther(market?.userYesShares || 0n)}
                  </div>
                  <div className="text-sm text-secondary">Yes Shares</div>
                  <div className="text-xs text-secondary mt-1">
                    Value: ~${(Number(formatEther(market?.userYesShares || 0n)) * 2000).toFixed(2)}
                  </div>
                </div>
                
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-accent)', border: '1px solid var(--color-border-accent)' }}>
                  <div className="text-2xl font-bold mb-1" style={{ color: 'var(--color-danger)' }}>
                    {formatEther(market?.userNoShares || 0n)}
                  </div>
                  <div className="text-sm text-secondary">No Shares</div>
                  <div className="text-xs text-secondary mt-1">
                    Value: ~${(Number(formatEther(market?.userNoShares || 0n)) * 2000).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trade Form Modal */}
          {showTradeForm && tradeType && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="card max-w-md mx-4 w-full">
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  Buy {tradeType === 'yes' ? 'Yes' : 'No'} Shares
                </h3>
                
                <div className="mb-4">
                  <label htmlFor="amount" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    Amount (ETH)
                  </label>
                  <input
                    type="number"
                    id="amount"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(e.target.value)}
                    placeholder="0.01"
                    step="0.001"
                    min="0.001"
                    className="input-field w-full"
                  />
                </div>

                <div className="mb-6 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-accent)', border: '1px solid var(--color-border-accent)' }}>
                  <div className="text-sm text-secondary mb-1">Trading Fee:</div>
                  <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {tradingFee ? formatFee(tradingFee) : 'Loading...'} ETH
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowTradeForm(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTrade}
                    disabled={!tradeAmount || isPending}
                    className="btn-primary flex-1"
                    style={{ 
                      opacity: (!tradeAmount || isPending) ? 0.6 : 1,
                      cursor: (!tradeAmount || isPending) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isPending ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      `Buy ${tradeType === 'yes' ? 'Yes' : 'No'}`
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {isSuccess && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="card max-w-md mx-4 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Trade Successful!</h2>
                <p className="text-secondary mb-6">
                  Your shares have been purchased successfully.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary w-full"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MarketDetail;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { usePredictionMarket } from '../hooks/usePredictionMarket';
import { useContractAddress } from '../hooks/useContractAddress';
import { formatEther, parseEther } from 'viem';
import type { Market, WinnerInfo } from '../utils/contracts';
import MarketParticipants from '../components/market/MarketParticipants';

interface MarketDetailData extends Market {
  timeRemaining: number;
  isEnded: boolean;
  isActive: boolean;
  userYesShares: number;
  userNoShares: number;
  hasParticipated: boolean;
  participationSide: boolean | null;
}

const MarketDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isConnected, address, chainId } = useAccount();
  const { marketCreationFee } = usePredictionMarket();
  const { getMarket, getUserShares } = usePredictionMarket();
  const { contractAddress, contractABI, isSupportedNetwork } = useContractAddress();

  const [market, setMarket] = useState<MarketDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tradeAmount, setTradeAmount] = useState<string>('');
  const [tradeType, setTradeType] = useState<'yes' | 'no' | null>(null);
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Contract interaction hooks
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isPending, isSuccess, isError } = useWaitForTransactionReceipt({ hash });

  // Read user participation status
  const { data: hasParticipated } = useReadContract({
    address: contractAddress || '0x0000000000000000000000000000000000000000',
    abi: contractABI || [],
    functionName: 'hasUserParticipated',
    args: [id ? BigInt(id) : 0n, address || '0x0000000000000000000000000000000000000000']
  });

  const { data: participationSide } = useReadContract({
    address: contractAddress || '0x0000000000000000000000000000000000000000',
    abi: contractABI || [],
    functionName: 'getUserParticipationSide',
    args: [id ? BigInt(id) : 0n, address || '0x0000000000000000000000000000000000000000']
  });

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        let userYesShares = 0;
        let userNoShares = 0;
        
        if (isConnected && address) {
          try {
            const yesShares = await getUserShares(marketId, address, true);
            const noShares = await getUserShares(marketId, address, false);
            userYesShares = Number(yesShares);
            userNoShares = Number(noShares);
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
          hasParticipated: Boolean(hasParticipated),
          participationSide: hasParticipated ? (Boolean(participationSide) || null) : null,
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
      
      if (!contractAddress || !contractABI) {
        throw new Error('Contract not found on current network');
      }

      writeContract({
        address: contractAddress,
        abi: contractABI,
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

  // Calculate percentages and values
  const totalShares = market ? market.totalYes + market.totalNo : 0n;
  const yesPercentage = totalShares > 0n ? (Number(market!.totalYes) / Number(totalShares)) * 100 : 50;
  const noPercentage = 100 - yesPercentage;
  const totalVolume = market ? market.totalYes + market.totalNo : 0n;

  // Calculate potential payouts
  const calculatePotentialPayout = (shares: number, side: boolean) => {
    if (shares === 0) return '0.00';
    if (totalShares === 0n) return '0.00';
    
    const totalPayout = Number(totalVolume);
    const userShare = shares / Number(totalShares);
    return userShare.toFixed(2);
  };

  // Quick amount buttons
  const quickAmounts = [0.1, 0.5, 1.0, 5.0, 10.0];
  const quickPercentages = [25, 50];

  // Check if user can trade
  const canTradeYes = !market?.hasParticipated || market?.participationSide === true;
  const canTradeNo = !market?.hasParticipated || market?.participationSide === false;

  const getStatusBadge = () => {
    if (market?.status === 1) { // 1 = RESOLVED status
      return (
        <span className="status-badge status-resolved">
          Resolved
        </span>
      );
    } else if (market?.isEnded) {
      return (
        <span className="status-badge status-ended">
          Ended
        </span>
      );
    } else {
      return (
        <span className="status-badge status-active">
          Active
        </span>
      );
    }
  };

  const formatFee = (fee: bigint) => {
    return formatEther(fee);
  };

  // Check if connected to supported network
  if (isConnected && !isSupportedNetwork) {
    return (
      <div className="market-detail-container">
        <div className="network-warning">
          <h1>Market Details</h1>
          <div className="warning-card">
            <h2>⚠️ Wrong Network</h2>
            <div className="warning-details">
              <div className="warning-row">
                <span>Current Network:</span>
                <span>{chainId === 1 ? 'Ethereum Mainnet' : `Chain ID: ${chainId}`}</span>
              </div>
              <div className="warning-row">
                <span>Required Networks:</span>
                <span>Celo Alfajores Testnet or Base Mainnet</span>
              </div>
            </div>
            <p>Your wallet is connected to an unsupported network. Please switch to Celo Alfajores testnet or Base mainnet to view market details.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="market-detail-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading market details...</p>
        </div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="market-detail-container">
        <div className="error-state">
          <h1>Market Details</h1>
          <div className="error-card">
            <h2>❌ Error Loading Market</h2>
            <p>{error || 'Market not found'}</p>
            <button onClick={() => navigate('/markets')} className="btn-primary">
              Back to Markets
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="market-detail-container">
      {/* Hero Section */}
      <div className="market-hero">
        <div className="hero-navigation">
          <button onClick={() => navigate('/markets')} className="nav-button">
            🏠 Back to Markets
          </button>
          {/* <span className="market-id">📊 Market #{id}</span> */}
          <button className="nav-button">
            🔗 Share Market
          </button>
        </div>
        
        <div className="hero-content">
          <h1 className="market-question">{market.question}</h1>
          
          <div className="hero-meta">
            {getStatusBadge()}
            {/* <span className="time-remaining">
              {market.isEnded ? 'Market has ended' : `Ends in: ${formatTimeRemaining(market.timeRemaining)}`}
            </span> */}
            {market.category && (
              <>
                <span className="market-category" style={{textTransform: 'uppercase'}}>{market.category}</span>
              </>
            )}
          </div>
          
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-percentage yes">{yesPercentage.toFixed(1)}%</span>
              <span className="stat-label">Yes</span>
            </div>
            <div className="stat-item">
              <span className="stat-percentage no">{noPercentage.toFixed(1)}%</span>
              <span className="stat-label">No</span>
            </div>
            <div className="stat-item">
              <span className="stat-volume">{formatEther(totalVolume)}</span>
              <span className="stat-label">Total Volume (CELO)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="market-content-grid">
        {/* Left Panel - Market Information */}
        <div className="left-panel">
          <div className="info-card">
            <h2>📋 Market Details</h2>
            
            {market.image && (
              <div className="market-image">
                <img src={market.image} alt={market.question} />
              </div>
            )}
            
            {market.description && (
              <div className="info-section">
                <h3>📝 Description</h3>
                <p>{market.description}</p>
              </div>
            )}
            
            {market.source && (
              <div className="info-section">
                <h3>🔗 Source</h3>
                <p>{market.source}</p>
              </div>
            )}
            
            <div className="info-section">
              <h3>📊 Market Statistics</h3>
              <div className="stats-list">
                <div className="stat-row">
                  <span>Creation Fee:</span>
                  <span>{marketCreationFee ? marketCreationFee : 'Loading...'} CELO</span>
                </div>
                <div className="stat-row">
                  <span>Trading Fee:</span>
                  <span>0.05 CELO</span>
                </div>
                <div className="stat-row">
                  <span>Created:</span>
                  <span>{new Date(Number(market.createdAt) * 1000).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div className="info-section">
              <h3>📋 Rules & Resolution</h3>
              <p>Market will be resolved based on verifiable public sources. The outcome will be determined by the market creator or designated oracle.</p>
            </div>
          </div>
        </div>

        {/* Center Panel - Trading Interface */}
        <div className="center-panel">
          <div className="trading-card">
            <h2>💰 Trade Shares</h2>
            
            {isConnected && market.hasParticipated && (
              <div className="participation-notice">
                <div className="notice-icon">⚠️</div>
                <div className="notice-content">
                  <h3>Already Participated</h3>
                  <p>You {market.participationSide ? 'bought Yes shares' : 'bought No shares'}.</p>
                </div>
              </div>
            )}
            
            {isConnected && !market.isEnded && market.status === 0 && (
              <>
                <div className="position-selector">
                  <h3>🎯 Select Position</h3>
                  <div className="position-buttons">
                    <button
                      onClick={() => setTradeType('yes')}
                      className={`position-btn yes ${tradeType === 'yes' ? 'selected' : ''} ${!canTradeYes ? 'disabled' : ''}`}
                      disabled={!canTradeYes}
                    >
                      <div className="position-label">YES</div>
                      <div className="position-percentage">{yesPercentage.toFixed(1)}%</div>
                      <div className="position-indicator">🟢</div>
                    </button>
                    <button
                      onClick={() => setTradeType('no')}
                      className={`position-btn no ${tradeType === 'no' ? 'selected' : ''} ${!canTradeNo ? 'disabled' : ''}`}
                      disabled={!canTradeNo}
                    >
                      <div className="position-label">NO</div>
                      <div className="position-percentage">{noPercentage.toFixed(1)}%</div>
                      <div className="position-indicator">🔴</div>
                    </button>
                  </div>
                </div>

                <div className="amount-input">
                  <h3>💵 Amount to Trade</h3>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value)}
                      placeholder="0.00"
                      min="0.001"
                      step="0.001"
                      className="amount-field"
                    />
                    <span className="currency">CELO</span>
                  </div>
                </div>

                <div className="quick-amounts">
                  <h3>📊 Quick Amounts</h3>
                  <div className="amount-buttons">
                    {quickAmounts.map(amount => (
                      <button
                        key={amount}
                        onClick={() => setTradeAmount(amount.toString())}
                        className="quick-amount-btn"
                      >
                        {amount}
                      </button>
                    ))}
                    {quickPercentages.map(percent => (
                      <button
                        key={percent}
                        onClick={() => setTradeAmount(`${percent}%`)}
                        className="quick-amount-btn percentage"
                      >
                        {percent}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="fee-breakdown">
                  <h3>💸 Fee Breakdown</h3>
                  <div className="fee-row">
                    <span>Trading Fee:</span>
                    <span>0.05 CELO</span>
                  </div>
                  <div className="fee-row total">
                    <span>Total Cost:</span>
                    <span>{tradeAmount ? (parseFloat(tradeAmount) + 0.05).toFixed(3) : '0.000'} CELO</span>
                  </div>
                </div>

                <button
                  onClick={handleTrade}
                  disabled={!tradeType || !tradeAmount || isPending}
                  className="trade-button"
                >
                  {isPending ? (
                    <>
                      <div className="loading-spinner small"></div>
                      Processing...
                    </>
                  ) : (
                    `🚀 Place ${tradeType === 'yes' ? 'Yes' : 'No'} Trade`
                  )}
                </button>
              </>
            )}

            {!isConnected && (
              <div className="connect-notice">
                <h3>🔗 Connect Wallet</h3>
                <p>Connect your wallet to start trading shares in this market.</p>
                <button onClick={() => navigate('/')} className="btn-primary">
                  Connect Wallet
                </button>
              </div>
            )}

            {market.isEnded && (
              <div className="ended-notice">
                <h3>⏰ Market Ended</h3>
                <p>This market has ended and is no longer accepting new trades.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - User Actions & Info */}
        <div className="right-panel">
          <div className="user-position-card">
            <h2>👤 Your Position</h2>
            
            <div className="position-details">
              <div className="position-row">
                <span>Yes Shares:</span>
                <span className="shares-count">{formatEther(BigInt(market.userYesShares))}</span>
              </div>
              <div className="position-row">
                <span>No Shares:</span>
                <span className="shares-count">{formatEther(BigInt(market.userNoShares))}</span>
              </div>
            </div>

            <div className="payout-details">
              <h3>💰 Potential Payout</h3>
              <div className="payout-row">
                <span>If Yes wins:</span>
                <span className="payout-amount">{(calculatePotentialPayout(market.userYesShares, true))} CELO</span>
              </div>
              <div className="payout-row">
                <span>If No wins:</span>
                <span className="payout-amount">{calculatePotentialPayout(market.userNoShares, false)} CELO</span>
              </div>
            </div>

            <div className="participation-status">
              <h3>📈 Your Participation</h3>
              <div className="status-row">
                <span>Status:</span>
                <span className={`status ${market.hasParticipated ? 'participated' : 'not-participated'}`}>
                  {market.hasParticipated ? 'Participated' : 'Not Participated'}
                </span>
              </div>
              <div className="status-row">
                <span>Side:</span>
                <span className="side">
                  {market.participationSide === null ? 'None' : 
                   market.participationSide ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          <div className="quick-actions-card">
            <h2>🎲 Quick Actions</h2>
            <div className="action-buttons">
              <button className="action-btn">
                📊 View Order Book
              </button>
              <button className="action-btn">
                👥 See Participants
              </button>
              <button className="action-btn">
                📱 Share Market
              </button>
              <button className="action-btn">
                🔔 Set Alerts
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Market Activity */}
      <div className="market-activity">
        <div className="activity-card">
          <h2>📊 Market Activity</h2>
          
          <div className="activity-grid">
            <div className="recent-trades">
              <h3>🕒 Recent Trades</h3>
              <div className="trades-list">
                <div className="trade-item">
                  <span className="trade-user">0x1234...abcd</span>
                  <span className="trade-action">bought</span>
                  <span className="trade-amount">5.0 YES shares</span>
                </div>
                <div className="trade-item">
                  <span className="trade-user">0x5678...efgh</span>
                  <span className="trade-action">bought</span>
                  <span className="trade-amount">2.5 NO shares</span>
                </div>
                <div className="trade-item">
                  <span className="trade-user">0x9abc...ijkl</span>
                  <span className="trade-action">bought</span>
                  <span className="trade-amount">1.0 YES shares</span>
                </div>
              </div>
            </div>

            <div className="top-participants">
              <h3>👥 Top Participants</h3>
              <div className="participants-list">
                <div className="participant-item">
                  <span className="participant-address">0x1234...abcd</span>
                  <span className="participant-shares">150.0 YES shares</span>
                </div>
                <div className="participant-item">
                  <span className="participant-address">0x5678...efgh</span>
                  <span className="participant-shares">75.0 NO shares</span>
                </div>
                <div className="participant-item">
                  <span className="participant-address">0x9abc...ijkl</span>
                  <span className="participant-shares">50.0 YES shares</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message Modal */}
      {isSuccess && (
        <div className="modal-overlay">
          <div className="success-modal">
            <div className="success-icon">🎉</div>
            <h2>Trade Successful!</h2>
            <p>Your shares have been purchased successfully.</p>
            <button onClick={() => window.location.reload()} className="btn-primary">
              Refresh Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketDetail;

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useMarkets } from '../hooks/useMarkets';
import { useEventsStore } from '../stores/eventsStore';
import { usePredictionMarket } from '../hooks/usePredictionMarket';
import { useNotificationHelpers } from '../hooks/useNotificationHelpers';
import { useMiniApp } from '../hooks/useMiniApp';
import { useReferral } from '../contexts/ReferralContext';
import NotificationContainer from '../components/NotificationContainer';
import { MarketEmbedMeta } from '../components/MarketEmbedMeta';
import { WinningsBreakdownComponent } from '../components/WinningsBreakdown';
import { formatEther, parseEther } from 'viem';

// Current CELO price in USD (update this as needed)
const CELO_PRICE_USD = 0.311331;

const MarketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isConnected, address } = useAccount();
  const { isMiniApp, composeCast, triggerHaptic, triggerNotificationHaptic } = useMiniApp();
  const { referralCode, submitReferral } = useReferral();
  const { allMarkets, loading, error: marketsError } = useMarkets();
  
  // Get market participants from events store
  const { logs: allLogs, loading: logsLoading, fetchAllLogs } = useEventsStore();
  
  // Calculate participants from logs for this specific market
  const marketParticipants = useMemo(() => {
    if (!id || !allLogs) return [];
    
    const marketLogs = allLogs.filter(log => {
      return log.args.marketId?.toString() === id && log.eventName === 'SharesBought';
    });
    
    // Group by buyer address and calculate totals
    const participantMap = new Map();
    
    marketLogs.forEach(log => {
      const buyer = log.args.buyer;
      const side = log.args.side; // true for Yes, false for No
      const amount = BigInt(log.args.amount || 0);
      
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
      
      const participant = participantMap.get(buyer);
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
        timestamp: log.timestamp,
        transactionHash: log.transactionHash
      });
    });
    
    // Convert to array and sort by total investment (descending)
    return Array.from(participantMap.values())
      .sort((a, b) => Number(b.totalInvestment - a.totalInvestment));
  }, [id, allLogs]);
  
  const totalParticipants = marketParticipants.length;
  
  const { 
    buyShares, 
    claimWinnings, 
    isSuccess: isBuySuccess, 
    hash: buyHash,
    // Claims transaction states
    isPending: isClaimPending,
    isSuccess: isClaimSuccess,
    isError: isClaimError,
    hash: claimHash,
    isConfirming: isClaimConfirming
  } = usePredictionMarket();
  const { notifySharesPurchaseFailed, notifySharesPurchaseStarted, notifyTransactionSuccess } = useNotificationHelpers();
  
  // Simple claim state
  const [canClaimWinnings, setCanClaimWinnings] = useState(false);
  const [hasClaimedWinnings, setHasClaimedWinnings] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  
  const [market, setMarket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyOutcome, setBuyOutcome] = useState<boolean | null>(null);
  const [buyAmount, setBuyAmount] = useState('');
  const [isBuying, setIsBuying] = useState(false);

  useEffect(() => {
    if (id && allMarkets.length > 0) {
      const foundMarket = allMarkets.find(m => m.id.toString() === id);
      if (foundMarket) {
        setMarket(foundMarket);
      }
      setIsLoading(false);
    }
  }, [id, allMarkets]);

  // Track share purchase success and submit referral
  useEffect(() => {
    if (isBuySuccess && buyHash && referralCode) {
      // Submit referral for share trading
      submitReferral({
        type: 'share_trading',
        marketId: id,
        outcome: buyOutcome || false,
        amount: buyAmount,
      }, buyHash);
    }
  }, [isBuySuccess, buyHash, referralCode, submitReferral, id, buyOutcome, buyAmount]);

  // Debug logging for claim states
  useEffect(() => {
    console.log('=== CLAIM STATE UPDATE ===');
    console.log('canClaimWinnings:', canClaimWinnings);
    console.log('hasClaimedWinnings:', hasClaimedWinnings);
    console.log('isClaiming:', isClaiming);
    console.log('isClaimPending:', isClaimPending);
    console.log('isClaimConfirming:', isClaimConfirming);
    console.log('Market ID:', id);
    console.log('User Address:', address);
    console.log('Market Status:', market?.status);
    console.log('Market Outcome:', market?.outcome);
    console.log('=== END CLAIM STATE UPDATE ===');
  }, [canClaimWinnings, hasClaimedWinnings, isClaiming, isClaimPending, isClaimConfirming, id, address, market]);

  // Check if user can claim winnings when market is resolved
  useEffect(() => {
    const checkClaimEligibility = () => {
      console.log('=== CLAIM ELIGIBILITY CHECK START ===');
      console.log('Market:', market);
      console.log('Address:', address);
      console.log('Market ID:', id);
      console.log('All Logs Length:', allLogs?.length || 0);
      
      // Reset states first
      setCanClaimWinnings(false);
      setHasClaimedWinnings(false);
      
      if (!market || market.status !== 1 || !address || !id) {
        console.log('Early return: Missing required data');
        return;
      }
      
      if (!allLogs || allLogs.length === 0) {
        console.log('Early return: No logs available');
        return;
      }
      
      try {
        console.log('Checking claim eligibility for market:', id, 'user:', address);
        
        // Get user's SharesBought events for this market from logs
        const userSharesLogs = allLogs.filter(log => {
          const isCorrectMarket = log.args.marketId?.toString() === id;
          const isSharesBought = log.eventName === 'SharesBought';
          const isCorrectBuyer = log.args.buyer === address;
          
          console.log('Log check:', {
            logId: log.transactionHash,
            marketId: log.args.marketId?.toString(),
            expectedMarketId: id,
            eventName: log.eventName,
            buyer: log.args.buyer,
            expectedBuyer: address,
            isCorrectMarket,
            isSharesBought,
            isCorrectBuyer
          });
          
          return isCorrectMarket && isSharesBought && isCorrectBuyer;
        });
        
        console.log('Found user SharesBought events from logs:', userSharesLogs);
        
        // Check if user has winning shares
        let hasWinningShares = false;
        let totalWinningAmount = 0n;
        
        userSharesLogs.forEach(log => {
          const side = log.args.side; // true for Yes, false for No
          const marketOutcome = market.outcome;
          
          console.log('Share analysis:', {
            side,
            amount: BigInt(log.args.amount || 0).toString(),
            marketOutcome,
            isWinning: (side && marketOutcome) || (!side && !marketOutcome)
          });
          
          // User wins if they bought YES shares and market resolved YES, or NO shares and market resolved NO
          if ((side && marketOutcome) || (!side && !marketOutcome)) {
            hasWinningShares = true;
            totalWinningAmount += BigInt(log.args.amount || 0);
          }
        });
        
        // Check if user has already claimed winnings from logs - more comprehensive check
        const userClaimLogs = allLogs.filter(log => {
          const isCorrectMarket = log.args.marketId?.toString() === id;
          const isWinningsClaimed = log.eventName === 'WinningsClaimed';
          const isCorrectClaimant = log.args.claimant === address;
          
          console.log('Claim log check:', {
            logId: log.transactionHash,
            marketId: log.args.marketId?.toString(),
            expectedMarketId: id,
            eventName: log.eventName,
            claimant: log.args.claimant,
            expectedClaimant: address,
            isCorrectMarket,
            isWinningsClaimed,
            isCorrectClaimant
          });
          
          return isCorrectMarket && isWinningsClaimed && isCorrectClaimant;
        });
        
        // Also check for any WinningsClaimed events for this market and user from both networks
        const allUserClaims = allLogs.filter(log => {
          return log.eventName === 'WinningsClaimed' && 
                 log.args.claimant === address &&
                 log.args.marketId?.toString() === id;
        });
        
        // DEBUG: Log ALL WinningsClaimed events to see what's happening
        const allWinningsClaimedEvents = allLogs.filter(log => log.eventName === 'WinningsClaimed');
        console.log('ALL WinningsClaimed events in logs:', allWinningsClaimedEvents.map(log => ({
          marketId: log.args.marketId?.toString(),
          claimant: log.args.claimant,
          amount: log.args.amount,
          transactionHash: log.transactionHash,
          network: log.network
        })));
        
        console.log('Found user WinningsClaimed events from logs:', userClaimLogs);
        console.log('Found all user claims for this market:', allUserClaims);
        
        const hasClaimed = userClaimLogs.length > 0 || allUserClaims.length > 0;
        
        // Additional debugging
        console.log('Claim eligibility check result:', {
          marketId: id,
          userAddress: address,
          hasWinningShares,
          totalWinningAmount: totalWinningAmount.toString(),
          hasClaimed,
          userClaimLogsCount: userClaimLogs.length,
          allUserClaimsCount: allUserClaims.length,
          canClaim: hasWinningShares && !hasClaimed
        });
        
        setCanClaimWinnings(hasWinningShares && !hasClaimed);
        setHasClaimedWinnings(hasClaimed);
        
        console.log('=== CLAIM ELIGIBILITY CHECK END ===');
        
      } catch (error) {
        console.error('Error checking claim eligibility:', error);
        setCanClaimWinnings(false);
        setHasClaimedWinnings(false);
      }
    };
    
    checkClaimEligibility();
  }, [market, address, id, allLogs]);

  // Handle buy shares success
  useEffect(() => {
    if (isBuySuccess && buyHash) {
      notifyTransactionSuccess('Shares purchased successfully!', buyHash);
      setShowBuyModal(false);
      setBuyAmount('');
      setBuyOutcome(null);
      
      // Refresh logs to include the new transaction (with delay to ensure transaction is processed)
      setTimeout(() => {
        fetchAllLogs();
      }, 5000);
      
      // Trigger haptic feedback for Mini App users
      if (isMiniApp) {
        triggerHaptic('medium');
      }
      
      // Refresh market data
      window.location.reload();
    }
  }, [isBuySuccess, buyHash, notifyTransactionSuccess, isMiniApp, triggerHaptic, fetchAllLogs]);

  // Handle claim winnings success
  useEffect(() => {
    if (isClaimSuccess && claimHash) {
      notifyTransactionSuccess('Winnings claimed successfully!', claimHash);
      setIsClaiming(false);
      // Update UI to show claimed state immediately
      setCanClaimWinnings(false);
      setHasClaimedWinnings(true);
      
      // Refresh logs to include the new claim transaction (with delay to ensure transaction is processed)
      setTimeout(() => {
        fetchAllLogs();
        // Re-check claim eligibility after logs are refreshed
        setTimeout(() => {
          const checkClaimEligibility = () => {
            if (!market || market.status !== 1 || !address || !id || !allLogs) return;
            
            try {
              // Get user's SharesBought events for this market from logs
              const userSharesLogs = allLogs.filter(log => {
                return log.args.marketId?.toString() === id && 
                       log.eventName === 'SharesBought' && 
                       log.args.buyer === address;
              });
              
              // Check if user has winning shares
              let hasWinningShares = false;
              userSharesLogs.forEach(log => {
                const side = log.args.side;
                const marketOutcome = market.outcome;
                
                if ((side && marketOutcome) || (!side && !marketOutcome)) {
                  hasWinningShares = true;
                }
              });
              
              // Check if user has already claimed winnings from logs
              const userClaimLogs = allLogs.filter(log => {
                return log.args.marketId?.toString() === id && 
                       log.eventName === 'WinningsClaimed' && 
                       log.args.claimant === address;
              });
              
              const hasClaimed = userClaimLogs.length > 0;
              
              setCanClaimWinnings(hasWinningShares && !hasClaimed);
              setHasClaimedWinnings(hasClaimed);
              
            } catch (error) {
              console.error('Error re-checking claim eligibility:', error);
            }
          };
          
          checkClaimEligibility();
        }, 1000);
      }, 5000);
      
      // Submit referral if user was referred
      if (referralCode) {
        submitReferral({
          type: 'winning_claim',
          marketId: id,
          outcome: market.outcome,
        }, claimHash);
      }
      
      // Trigger haptic feedback and compose cast for Mini App users
      if (isMiniApp && market) {
        triggerNotificationHaptic('success');
        composeCast(
          `Just won on @zynprotocol! 🎉 Market: "${market.question}"`,
          [`https://zynp.vercel.app/market/${id}`]
        );
      }
    }
  }, [isClaimSuccess, claimHash, notifyTransactionSuccess, isMiniApp, market, id, composeCast, triggerNotificationHaptic, referralCode, submitReferral, fetchAllLogs, allLogs, address]);

  // Handle claim winnings error
  useEffect(() => {
    if (isClaimError) {
      notifySharesPurchaseFailed('Failed to claim winnings. Please try again.');
      setIsClaiming(false);
    }
  }, [isClaimError, notifySharesPurchaseFailed]);

  // Loading state
  if (loading || isLoading) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading market details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (marketsError || !market) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Market Not Found</h2>
          <p className="text-lg text-gray-600 mb-6">
            The market you're looking for doesn't exist or has been removed.
          </p>
          <button 
            onClick={() => navigate('/markets')} 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Markets
          </button>
        </div>
      </div>
    );
  }

  // Calculate market statistics
  const totalShares = Number(market.totalYes + market.totalNo);
  const yesPercentage = totalShares > 0 ? (Number(market.totalYes) / totalShares) * 100 : 50;
  const noPercentage = totalShares > 0 ? (Number(market.totalNo) / totalShares) * 100 : 50;
  
  // Calculate time remaining
  const getTimeRemaining = () => {
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = Number(market.endTime) - now;
    
    if (timeRemaining <= 0) {
      return 'Ended';
    }
    
    const days = Math.floor(timeRemaining / (24 * 60 * 60));
    const hours = Math.floor((timeRemaining % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((timeRemaining % (60 * 60)) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getMarketStatus = () => {
    if (market.isEnded) return 'Ended';
    if (market.status === 1) return 'Resolved';
    if (market.status === 2) return 'Cancelled';
    return 'Active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Ended': return 'bg-yellow-100 text-yellow-800';
      case 'Resolved': return 'bg-blue-100 text-blue-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to shorten wallet addresses
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Check if current user has participated in this market using logs data
  const hasUserParticipated = () => {
    if (!address || !id || !allLogs) return false;
    
    // Check if user has any SharesBought events for this market
    const userMarketLogs = allLogs.filter(log => {
      return log.args.marketId?.toString() === id && 
             log.eventName === 'SharesBought' && 
             log.args.buyer === address;
    });
    
    return userMarketLogs.length > 0;
  };

  // Get user shares from logs data
  const getUserShares = () => {
    if (!address || !id || !allLogs) {
      return { yesShares: 0n, noShares: 0n };
    }
    
    const userMarketLogs = allLogs.filter(log => {
      return log.args.marketId?.toString() === id && 
             log.eventName === 'SharesBought' && 
             log.args.buyer === address;
    });
    
    let yesShares = 0n;
    let noShares = 0n;
    
    userMarketLogs.forEach(log => {
      const amount = BigInt(log.args.amount || 0);
      if (log.args.side) {
        yesShares += amount;
      } else {
        noShares += amount;
      }
    });
    
    return { yesShares, noShares };
  };

  // Real claim function that calls the smart contract
  const handleClaimWinnings = async () => {
    if (!isConnected) {
      notifySharesPurchaseFailed('Please connect your wallet to claim winnings.');
      return;
    }

    if (!id) {
      notifySharesPurchaseFailed('Invalid market ID.');
      return;
    }

    try {
      setIsClaiming(true);
      console.log('Claiming winnings for market:', id);
      
      // Trigger haptic feedback for Mini App users
      if (isMiniApp) {
        triggerHaptic('medium');
      }
      
      // Call the smart contract to claim winnings
      await claimWinnings(BigInt(id));
      
      // Note: The actual success will be handled by the transaction receipt
      // We'll update the UI when the transaction is confirmed
      
    } catch (err) {
      console.error('Error claiming winnings:', err);
      notifySharesPurchaseFailed('Failed to claim winnings. Please try again.');
      setIsClaiming(false);
    }
  };

  const openBuyModal = (outcome: boolean) => {
    setBuyOutcome(outcome);
    setShowBuyModal(true);
  };

  const closeBuyModal = () => {
    setShowBuyModal(false);
    setBuyAmount('');
    setBuyOutcome(null);
  };

  const handleBuyShares = async () => {
    if (!isConnected) {
      notifySharesPurchaseFailed('Please connect your wallet to buy shares.');
      return;
    }

    if (!buyAmount || parseFloat(buyAmount) <= 0) {
      notifySharesPurchaseFailed('Please enter a valid amount.');
      return;
    }

    if (!market || buyOutcome === null) {
      notifySharesPurchaseFailed('Invalid market or outcome selection.');
      return;
    }

    try {
      setIsBuying(true);
      notifySharesPurchaseStarted(buyOutcome, buyAmount);

      // Trigger haptic feedback for Mini App users
      if (isMiniApp) {
        triggerHaptic('light');
      }

      await buyShares(
        market.id,
        buyOutcome,
        parseEther(buyAmount)
      );

    } catch (err) {
      console.error('Error buying shares:', err);
      notifySharesPurchaseFailed('Failed to buy shares. Please try again.');
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <>
      {market && (
        <MarketEmbedMeta 
          market={{
            id: market.id.toString(),
            question: market.question,
            description: market.description,
            category: market.category,
            totalPool: market.totalPool
          }}
        />
      )}
      <div className="py-8 px-4 sm:px-6 lg:px-8">
      {/* Navigation */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/markets')}
          className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Markets
        </button>
      </div>

      {/* Market Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
          {/* Market Info */}
          <div className="flex-1 mb-6 lg:mb-0">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center">
                <img src={market.image} alt={market.question} className="w-12 h-12 rounded-full" />
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(getMarketStatus())}`}>
                  {getMarketStatus()}
                </span>
              </div>
            </div>
            
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
              {market.question}
            </h1>
            
            <p className="text-gray-600 mb-4 leading-relaxed">
              {market.description}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {market.category}
              </span>
              <span>Created by: {market.source.slice(0, 6)}...{market.source.slice(-4)}</span>
              <span>Ends in: {getTimeRemaining()}</span>
            </div>
          </div>

          {/* Market Stats */}
          <div className="lg:ml-8">
            <div className="bg-gray-50 rounded-lg p-4 min-w-[200px]">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Market Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Volume:</span>
                  <span className="font-medium">${(Number(formatEther(market.totalPool)) * CELO_PRICE_USD).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Yes Shares:</span>
                  <span className="font-medium text-green-600">{formatEther(market.totalYes)} CELO</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">No Shares:</span>
                  <span className="font-medium text-red-600">{formatEther(market.totalNo)} CELO</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Participants:</span>
                  <span className="font-medium">{totalParticipants}</span>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    CELO Price: ${CELO_PRICE_USD}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Outcome Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Yes Outcome */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-600">Yes Outcome</h3>
            <span className="text-2xl font-bold text-green-600">{yesPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-green-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${yesPercentage}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-600">
            {formatEther(market.totalYes)} shares • ${(Number(formatEther(market.totalYes)) * CELO_PRICE_USD).toFixed(2)} volume
          </div>
        </div>

        {/* No Outcome */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-red-600">No Outcome</h3>
            <span className="text-2xl font-bold text-red-600">{noPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="bg-red-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${noPercentage}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-600">
            {formatEther(market.totalNo)} shares • ${(Number(formatEther(market.totalNo)) * CELO_PRICE_USD).toFixed(2)} volume
          </div>
        </div>
      </div>

      {/* Trading Section */}
      {market.status === 0 && !market.isEnded && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {hasUserParticipated() ? 'Your Shares' : 'Trade Shares'}
          </h3>
        
          {hasUserParticipated() ? (
            // User has already participated - show their shares
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-green-900">YES Shares</h4>
                    <span className="text-sm text-green-600 font-medium">
                      {formatEther(getUserShares().yesShares)} shares
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mb-4">
                    You're betting on YES outcome
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-red-900">NO Shares</h4>
                    <span className="text-sm text-red-600 font-medium">
                      {formatEther(getUserShares().noShares)} shares
                    </span>
                  </div>
                  <p className="text-sm text-red-700 mb-4">
                    You're betting on NO outcome
                  </p>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Total Investment</h4>
                <div className="text-sm text-blue-700">
                  <div className="flex justify-between">
                    <span>Total Shares:</span>
                    <span className="font-medium">
                      {formatEther(getUserShares().yesShares + getUserShares().noShares)} shares
                    </span>
                  </div>
                  {/* <div className="flex justify-between mt-1">
                    <span>Total Value:</span>
                    <span className="font-medium">
                      ${(formatGwei(BigInt(getUserShares().yesShares + getUserShares().noShares)) as any * CELO_PRICE_USD).toFixed(4)}
                    </span>
                  </div> */}
                </div>
              </div>
              
              {/* Message about participation */}
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <div className="text-yellow-600 mr-2">ℹ️</div>
                  <div className="text-sm text-yellow-800">
                    <strong>You have already participated in this market.</strong> 
                    <br />
                    Your shares are locked until the market resolves. You cannot buy additional shares.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Buy YES Shares</h4>
                <span className="text-sm text-gray-500">Current Price: ${yesPercentage.toFixed(2)}%</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Bet that the outcome will be YES
              </p>
              <button
                onClick={() => openBuyModal(true)}
                disabled={!isConnected}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isConnected ? 'Buy YES Shares' : 'Connect Wallet'}
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Buy NO Shares</h4>
                <span className="text-sm text-gray-500">Current Price: ${noPercentage.toFixed(2)}%</span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Bet that the outcome will be NO
              </p>
              <button
                onClick={() => openBuyModal(false)}
                disabled={!isConnected}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isConnected ? 'Buy NO Shares' : 'Connect Wallet'}
              </button>
            </div>
          </div>
        )}
        </div>
      )}

      {/* Market Participants Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Market Participants</h3>
          <div className="text-sm text-gray-500">
            {logsLoading ? 'Loading...' : `${totalParticipants} participants`}
          </div>
        </div>

        {logsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading participants...</p>
          </div>
        ) : marketParticipants.length > 0 ? (
          <div className="space-y-4">
            {/* Participants List */}
            <div className="max-h-96 overflow-y-auto">
                            {marketParticipants.map((participant, index) => (
                <div 
                  key={participant.address} 
                  className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {/* Participant Info */}
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-xs md:font-medium text-gray-900">
                        {shortenAddress(participant.address)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {participant.lastParticipation ? 'Yes' : 'No'} side
                      </div>
                    </div>
                  </div>

                  {/* Investment Details */}
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      ${(Number(formatEther(participant.totalInvestment)) * CELO_PRICE_USD).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatEther(participant.totalInvestment)} CELO
                    </div>
                  </div>

                  {/* Shares Breakdown */}
                  <div className="text-right text-sm">
                    <div className="text-green-600">
                      Yes: {formatEther(participant.totalYesShares)}
                    </div>
                    <div className="text-red-600">
                      No: {formatEther(participant.totalNoShares)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

        
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">👥</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Participants Yet</h4>
            <p className="text-gray-600">
              Be the first to participate in this market!
            </p>
          </div>
        )}
      </div>

      {/* Market Resolution */}
      {market.status === 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Resolution</h3>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              market.outcome ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {market.outcome ? 'Yes' : 'No'}
            </span>
            <span className="text-gray-600">
              This market has been resolved with outcome: {market.outcome ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      )}

      {/* Claim Winnings Section */}
      {market.status === 1 && address && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Winnings</h3>
          
          {/* Safety check - if user has claimed, show claimed state regardless of other conditions */}
          {hasClaimedWinnings ? (
            // User has already claimed
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <span className="text-blue-500 text-2xl">✅</span>
                <div>
                  <h4 className="font-medium text-blue-900">Winnings Already Claimed</h4>
                  <p className="text-sm text-blue-700">
                    You have already claimed your winnings for this market.
                  </p>
                </div>
              </div>
              
            </div>
          ) : (canClaimWinnings && !hasClaimedWinnings) ? (
            // User can claim
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-green-500 text-2xl">🎉</span>
                <div>
                  <h4 className="font-medium text-green-900">Congratulations!</h4>
                  <p className="text-sm text-green-700">
                    You have winning shares in this market! You can claim your rewards.
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleClaimWinnings}
                disabled={isClaiming || isClaimPending || isClaimConfirming || hasClaimedWinnings}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isClaiming || isClaimPending ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    {isClaimPending ? 'Confirming...' : 'Claiming...'}
                  </div>
                ) : isClaimConfirming ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Claiming...
                  </div>
                ) : hasClaimedWinnings ? (
                  'Already Claimed'
                ) : (
                  'Claim Winnings'
                )}
              </button>
            </div>
          ) : (
            // User has no winning shares or edge case
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <span className="text-gray-500 text-2xl">😔</span>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {hasClaimedWinnings ? 'Winnings Already Claimed' : 'No Winnings'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {hasClaimedWinnings 
                      ? 'You have already claimed your winnings for this market.'
                      : 'You don\'t have winning shares in this market.'
                    }
                  </p>
                </div>
              </div>
              
              
            </div>
          )}
        </div>
      )}

      {/* Winnings Breakdown - Only for resolved markets with user participation */}
      {market.status === 1 && address && hasUserParticipated() && (
        <WinningsBreakdownComponent 
          marketId={market.id}
          userAddress={address}
          className="mb-6"
        />
      )}

      {/* Market Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-500">Creation Time:</span>
            <p className="text-gray-900">
              {new Date(Number(market.createdAt) * 1000).toLocaleDateString()}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">End Time:</span>
            <p className="text-gray-900">
              {new Date(Number(market.endTime) * 1000).toLocaleDateString()}
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Total Pool:</span>
            <p className="text-gray-900">${(Number(formatEther(market.totalPool)) * CELO_PRICE_USD).toFixed(2)} (${formatEther(market.totalPool)} CELO)</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Market Status:</span>
            <p className="text-gray-900">{getMarketStatus()}</p>
          </div>
        </div>
      </div>

      {/* Buy Shares Modal */}
      {showBuyModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Buy Shares
              </h3>
              <button
                onClick={closeBuyModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Market: <span className="font-medium">{market?.question}</span>
              </p>
              <p className="text-sm text-gray-600">
                Outcome: <span className={`font-medium ${buyOutcome ? 'text-green-600' : 'text-red-600'}`}>
                  {buyOutcome ? 'YES' : 'NO'}
                </span>
              </p>
            </div>

            <div className="mb-4">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount to Invest (ETH)
              </label>
              <input
                type="number"
                id="amount"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                placeholder="0.01"
                min="0.001"
                step="0.001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isBuying}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum: 0.001 ETH
              </p>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Current Price:</span>
                <span className="font-medium">
                  ${buyOutcome ? yesPercentage.toFixed(2) : noPercentage.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Estimated Shares:</span>
                <span className="font-medium">
                  {buyAmount && parseFloat(buyAmount) > 0 
                    ? (parseFloat(buyAmount) / (buyOutcome ? yesPercentage : noPercentage) * 100).toFixed(4)
                    : '0'
                  }
                </span>
              </div>
            </div>

            {/* Potential Winnings Preview */}
            {buyAmount && parseFloat(buyAmount) > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-900 mb-2">Potential Winnings Preview</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">If you win:</span>
                    <span className="font-medium text-blue-900">
                      {(() => {
                        try {
                          const investment = parseFloat(buyAmount);
                          const currentWinningShares = buyOutcome ? Number(formatEther(market.totalYes)) : Number(formatEther(market.totalNo));
                          const currentLosingShares = buyOutcome ? Number(formatEther(market.totalNo)) : Number(formatEther(market.totalYes));
                          
                          if (currentLosingShares > 0) {
                            // Calculate potential winnings
                            const creatorFee = currentLosingShares * 0.15;
                            const platformFee = currentLosingShares * 0.15;
                            const availableWinnings = currentLosingShares - creatorFee - platformFee;
                            const userShare = (availableWinnings * investment) / (currentWinningShares + investment);
                            const totalWinnings = investment + userShare;
                            return `${totalWinnings.toFixed(4)} CELO`;
                          } else {
                            return `${investment.toFixed(4)} CELO`;
                          }
                        } catch {
                          return 'Calculating...';
                        }
                      })()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">If you lose:</span>
                    <span className="font-medium text-red-600">0 CELO</span>
                  </div>
                  <div className="text-xs text-blue-600 mt-2">
                    * Estimates based on current market state
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={closeBuyModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isBuying}
              >
                Cancel
              </button>
              <button
                onClick={handleBuyShares}
                disabled={isBuying || !buyAmount || parseFloat(buyAmount) <= 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isBuying ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Buying...
                  </div>
                ) : (
                  `Buy Shares`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <NotificationContainer />
      </div>
    </>
  );
};

export default MarketDetail;

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useMarkets } from '../hooks/useMarkets';
import { usePredictionMarketCore } from '../hooks/usePredictionMarketCore';
import { usePredictionMarketClaims } from '../hooks/usePredictionMarketClaims';
import { useMarketParticipants } from '../hooks/useMarketParticipants';


import { formatEther, parseEther } from 'viem';
import { UserSharesDisplay } from '../components/UserSharesDisplay';
import type { MarketWithUserShares } from '../types/contracts';



const MarketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isConnected, address } = useAccount();
  
  // Hooks
  const { markets, loading: marketsLoading, refetchMarkets } = useMarkets();
  const { buyShares } = usePredictionMarketCore();
  const { 
    claimWinnings, 
    getWinnerInfo 
  } = usePredictionMarketClaims();

  


  // State
  const [market, setMarket] = useState<MarketWithUserShares | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Market participants hook (using market ID from state)
  const marketId = market?.id;
  const { 
    participants: marketParticipants, 
    loading: participantsLoading, 
    totalParticipants,
    refetch: refetchParticipants 
  } = useMarketParticipants(marketId);
  
  // Potential winnings - calculated directly to match smart contract logic
  
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyOutcome, setBuyOutcome] = useState<boolean | null>(null);
  const [buyAmount, setBuyAmount] = useState('');
  const [isBuying, setIsBuying] = useState(false);
  const [canClaimWinnings, setCanClaimWinnings] = useState(false);
  const [potentialWinnings, setPotentialWinnings] = useState<{
    amount: string;
    returnPercentage: number;
  } | null>(null);

  const [isClaiming, setIsClaiming] = useState(false);

  // Calculate potential winnings when buy amount or outcome changes
  useEffect(() => {
    const calculateWinnings = () => {
      if (!market || !buyAmount || parseFloat(buyAmount) <= 0 || buyOutcome === null) {
        setPotentialWinnings(null);
        return;
      }

      try {
        const investmentAmount = parseEther(buyAmount);
        
        // Get current market state
        const currentWinningShares = buyOutcome ? market.totalYes : market.totalNo;
        const currentLosingShares = buyOutcome ? market.totalNo : market.totalYes;
        
        // Calculate new market state after user's purchase
        const newWinningShares = currentWinningShares + investmentAmount;
        const newLosingShares = currentLosingShares; // Losing shares don't change
        
        // Calculate total winner amount (like smart contract's _calculateTotalWinnerAmount)
        let totalWinnerAmount = newWinningShares;
        if (newLosingShares > 0n) {
          // Creator fee percentage (assuming 15% like in the contract)
          const creatorFeePercentage = 15n;
          const creatorFee = (newLosingShares * creatorFeePercentage) / 100n;
          const platformFee = (newLosingShares * 15n) / 100n;
          const winnersFromLosers = newLosingShares - creatorFee - platformFee;
          
          totalWinnerAmount = newWinningShares + winnersFromLosers;
        }
        
        // Calculate user's share of the total winnings
        const userWinnings = (totalWinnerAmount * investmentAmount) / newWinningShares;
        
        // Calculate return percentage
        const returnPercentage = investmentAmount > 0n ? 
          Number((userWinnings - investmentAmount) * 10000n / investmentAmount) / 100 : 0;
        
        setPotentialWinnings({
          amount: formatEther(userWinnings),
          returnPercentage: returnPercentage
        });
      } catch (error) {
        console.error('Error calculating potential winnings:', error);
        setPotentialWinnings(null);
      }
    };

    calculateWinnings();
  }, [market, buyAmount, buyOutcome]);

  // Find market by ID
  useEffect(() => {
    if (id && markets.length > 0) {
      const foundMarket = markets.find(m => m.id.toString() === id);
      if (foundMarket) {
        setMarket(foundMarket);
      }
      setIsLoading(false);
    }
  }, [id, markets]);

  // Check if user can claim winnings
  useEffect(() => {
    const checkClaimStatus = async () => {
      if (!market || !address || (market.status as number) !== 2) return; // Only for resolved markets

      try {
        const info = await getWinnerInfo(market.id, address);
        setCanClaimWinnings(Boolean(info?.isWinner && !info?.hasClaimed));

      } catch (error) {
        console.error('Error checking claim status:', error);
      }
    };

    checkClaimStatus();
  }, [market, address, getWinnerInfo]);

  // Note: Success handling is now done inline in the buy/claim functions

  // Note: Participants are automatically fetched when market changes via the hook's marketId dependency

  // Utility function to shorten addresses
  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };



  // Market status helpers
  const getMarketStatus = (status: number) => {
    switch (status) {
      case 0: return { text: 'Active', color: 'text-green-600 bg-green-100' };
      case 1: return { text: 'Paused', color: 'text-yellow-600 bg-yellow-100' };
      case 2: return { text: 'Resolved', color: 'text-blue-600 bg-blue-100' };
      case 3: return { text: 'Cancelled', color: 'text-red-600 bg-red-100' };
      default: return { text: 'Unknown', color: 'text-gray-600 bg-gray-100' };
    }
  };

  const getMarketOutcome = (market: MarketWithUserShares) => {
    if ((market.status as number) !== 2) return null;
    return market.outcome ? 'YES' : 'NO';
  };

  // Calculate market percentages
  const marketPercentages = useMemo(() => {
    if (!market) return { yesPercentage: 50, noPercentage: 50 };
    
    const totalShares = Number(market.totalYes + market.totalNo);
    const yesPercentage = totalShares > 0 ? (Number(market.totalYes) / totalShares) * 100 : 50;
    const noPercentage = totalShares > 0 ? (Number(market.totalNo) / totalShares) * 100 : 50;
    
    return { yesPercentage, noPercentage };
  }, [market]);

  // Format time remaining
  const getTimeRemaining = (endTime: bigint) => {
    const now = Math.floor(Date.now() / 1000);
    const end = Number(endTime);
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Buy shares handler
  const handleBuyShares = async () => {
    if (!market || !buyAmount || buyOutcome === null || parseFloat(buyAmount) <= 0) return;

    try {
      setIsBuying(true);
      const amount = parseEther(buyAmount);
      
      const result = await buyShares({
        marketId: market.id,
        outcome: buyOutcome,
        value: amount
      });

      if (result.success) {
        setIsBuying(false);
        setShowBuyModal(false);
        setBuyAmount('');
        setBuyOutcome(null);
        // Show success message
        alert(`Successfully bought shares! Transaction: ${result.transactionHash?.slice(0, 10)}...`);
        // Refresh market data to show updated pool amounts
        refetchMarkets();
        // Refresh participants data
        refetchParticipants();
      } else {
        alert(`Error buying shares: ${result.error}`);
        setIsBuying(false);
      }
    } catch (error: any) {
      console.error('Error buying shares:', error);
      alert(`Error buying shares: ${error.message}`);
      setIsBuying(false);
    }
  };

  // Claim winnings handler
  const handleClaimWinnings = async () => {
    if (!market || !canClaimWinnings) return;

    try {
      setIsClaiming(true);
      const result = await claimWinnings(market.id);

      if (result.success) {
        setIsClaiming(false);
        setCanClaimWinnings(false);

        // Show success message
        alert(`Successfully claimed winnings! Transaction: ${result.transactionHash?.slice(0, 10)}...`);
        // Refresh market data to show updated claim status
        refetchMarkets();
        // Refresh participants data
        refetchParticipants();
      } else {
        alert(`Error claiming winnings: ${result.error}`);
        setIsClaiming(false);
      }
    } catch (error: any) {
      console.error('Error claiming winnings:', error);
      alert(`Error claiming winnings: ${error.message}`);
      setIsClaiming(false);
    }
  };

  // Open buy modal
  const openBuyModal = (outcome: boolean) => {
    if (!isConnected) {
      alert('Please connect your wallet to buy shares');
      return;
    }
    setBuyOutcome(outcome);
    setShowBuyModal(true);
  };

  // Close buy modal
  const closeBuyModal = () => {
    setShowBuyModal(false);
    setBuyOutcome(null);
    setBuyAmount('');
  };

  if (isLoading || marketsLoading) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading market details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Market Not Found</h1>
            <p className="text-gray-600 mb-6">The market you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => navigate('/markets')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Markets
            </button>
          </div>
        </div>
      </div>
    );
  }

  const status = getMarketStatus(market.status);
  const outcome = getMarketOutcome(market);
  const timeRemaining = getTimeRemaining(market.endTime);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/markets')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Markets
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                      {status.text}
                    </span>
                    {outcome && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        Resolved: {outcome}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{market.question}</h1>
                  <p className="text-gray-600 mb-4">{market.description}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {timeRemaining}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {totalParticipants} participants
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      {formatEther(market.totalYes + market.totalNo)} CELO
                    </div>
                  </div>
                </div>
                
                {market.image && (
                  <img
                    src={market.image}
                    alt="Market"
                    className="w-24 h-24 object-cover rounded-lg ml-4"
                  />
                )}
              </div>

              {/* Market Image */}
              {market.image && (
                <div className="mb-6">
                  <img
                    src={market.image}
                    alt="Market"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Source Links */}
              {market.source && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Source Links:</h3>
                  <div className="text-sm text-blue-600 break-all">
                    {market.source}
                  </div>
                </div>
              )}
            </div>

            {/* Market Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Statistics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* YES/NO Breakdown */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Current Pool</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                        <span className="text-gray-700">YES</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatEther(market.totalYes)} CELO</div>
                        <div className="text-sm text-gray-500">{marketPercentages.yesPercentage.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                        <span className="text-gray-700">NO</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatEther(market.totalNo)} CELO</div>
                        <div className="text-sm text-gray-500">{marketPercentages.noPercentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Market Info */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Market Info</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium text-gray-900">{market.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Creator:</span>
                      <span className="font-medium text-gray-900 font-mono text-xs">
                        {market.creator.slice(0, 6)}...{market.creator.slice(-4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Time:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(Number(market.endTime) * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Volume:</span>
                      <span className="font-medium text-gray-900">
                        {formatEther(market.totalYes + market.totalNo)} CELO
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Market Participants */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Market Participants</h3>
                <div className="text-sm text-gray-500">
                  {participantsLoading ? 'Loading...' : `${totalParticipants} participants`}
                </div>
              </div>
              
              {participantsLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading participants...</p>
                </div>
              ) : marketParticipants.length > 0 ? (
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
                          <div className="text-sm font-medium text-gray-900">
                            {shortenAddress(participant.address)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {participant.lastParticipation !== null ? (participant.lastParticipation ? 'Yes' : 'No') : 'No trades'} side
                          </div>
                        </div>
                      </div>

                      {/* Investment Details */}
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {formatEther(participant.totalInvestment)} CELO
                        </div>
                        <div className="text-sm text-gray-500">
                          Total invested
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
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">No participants yet</p>
                </div>
              )}
            </div>


          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trading Section */}
            {(market.status as number) === 0 && !market.isEnded && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trade Shares</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => openBuyModal(true)}
                      className="p-4 rounded-lg border-2 border-green-200 bg-green-50 text-green-700 hover:border-green-300 transition-colors"
                    >
                      <div className="text-center">
                        <div className="text-lg font-semibold">Buy YES</div>
                        <div className="text-sm text-green-600">
                          {marketPercentages.yesPercentage.toFixed(1)}% of pool
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => openBuyModal(false)}
                      className="p-4 rounded-lg border-2 border-red-200 bg-red-50 text-red-700 hover:border-red-300 transition-colors"
                    >
                      <div className="text-center">
                        <div className="text-lg font-semibold">Buy NO</div>
                        <div className="text-sm text-red-600">
                          {marketPercentages.noPercentage.toFixed(1)}% of pool
                        </div>
                      </div>
                    </button>
                  </div>

                  {!isConnected && (
                    <div className="text-center py-4">
                      <p className="text-gray-600 text-sm">Connect your wallet to trade</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Market Paused Message */}
            {(market.status as number) === 1 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Paused</h3>
                <p className="text-gray-600 text-sm mb-4">
                  This market is currently paused. Trading is temporarily unavailable.
                </p>
              </div>
            )}

            {/* Market Ended Message */}
            {market.isEnded && (market.status as number) === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Ended</h3>
                <p className="text-gray-600 text-sm mb-4">
                  This market has ended. Trading is no longer available. The market will be resolved soon.
                </p>
                <div className="text-sm text-gray-500">
                  <p>Ended: {new Date(Number(market.endTime) * 1000).toLocaleString()}</p>
                </div>
              </div>
            )}

            {/* Market Cancelled Message */}
            {(market.status as number) === 3 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Cancelled</h3>
                <p className="text-gray-600 text-sm mb-4">
                  This market has been cancelled. Trading is no longer available.
                </p>
              </div>
            )}

            {/* Claim Winnings */}
            {(market.status as number) === 2 && address && canClaimWinnings && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Claim Winnings</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Congratulations! You won this market and can claim your winnings.
                </p>
                <button
                  onClick={handleClaimWinnings}
                  disabled={isClaiming}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isClaiming ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Claiming...
                    </div>
                  ) : (
                    'Claim Winnings'
                  )}
                </button>
              </div>
            )}

            {/* User Shares Display */}
            {address && (
              <UserSharesDisplay
                market={market}
                userAddress={address}
              />
            )}
          </div>
        </div>

        {/* Buy Shares Modal */}
        {showBuyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Buy {buyOutcome ? 'YES' : 'NO'} Shares
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (CELO):
                </label>
                <input
                  type="number"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  placeholder="0.01"
                  min="0.001"
                  step="0.001"
                  className="w-full px-4 py-3 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {buyAmount && parseFloat(buyAmount) > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">Trade Summary</h4>
                  <div className="space-y-1 text-sm text-blue-800">
                    <div className="flex justify-between">
                      <span>You're buying:</span>
                      <span className="font-medium">{buyAmount} CELO of {buyOutcome ? 'YES' : 'NO'} shares</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current {buyOutcome ? 'YES' : 'NO'} Pool:</span>
                      <span className="font-medium">
                        {formatEther(buyOutcome ? market.totalYes : market.totalNo)} CELO
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Your {buyOutcome ? 'YES' : 'NO'} Share:</span>
                      <span className="font-medium text-green-600">
                        {(() => {
                          const currentPool = buyOutcome ? Number(market.totalYes) : Number(market.totalNo);
                          const yourInvestment = parseFloat(buyAmount) * 1e18;
                          const newPool = currentPool + yourInvestment;
                          const yourShare = (yourInvestment / newPool) * 100;
                          return `${yourShare.toFixed(2)}%`;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Potential Winnings Preview */}
              {potentialWinnings && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-green-900 mb-2">Potential Winnings Preview</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">If you win:</span>
                      <span className="font-medium text-green-900">
                        {potentialWinnings.amount} CELO
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Return:</span>
                      <span className="font-medium text-green-900">
                        {potentialWinnings.returnPercentage > 0 ? '+' : ''}{potentialWinnings.returnPercentage.toFixed(2)}%
                      </span>
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
                  Shares Breakdown
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isBuying ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Buying...
                    </div>
                  ) : (
                    'Buy Shares'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketDetail;

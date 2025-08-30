import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useMarkets } from '../hooks/useMarkets';
import { useMarketParticipants } from '../hooks/useMarketParticipants';
import NotificationContainer from '../components/NotificationContainer';
import { formatEther } from 'viem';

const MarketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { allMarkets, loading, error } = useMarkets();
  const { participants, loading: participantsLoading, totalParticipants } = useMarketParticipants(
    id ? BigInt(id) : undefined
  );
  
  const [market, setMarket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id && allMarkets.length > 0) {
      const foundMarket = allMarkets.find(m => m.id.toString() === id);
      if (foundMarket) {
        setMarket(foundMarket);
      }
      setIsLoading(false);
    }
  }, [id, allMarkets]);

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
  if (error || !market) {
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

  return (
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
                  <span className="font-medium">${formatEther(market.totalPool)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Yes Shares:</span>
                  <span className="font-medium text-green-600">{formatEther(market.totalYes)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">No Shares:</span>
                  <span className="font-medium text-red-600">{formatEther(market.totalNo)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Participants:</span>
                  <span className="font-medium">{totalParticipants}</span>
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
            {formatEther(market.totalYes)} shares • ${formatEther(market.totalYes)} volume
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
            {formatEther(market.totalNo)} shares • ${formatEther(market.totalNo)} volume
          </div>
        </div>
      </div>

      {/* Market Participants Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Market Participants</h3>
          <div className="text-sm text-gray-500">
            {participantsLoading ? 'Loading...' : `${totalParticipants} participants`}
          </div>
        </div>

        {participantsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading participants...</p>
          </div>
        ) : participants.length > 0 ? (
          <div className="space-y-4">
            {/* Participants List */}
            <div className="max-h-96 overflow-y-auto">
              {participants.map((participant, index) => (
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
                      ${formatEther(participant.totalInvestment)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {participant.investmentPercentage.toFixed(2)}% of pool
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

      {/* Trading Section */}
      {market.status === 0 && !market.isEnded && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trade on This Market</h3>
          
          {isConnected ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-green-600 mb-2">Buy Yes Shares</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Bet that the outcome will be "Yes"
                </p>
                <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                  Buy Yes
                </button>
              </div>
              
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-red-600 mb-2">Buy No Shares</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Bet that the outcome will be "No"
                </p>
                <button className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                  Buy No
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">🔒</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h4>
              <p className="text-gray-600 mb-4">
                Connect your wallet to start trading on this market
              </p>
              <button className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors">
                Connect Wallet
              </button>
            </div>
          )}
        </div>
      )}

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
            <p className="text-gray-900">${formatEther(market.totalPool)}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Market Status:</span>
            <p className="text-gray-900">{getMarketStatus()}</p>
          </div>
        </div>
      </div>
      <NotificationContainer />
    </div>
  );
};

export default MarketDetail;

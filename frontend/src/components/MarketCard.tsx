import React from 'react';
import { Link } from 'react-router-dom';
import type { Market } from '../utils/contracts';
import { formatEther } from 'viem';

interface MarketCardProps {
  market: Market;
}

const MarketCard: React.FC<MarketCardProps> = ({ market }) => {
  // Calculate time remaining
  const formatTimeRemaining = (endTime: bigint) => {
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = Number(endTime) - now;
    
    if (timeRemaining <= 0) {
      return 'Ended';
    }
    console.log(market);
    
    const days = Math.floor(timeRemaining / (24 * 60 * 60));
    const hours = Math.floor((timeRemaining % (24 * 60 * 60)) / (60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return 'Less than 1h';
    }
  };

  // Calculate percentages
  const totalShares = Number(market.totalYes + market.totalNo);
  const yesPercentage = totalShares > 0 ? (Number(market.totalYes) / totalShares) * 100 : 50;
  const noPercentage = totalShares > 0 ? (Number(market.totalNo) / totalShares) * 100 : 50;

  // Format volume
  const formatVolume = (totalYes: bigint, totalNo: bigint) => {
    const total = Number(totalYes + totalNo);
    if (total === 0) return '~$0';
    return `$${formatEther(totalYes + totalNo)}`;
  };

  // Format creator address
  const formatCreator = (creator: string) => {
    return `${creator.slice(0, 6)}...${creator.slice(-4)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Market Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start space-x-3">
          {/* Market Image/Avatar */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full flex items-center justify-center">
              <img src={market.image} alt={market.question} className="w-12 h-12 rounded-full" />
            </div>
          </div>
          
          {/* Market Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
              {market.question}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                {market.category}
              </span>
              <span>•</span>
              <span>Ends in: {formatTimeRemaining(market.endTime)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Market Description */}
      <div className="px-4 py-3">
        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
          {market.description}
        </p>
        
        {/* Market Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-green-600 font-medium">
              Yes: {yesPercentage.toFixed(1)}%
            </span>
            <span className="text-red-600 font-medium">
              No: {noPercentage.toFixed(1)}%
            </span>
          </div>
          <span className="text-gray-500">
            {formatVolume(market.totalYes, market.totalNo)}
          </span>
        </div>
      </div>

      {/* Market Actions */}
      <div className="px-4 pb-4">
        {/* Market Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>by {formatCreator(market.source)}</span>
          <Link 
            to={`/market/${market.id}`}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View Details →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MarketCard;

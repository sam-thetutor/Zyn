import React from 'react';
import { Link } from 'react-router-dom';
import { formatEther } from 'viem';
import type { Market } from '../../utils/contracts';

interface MarketCardProps {
  market: Market;
}

const MarketCard: React.FC<MarketCardProps> = ({ market }) => {
  // Calculate percentages
  const totalShares = market.totalYes + market.totalNo;
  const yesPercentage = totalShares > 0n ? (Number(market.totalYes) / Number(totalShares)) * 100 : 50;

  // Format time remaining
  const formatTimeRemaining = (endTime: bigint): string => {
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = Math.max(0, Number(endTime) - now);
    
    if (timeRemaining <= 0) return 'Ended';
    
    const days = Math.floor(timeRemaining / 86400);
    const hours = Math.floor((timeRemaining % 86400) / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return `${timeRemaining}s`;
  };

  // Get status badge
  const getStatusBadge = () => {
    const now = Math.floor(Date.now() / 1000);
    const isEnded = Number(market.endTime) <= now;
    
    if (market.status === 1) { // 1 = RESOLVED status
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: 'var(--color-accent)' }}>
          Resolved
        </span>
      );
    }
    
    if (isEnded) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: '#f59e0b' }}>
          Ended
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
        Active
      </span>
      );
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 transition-all duration-300 hover:shadow-lg w-full max-w-full min-w-0 p-4 md:p-6">
      {/* Header with Image Placeholder and Status */}
      <Link to={`/market/${market.id}`}>
        <div className="pb-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 md:gap-4">
            {/* Image Placeholder - Top Left */}
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg flex-shrink-0 mx-auto md:mx-0" style={{ backgroundColor: 'var(--color-bg-accent)', border: '1px solid var(--color-border-accent)' }}>
              {market.image ? (
                <img 
                  src={market.image} 
                  alt={market.question}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className="w-full h-full flex items-center justify-center text-base md:text-lg font-bold hidden" style={{ color: 'var(--color-primary)' }}>
                {market.question.charAt(0).toUpperCase()}
              </div>
            </div>
            
            {/* Question - Center */}
            <div className="flex-1 text-center md:text-left">
              <span className="text-base md:text-xl font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {market.question}
              </span>
            </div>
            
            {/* Yes Percentage - Top Right */}
            <div className="text-center md:text-right flex-shrink-0">
              <div className="text-lg md:text-xl font-bold mb-1" style={{ color: 'var(--color-accent)' }}>
                {yesPercentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </Link> 

      {/* Market Info */}
      <div className="py-4">
        {/* Category Badge */}
        {market.category && (
          <div className="mb-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--color-bg-accent)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-accent)' }}>
              {market.category}
            </span>
          </div>
        )}

        {/* Description */}
        {market.description && (
          <div className="mb-3">
            <p className="text-xs md:text-sm text-gray-600">
              {market.description.length > 100 
                ? `${market.description.substring(0, 100)}...` 
                : market.description
              }
            </p>
          </div>
        )}

        {/* Source */}
        {market.source && (
          <div className="mb-3">
            <div className="flex items-center text-xs text-gray-500">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Source: {market.source}
            </div>
          </div>
        )}

        {/* Time Remaining */}
        <div className="text-xs text-gray-500 mb-4">
          Ends in: {formatTimeRemaining(market.endTime)}
        </div>

        {/* Trading Buttons */}
        <div className="flex flex-col gap-2">
          <Link
            to={`/markets/${market.id}`}
            className="w-full py-2 px-4 rounded-lg font-medium text-center transition-all duration-200 text-white text-sm md:text-base"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            Buy Yes
          </Link>
          <Link
            to={`/markets/${market.id}`}
            className="w-full py-2 px-4 rounded-lg font-medium text-center transition-all duration-200 text-white text-sm md:text-base"
            style={{ backgroundColor: 'var(--color-danger)' }}
          >
            Buy No
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-gray-200 text-center">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>by Creator</span>
          <span>
            ~${(Number(formatEther(totalShares)) * 1).toFixed(0)} volume
          </span>
        </div>
      </div>
    </div>
  );
};

export default MarketCard;

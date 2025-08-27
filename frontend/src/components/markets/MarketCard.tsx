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
    <div className="card transition-all duration-300 slide-up">
      {/* Header with Image Placeholder and Status */}
      <Link to={`/market/${market.id}`}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
          <div className="flex items-start justify-between mb-4">
            {/* Image Placeholder - Top Left */}
            <div className="w-16 h-16 rounded-lg flex-shrink-0" style={{ backgroundColor: 'var(--color-bg-accent)', border: '1px solid var(--color-border-accent)' }}>
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
              <div className="w-full h-full flex items-center justify-center text-lg font-bold hidden" style={{ color: 'var(--color-primary)' }}>
                {market.question.charAt(0).toUpperCase()}
              </div>
            </div>
            
            {/* Question - Center */}
            <div className="flex-1 mx-4 text-center">
              <span className="text-xl" style={{ color: 'var(--color-text-primary)' }}>
                {market.question}
              </span>
            </div>
            
            {/* Yes Percentage - Top Right */}
            <div className="text-right flex-shrink-0">
              <div className="text-xl mb-1" style={{ color: 'var(--color-accent)' }}>
                {yesPercentage.toFixed(1)}%
              </div>
              {/* <div className="text-xs text-secondary">Yes</div> */}
            </div>
          </div>
        </div>
      </Link> 

      {/* Market Info */}
      <div className="p-4">
        {/* Category Badge */}
        {market.category && (
          <div className="mb-3">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'var(--color-bg-accent)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-accent)' }}>
              {market.category}
            </span>
          </div>
        )}

        {/* Market Description */}
        {market.description && (
          <p className="text-sm text-secondary mb-3 line-clamp-2">
            {market.description}
          </p>
        )}

        {/* Time Remaining */}
        <div className="text-xs text-secondary mb-4">
          Ends in: {formatTimeRemaining(market.endTime)}
        </div>

        {/* Trading Buttons */}
        <div className="flex gap-2">
          <Link
            to={`/markets/${market.id}`}
            className="flex-1 py-2 px-4 rounded-lg font-medium text-center transition-all duration-200 text-white"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            Buy Yes
          </Link>
          <Link
            to={`/markets/${market.id}`}
            className="flex-1 py-2 px-4 rounded-lg font-medium text-center transition-all duration-200 text-white"
            style={{ backgroundColor: 'var(--color-danger)' }}
          >
            Buy No
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4" style={{ borderTop: '1px solid var(--color-border-light)', backgroundColor: 'var(--color-bg-tertiary)' }}>
        <div className="flex justify-between items-center text-xs">
          <span className="text-secondary">by Creator</span>
          <span className="text-secondary">
                            ~${(Number(formatEther(totalShares)) * 1).toFixed(0)} volume
          </span>
        </div>
      </div>
    </div>
  );
};

export default MarketCard;

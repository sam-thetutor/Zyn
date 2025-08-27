import React, { useState } from 'react';
import { formatEther } from 'viem';
import type { UserActivity } from '../../hooks/useUserActivity';

interface UserActivityFeedProps {
  activities: UserActivity[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const UserActivityFeed: React.FC<UserActivityFeedProps> = ({
  activities,
  loading,
  error,
  onRefresh,
}) => {
  const [selectedType, setSelectedType] = useState<'all' | UserActivity['type']>('all');

  const getActivityIcon = (type: UserActivity['type']) => {
    switch (type) {
      case 'market_created':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
      case 'shares_bought':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'market_resolved':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'winnings_claimed':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getActivityColor = (type: UserActivity['type']) => {
    switch (type) {
      case 'market_created':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shares_bought':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'market_resolved':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'winnings_claimed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActivityTitle = (type: UserActivity['type']) => {
    switch (type) {
      case 'market_created':
        return 'Market Created';
      case 'shares_bought':
        return 'Shares Purchased';
      case 'market_resolved':
        return 'Market Resolved';
      case 'winnings_claimed':
        return 'Winnings Claimed';
      default:
        return 'Activity';
    }
  };

  const getActivityDescription = (activity: UserActivity) => {
    switch (activity.type) {
      case 'market_created':
        return `Created a new prediction market`;
      case 'shares_bought':
        const outcome = activity.details.outcome ? 'Yes' : 'No';
        const amount = activity.details.amount ? formatEther(activity.details.amount) : '0';
        return `Bought ${amount} CELO worth of ${outcome} shares`;
      case 'market_resolved':
        const result = activity.details.outcomeResult ? 'Yes' : 'No';
        return `Market resolved with outcome: ${result}`;
      case 'winnings_claimed':
        const winnings = activity.details.winnings ? formatEther(activity.details.winnings) : '0';
        return `Claimed ${winnings} CELO in winnings`;
      default:
        return 'Activity performed';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const filteredActivities = selectedType === 'all' 
    ? activities 
    : activities.filter(activity => activity.type === selectedType);

  if (loading) {
    return (
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Activity Feed
          </h2>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn btn-primary btn-sm"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-secondary">Loading activities...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Activity Feed
          </h2>
          <button
            onClick={onRefresh}
            className="btn btn-primary btn-sm"
          >
            Retry
          </button>
        </div>
        
        <div className="text-center py-8">
          <div className="text-danger mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            Error Loading Activities
          </h3>
          <p className="text-secondary mb-4">{error}</p>
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Activity Feed
          </h2>
          <button
            onClick={onRefresh}
            className="btn btn-primary btn-sm"
          >
            Refresh
          </button>
        </div>
        
        <div className="text-center py-8">
          <div className="text-secondary mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
            No Activity Yet
          </h3>
          <p className="text-secondary">
            Start creating markets and trading to see your activity here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Activity Feed
        </h2>
        <button
          onClick={onRefresh}
          className="btn btn-primary btn-sm"
        >
          Refresh
        </button>
      </div>

      {/* Activity Type Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedType === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({activities.length})
          </button>
          <button
            onClick={() => setSelectedType('market_created')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedType === 'market_created'
                ? 'bg-blue-500 text-white'
                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
            }`}
          >
            Created ({activities.filter(a => a.type === 'market_created').length})
          </button>
          <button
            onClick={() => setSelectedType('shares_bought')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedType === 'shares_bought'
                ? 'bg-green-500 text-white'
                : 'bg-green-100 text-green-600 hover:bg-green-200'
            }`}
          >
            Trades ({activities.filter(a => a.type === 'shares_bought').length})
          </button>
          <button
            onClick={() => setSelectedType('market_resolved')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedType === 'market_resolved'
                ? 'bg-purple-500 text-white'
                : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
            }`}
          >
            Resolved ({activities.filter(a => a.type === 'market_resolved').length})
          </button>
          <button
            onClick={() => setSelectedType('winnings_claimed')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedType === 'winnings_claimed'
                ? 'bg-yellow-500 text-white'
                : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
            }`}
          >
            Winnings ({activities.filter(a => a.type === 'winnings_claimed').length})
          </button>
        </div>
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        {filteredActivities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start space-x-4 p-4 rounded-lg border transition-all duration-200 hover:shadow-md"
            style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-light)' }}
          >
            {/* Activity Icon */}
            <div className={`p-2 rounded-lg border ${getActivityColor(activity.type)}`}>
              {getActivityIcon(activity.type)}
            </div>

            {/* Activity Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                    {getActivityTitle(activity.type)}
                  </h3>
                  <p className="text-sm mb-2" style={{ color: 'var(--color-text-primary)' }}>
                    {activity.question}
                  </p>
                  <p className="text-sm text-secondary mb-2">
                    {getActivityDescription(activity)}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-secondary">
                    <span>Category: {activity.category}</span>
                    <span>Market ID: #{activity.marketId.toString()}</span>
                    <span>{formatTimestamp(activity.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Link */}
            <div className="flex-shrink-0">
              <a
                href={`https://alfajores.celoscan.io/tx/${activity.transactionHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                View TX
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Show More Button */}
      {filteredActivities.length > 10 && (
        <div className="text-center mt-6">
          <button className="btn btn-secondary">
            Show More Activities
          </button>
        </div>
      )}
    </div>
  );
};

export default UserActivityFeed;

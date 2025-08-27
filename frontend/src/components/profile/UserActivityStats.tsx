import React from 'react';
import { formatEther } from 'viem';

interface UserActivityStatsProps {
  stats: {
    totalMarkets: number;
    totalTrades: number;
    totalResolved: number;
    totalWinnings: bigint;
  };
}

const UserActivityStats: React.FC<UserActivityStatsProps> = ({ stats }) => {
  const formatWinnings = (winnings: bigint) => {
    if (winnings === 0n) return '0.0000';
    return Number(formatEther(winnings)).toFixed(4);
  };

  const getWinningsColor = (winnings: bigint) => {
    if (winnings === 0n) return 'text-gray-500';
    if (winnings > 0n) return 'text-green-500';
    return 'text-red-500';
  };

  const getWinningsIcon = (winnings: bigint) => {
    if (winnings === 0n) return '💰';
    if (winnings > 0n) return '🎉';
    return '📉';
  };

  const statItems = [
    {
      title: 'Markets Created',
      value: stats.totalMarkets.toString(),
      description: 'Prediction markets you\'ve created',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
    },
    {
      title: 'Total Trades',
      value: stats.totalTrades.toString(),
      description: 'Shares you\'ve purchased',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'bg-green-500',
      textColor: 'text-green-600',
    },
    {
      title: 'Markets Resolved',
      value: stats.totalResolved.toString(),
      description: 'Markets that have been resolved',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
    },
    {
      title: 'Total Winnings',
              value: `${formatWinnings(stats.totalWinnings)} CELO`,
      description: 'Winnings claimed from resolved markets',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      color: 'bg-yellow-500',
      textColor: getWinningsColor(stats.totalWinnings),
    },
  ];

  // Calculate performance metrics
  const participationRate = stats.totalMarkets > 0 ? ((stats.totalTrades / stats.totalMarkets) * 100).toFixed(1) : '0';
  const successRate = stats.totalResolved > 0 ? ((stats.totalResolved / stats.totalTrades) * 100).toFixed(1) : '0';
  const avgWinnings = stats.totalResolved > 0 ? Number(formatEther(stats.totalWinnings)) / stats.totalResolved : 0;

  const performanceMetrics = [
    {
      label: 'Participation Rate',
      value: `${participationRate}%`,
      description: 'Trades per market created',
      color: 'var(--color-primary)',
    },
    {
      label: 'Success Rate',
      value: `${successRate}%`,
      description: 'Markets resolved vs traded',
      color: 'var(--color-accent)',
    },
    {
      label: 'Avg Winnings',
              value: `${avgWinnings.toFixed(4)} CELO`,
      description: 'Average winnings per resolved market',
      color: 'var(--color-secondary)',
    },
  ];

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-6" style={{ color: 'var(--color-text-primary)' }}>
        Activity Statistics
      </h2>
      
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statItems.map((stat, index) => (
          <div key={index} className="text-center p-4 rounded-lg transition-all duration-300 hover:transform hover:scale-105" 
               style={{ backgroundColor: 'var(--color-bg-accent)', border: '1px solid var(--color-border-accent)' }}>
            <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center mx-auto mb-3`}>
              <div className="text-white">
                {stat.icon}
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {stat.title}
            </h3>
            <div className={`text-2xl font-bold mb-2 ${stat.textColor}`}>
              {stat.value}
            </div>
            <p className="text-sm text-secondary">
              {stat.description}
            </p>
          </div>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
          Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {performanceMetrics.map((metric, index) => (
            <div key={index} className="p-4 rounded-lg text-center" 
                 style={{ backgroundColor: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-light)' }}>
              <div className="text-2xl font-bold mb-2" style={{ color: metric.color }}>
                {metric.value}
              </div>
              <div className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                {metric.label}
              </div>
              <div className="text-xs text-secondary">
                {metric.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Winnings Summary */}
      <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-accent)', border: '1px solid var(--color-border-accent)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Winnings Summary
            </h3>
            <p className="text-sm text-secondary">
              {getWinningsIcon(stats.totalWinnings)} Your total earnings from prediction markets
            </p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getWinningsColor(stats.totalWinnings)}`}>
              {formatWinnings(stats.totalWinnings)} CELO
            </div>
            <div className="text-sm text-secondary">
              ≈ ${(Number(formatWinnings(stats.totalWinnings)) * 2000).toFixed(2)} USD
            </div>
          </div>
        </div>
      </div>

      {/* Activity Insights */}
      {stats.totalMarkets > 0 && (
        <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-light)' }}>
          <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
            Activity Insights
          </h3>
          <div className="space-y-2 text-sm">
            {stats.totalMarkets > 0 && (
              <p className="text-secondary">
                🎯 You've created <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{stats.totalMarkets}</span> prediction markets
              </p>
            )}
            {stats.totalTrades > 0 && (
              <p className="text-secondary">
                📈 You've made <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{stats.totalTrades}</span> trades across all markets
              </p>
            )}
            {stats.totalResolved > 0 && (
              <p className="text-secondary">
                ✅ <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{stats.totalResolved}</span> markets have been resolved
              </p>
            )}
            {stats.totalWinnings > 0n && (
              <p className="text-secondary">
                🎉 You've earned <span className="font-medium text-green-600">{formatWinnings(stats.totalWinnings)} CELO</span> in total winnings
              </p>
            )}
            {stats.totalWinnings === 0n && stats.totalResolved > 0 && (
              <p className="text-secondary">
                💡 You have <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{stats.totalResolved}</span> resolved markets - check if you can claim winnings!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserActivityStats;

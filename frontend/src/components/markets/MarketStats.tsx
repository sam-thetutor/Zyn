import React from 'react';
import { formatEther } from 'viem';

interface MarketStatsProps {
  stats: {
    total: number;
    active: number;
    resolved: number;
    ended: number;
    totalVolume: bigint;
  };
}

const MarketStats: React.FC<MarketStatsProps> = ({ stats }) => {
  const formattedVolume = formatEther(stats.totalVolume);

  const statItems = [
    {
      label: 'Total Markets',
      value: stats.total,
      color: 'var(--color-primary)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      label: 'Active Markets',
      value: stats.active,
      color: 'var(--color-accent)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: 'Resolved Markets',
      value: stats.resolved,
      color: 'var(--color-secondary)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: 'Total Volume',
              value: `${formattedVolume} CELO`,
      color: 'var(--color-warning)',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
    },
  ];

  return (
    <div className="card mb-6 mt-6 slide-up">
      <h2 className="card-title">Market Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((item, index) => (
          <div key={index} className="p-4 rounded-lg transition-all duration-300 hover:transform hover:scale-105" style={{ backgroundColor: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-light)' }}>
            <div className="flex items-center">
              <div className="p-2 rounded-lg mr-3 text-white" style={{ backgroundColor: item.color }}>
                {item.icon}
              </div>
              <div>
                <div className="text-sm font-medium text-secondary">{item.label}</div>
                <div className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{item.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Additional stats */}
      <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--color-border-light)' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg transition-all duration-300 hover:transform hover:scale-105" style={{ backgroundColor: 'var(--color-bg-accent)', border: '1px solid var(--color-border-accent)' }}>
            <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>{stats.total}</div>
            <div className="text-sm text-secondary">Total Markets Created</div>
          </div>
          <div className="text-center p-4 rounded-lg transition-all duration-300 hover:transform hover:scale-105" style={{ backgroundColor: 'var(--color-bg-accent)', border: '1px solid var(--color-border-accent)' }}>
            <div className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>{stats.active}</div>
            <div className="text-sm text-secondary">Currently Active</div>
          </div>
          <div className="text-center p-4 rounded-lg transition-all duration-300 hover:transform hover:scale-105" style={{ backgroundColor: 'var(--color-bg-accent)', border: '1px solid var(--color-border-accent)' }}>
            <div className="text-2xl font-bold" style={{ color: 'var(--color-secondary)' }}>{stats.resolved}</div>
            <div className="text-sm text-secondary">Successfully Resolved</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketStats;

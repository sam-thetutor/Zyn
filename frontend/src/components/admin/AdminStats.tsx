import React from 'react';
import type { Market } from '../../utils/contracts';
import { MarketStatus } from '../../utils/contracts';
import { formatEther } from 'viem';

interface AdminStatsProps {
  markets: Market[];
}

const AdminStats: React.FC<AdminStatsProps> = ({ markets }) => {
  const totalMarkets = markets.length;
  const activeMarkets = markets.filter(m => m.status === MarketStatus.ACTIVE).length;
  const resolvedMarkets = markets.filter(m => m.status === MarketStatus.RESOLVED).length;
  
  const totalPoolValue = markets.reduce((sum, market) => sum + market.totalPool, 0n);
  const activePoolValue = markets
    .filter(m => m.status === MarketStatus.ACTIVE)
    .reduce((sum, market) => sum + market.totalPool, 0n);
  
  const marketsNeedingResolution = markets.filter(market => 
    market.status === MarketStatus.ACTIVE && 
    market.endTime <= BigInt(Math.floor(Date.now() / 1000))
  ).length;

  const stats = [
    {
      title: 'Total Markets',
      value: totalMarkets.toString(),
      description: 'All markets created',
      color: 'bg-blue-500',
    },
    {
      title: 'Active Markets',
      value: activeMarkets.toString(),
      description: 'Markets currently trading',
      color: 'bg-green-500',
    },
    {
      title: 'Resolved Markets',
      value: resolvedMarkets.toString(),
      description: 'Markets with outcomes',
      color: 'bg-purple-500',
    },
    {
      title: 'Need Resolution',
      value: marketsNeedingResolution.toString(),
      description: 'Markets ready to resolve',
      color: marketsNeedingResolution > 0 ? 'bg-orange-500' : 'bg-gray-500',
    },
    {
      title: 'Total Pool Value',
              value: `${formatEther(totalPoolValue)} CELO`,
      description: 'All market pools combined',
      color: 'bg-indigo-500',
    },
    {
      title: 'Active Pool Value',
              value: `${formatEther(activePoolValue)} CELO`,
      description: 'Value in active markets',
      color: 'bg-teal-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="card">
          <div className="flex items-center">
            <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center mr-4`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{stat.title}</h3>
              <p className="text-3xl font-bold text-gray-700">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminStats;

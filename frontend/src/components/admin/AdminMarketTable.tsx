import React, { useState, useMemo } from 'react';
import type { Market } from '../../utils/contracts';
import { MarketStatus } from '../../utils/contracts';
import { formatEther } from 'viem';

interface AdminMarketTableProps {
  markets: Market[];
  loading: boolean;
  onResolveMarket: (market: Market) => void;
}

const AdminMarketTable: React.FC<AdminMarketTableProps> = ({
  markets,
  loading,
  onResolveMarket,
}) => {
  const [sortBy, setSortBy] = useState<'endTime' | 'totalPool' | 'status'>('endTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<MarketStatus | 'ALL'>('ALL');

  const sortedAndFilteredMarkets = useMemo(() => {
    let filtered = markets;
    
    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = markets.filter(market => market.status === statusFilter);
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      let aValue: bigint | number;
      let bValue: bigint | number;
      
      switch (sortBy) {
        case 'endTime':
          aValue = a.endTime;
          bValue = b.endTime;
          break;
        case 'totalPool':
          aValue = a.totalPool;
          bValue = b.totalPool;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [markets, sortBy, sortOrder, statusFilter]);

  const getStatusBadge = (status: MarketStatus) => {
    switch (status) {
      case MarketStatus.ACTIVE:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>;
      case MarketStatus.RESOLVED:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Resolved</span>;
      case MarketStatus.CANCELLED:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  const canResolve = (market: Market) => {
    const now = BigInt(Math.floor(Date.now() / 1000));
    return market.status === MarketStatus.ACTIVE && market.endTime <= now;
  };

  const formatTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  const handleSort = (field: 'endTime' | 'totalPool' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading markets...</span>
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No markets found.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filters and Sorting */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status Filter</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as MarketStatus | 'ALL')}
            className="form-select"
          >
            <option value="ALL">All Statuses</option>
            <option value={MarketStatus.ACTIVE}>Active</option>
            <option value={MarketStatus.RESOLVED}>Resolved</option>
            <option value={MarketStatus.CANCELLED}>Cancelled</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => handleSort(e.target.value as 'endTime' | 'totalPool' | 'status')}
            className="form-select"
          >
            <option value="endTime">End Time</option>
            <option value="totalPool">Pool Value</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* Markets Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Market ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Question
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                End Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pool Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAndFilteredMarkets.map((market) => (
              <tr key={market.id.toString()} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{market.id.toString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                  {market.question}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                  {market.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {market.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {market.source}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(market.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatTime(market.endTime)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatEther(market.totalPool)} CELO
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {canResolve(market) ? (
                    <button
                      onClick={() => onResolveMarket(market)}
                      className="btn btn-primary btn-sm"
                    >
                      Resolve
                    </button>
                  ) : market.status === MarketStatus.RESOLVED ? (
                    <span className="text-green-600 font-medium">
                      {market.outcome ? 'Yes' : 'No'}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-6 text-sm text-gray-500">
        Showing {sortedAndFilteredMarkets.length} of {markets.length} markets
      </div>
    </div>
  );
};

export default AdminMarketTable;

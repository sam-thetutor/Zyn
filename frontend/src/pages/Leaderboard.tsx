import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useLeaderboard, type Timeframe } from '../hooks/useLeaderboard';
import NotificationContainer from '../components/NotificationContainer';

const Leaderboard: React.FC = () => {
  const { isConnected } = useAccount();
  const [timeframe, setTimeframe] = useState<Timeframe>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'pnl' | 'winRate' | 'volume' | 'markets'>('pnl');
  
  const { 
    leaderboard, 
    userPosition, 
    loading, 
    error, 
    refreshLeaderboard
  } = useLeaderboard(timeframe);

  console.log('leaderboard', leaderboard);
  // Filter and sort leaderboard
  const filteredLeaderboard = leaderboard
    .filter(user => 
      user.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'pnl':
          return Number(b.totalPnL) - Number(a.totalPnL);
        case 'winRate':
          return b.winRate - a.winRate;
        case 'volume':
          return Number(b.totalVolume) - Number(a.totalVolume);
        case 'markets':
          return b.totalMarkets - a.totalMarkets;
        default:
          return a.rank - b.rank;
      }
    });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600';
    if (rank === 2) return 'text-gray-500';
    if (rank === 3) return 'text-amber-600';
    if (rank <= 10) return 'text-blue-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-4">❌ Error loading leaderboard</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={refreshLeaderboard}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <NotificationContainer />
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🏆 Leaderboard</h1>
          <p className="text-lg text-gray-600">
            Top traders ranked by profit & loss
          </p>
        </div>

        {/* User Position (if connected) */}
        {isConnected && userPosition && userPosition.stats && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border-2 border-blue-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Position</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`text-2xl font-bold ${getRankColor(userPosition.rank)}`}>
                  {getRankIcon(userPosition.rank)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {userPosition.stats.address.slice(0, 6)}...{userPosition.stats.address.slice(-4)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {userPosition.stats.totalMarkets} markets • {userPosition.stats.winRateFormatted} win rate
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${userPosition.stats.totalPnL >= 0n ? 'text-green-600' : 'text-red-600'}`}>
                  {userPosition.stats.totalPnL >= 0n ? '+' : ''}{userPosition.stats.totalPnLFormatted} CELO
                </p>
                <p className="text-sm text-gray-600">Total P&L</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Timeframe Selector */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Period
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as Timeframe)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="monthly">This Month</option>
                <option value="weekly">This Week</option>
                <option value="daily">Today</option>
              </select>
            </div>

            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Users
              </label>
              <input
                type="text"
                placeholder="Search by address or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Sort By */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pnl">Total P&L</option>
                <option value="winRate">Win Rate</option>
                <option value="volume">Volume</option>
                <option value="markets">Markets</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Leaderboard ({filteredLeaderboard.length} users)
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total P&L
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Win Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Markets
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeaderboard.map((user) => (
                  <tr 
                    key={user.address}
                    className={`hover:bg-gray-50 ${user.isCurrentUser ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-lg font-bold ${getRankColor(user.rank)}`}>
                        {getRankIcon(user.rank)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            {user.address.slice(2, 4).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {user.username || `${user.address.slice(0, 6)}...${user.address.slice(-4)}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${user.totalPnL >= 0n ? 'text-green-600' : 'text-red-600'}`}>
                        {user.totalPnL >= 0n ? '+' : ''}{user.totalPnLFormatted} CELO
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.winRateFormatted}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.totalMarkets}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.totalVolumeFormatted} CELO
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastActivityFormatted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {filteredLeaderboard.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🏆</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms.' : 'No trading activity yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;

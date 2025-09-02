import React from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useLeaderboard } from '../hooks/useLeaderboard';


const LeaderboardWidget: React.FC = () => {
  const { address } = useAccount();
  const { topUsers, userPosition, loading } = useLeaderboard('all');

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
    return 'text-blue-600';
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">🏆 Top Traders</h3>
        <Link 
          to="/leaderboard" 
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View All →
        </Link>
      </div>

      {/* Top 3 Users */}
      <div className="space-y-3 mb-4">
        {topUsers.slice(0, 3).map((user) => (
          <div 
            key={user.address}
            className={`flex items-center justify-between p-3 rounded-lg ${
              user.isCurrentUser ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`text-lg font-bold ${getRankColor(user.rank)}`}>
                {getRankIcon(user.rank)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {user.username || `${user.address.slice(0, 6)}...${user.address.slice(-4)}`}
                </p>
                <p className="text-xs text-gray-500">
                  {user.winRateFormatted} win rate
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${user.totalPnL >= 0n ? 'text-green-600' : 'text-red-600'}`}>
                {user.totalPnL >= 0n ? '+' : ''}{user.totalPnLFormatted}
              </p>
              <p className="text-xs text-gray-500">CELO</p>
            </div>
          </div>
        ))}
      </div>

      {/* User's Position (if connected) */}
      {address && userPosition && userPosition.stats && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`text-lg font-bold ${getRankColor(userPosition.rank)}`}>
                {getRankIcon(userPosition.rank)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Your Position</p>
                <p className="text-xs text-gray-500">
                  {userPosition.stats.totalMarkets} markets
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${userPosition.stats.totalPnL >= 0n ? 'text-green-600' : 'text-red-600'}`}>
                {userPosition.stats.totalPnL >= 0n ? '+' : ''}{userPosition.stats.totalPnLFormatted}
              </p>
              <p className="text-xs text-gray-500">CELO</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {topUsers.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">🏆</div>
          <p className="text-sm text-gray-600">No trading activity yet</p>
          <p className="text-xs text-gray-500 mt-1">Be the first to trade!</p>
        </div>
      )}
    </div>
  );
};

export default LeaderboardWidget;

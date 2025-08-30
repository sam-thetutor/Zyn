import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useUserActivity } from '../hooks/useUserActivity';
import { useNotificationHelpers } from '../hooks/useNotificationHelpers';
import NotificationContainer from '../components/NotificationContainer';
import { formatEther } from 'viem';
import { Link } from 'react-router-dom';

const Profile: React.FC = () => {
  const { isConnected, address } = useAccount();
  const { 
    activities: userActivities, 
    loading, 
    error, 
    stats,
    refetch: refetchActivities 
  } = useUserActivity();
  const { notifyWalletConnectionFailed } = useNotificationHelpers();

  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'markets'>('overview');

  // Handle wallet not connected
  if (!isConnected || !address) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">
              Wallet Not Connected
            </h2>
            <p className="text-yellow-700">
              Please connect your wallet to view your profile and activities.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'market_created':
        return '📊';
      case 'shares_bought':
        return '💰';
      case 'market_resolved':
        return '🎯';
      case 'claim':
        return '🏆';
      default:
        return '📝';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'market_created':
        return 'bg-blue-100 text-blue-800';
      case 'shares_bought':
        return 'bg-green-100 text-green-800';
      case 'market_resolved':
        return 'bg-purple-100 text-purple-800';
      case 'claim':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {address.slice(2, 4).toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {shortenAddress(address)}
                  </p>
                  <p className="text-sm text-gray-500">Connected Wallet</p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => refetchActivities()}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 mb-6">
          <nav className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', count: null },
              { id: 'activities', label: 'Activities', count: userActivities.length },
              { id: 'markets', label: 'My Markets', count: stats.totalMarkets }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className="ml-2 bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Stats Cards */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Markets Created</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalMarkets}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Trades</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTrades}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Markets Resolved</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalResolved}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <span className="text-2xl">🏆</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Winnings</p>
                  <p className="text-2xl font-bold text-gray-900">{formatEther(stats.totalWinnings)} CELO</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activities</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading activities...</p>
              </div>
            ) : userActivities.length > 0 ? (
              <div className="space-y-4">
                {userActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-2xl mr-4">{getActivityIcon(activity.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {activity.type === 'market_created' && 'Created Market'}
                            {activity.type === 'shares_bought' && 'Bought Shares'}
                            {activity.type === 'market_resolved' && 'Market Resolved'}
                            {activity.type === 'winnings_claimed' && 'Claimed Winnings'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {activity.question}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActivityColor(activity.type)}`}>
                            {activity.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatDate(new Date(activity.timestamp * 1000))}
                          </p>
                        </div>
                      </div>
                      {activity.details.amount && (
                        <p className="text-sm text-gray-600 mt-2">
                          Amount: {formatEther(activity.details.amount)} CELO
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📝</div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Activities Yet</h4>
                <p className="text-gray-600">
                  Start participating in prediction markets to see your activities here.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'markets' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Markets Created</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading markets...</p>
              </div>
            ) : stats.totalMarkets > 0 ? (
              <div className="space-y-4">
                {userActivities
                  .filter(activity => activity.type === 'market_created')
                  .map((activity) => (
                    <div
                      key={activity.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-2">
                            {activity.question}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Created: {formatDate(new Date(activity.timestamp * 1000))}</span>
                            <span>Market ID: {activity.marketId.toString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            Active
                          </span>
                          <Link
                            to={`/market/${activity.marketId.toString()}`}
                            className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📊</div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Markets Created</h4>
                <p className="text-gray-600 mb-4">
                  Create your first prediction market to get started.
                </p>
                <Link
                  to="/create-market"
                  className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Market
                </Link>
              </div>
            )}
          </div>
        )}

        <NotificationContainer />
      </div>
    </div>
  );
};

export default Profile;

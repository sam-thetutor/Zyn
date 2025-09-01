import React, { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { useEventsStore } from '../stores/eventsStore';
// import { useNotificationHelpers } from '../hooks/useNotificationHelpers';
import { useReferral } from '../contexts/ReferralContext';
import ReferralLink from '../components/ReferralLink';
import NotificationContainer from '../components/NotificationContainer';
import { formatEther } from 'viem';
import { Link } from 'react-router-dom';

const Profile: React.FC = () => {
  const { isConnected, address } = useAccount();
  const { referralStats } = useReferral();
  
  // Fetch Celo balance
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address: address,
  });
  
  // Use Zustand store
  const {
    loading: logsLoading,
    fetchAllLogs,
    getUserLogs,
  } = useEventsStore();
  
  // Get user-specific logs
  const userLogs = getUserLogs(address || '');
  console.log('User logs:', userLogs);
  console.log('User address:', address);
  console.log('All logs from store:', useEventsStore.getState().logs.length);

  // Calculate user stats from logs
  const userStats = {
    totalMarkets: userLogs.filter((log: any) => log.eventName === 'MarketCreated').length,
    totalTrades: userLogs.filter((log: any) => log.eventName === 'SharesBought').length,
    totalResolved: userLogs.filter((log: any) => log.eventName === 'MarketResolved').length,
    totalWinnings: userLogs.filter((log: any) => log.eventName === 'WinningsClaimed')
      .reduce((sum: bigint, log: any) => sum + (BigInt(log.args.amount || 0)), 0n),
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'markets' | 'referrals'>('overview');

  // Load logs when component mounts if not already loaded
  useEffect(() => {
    if (isConnected && address && !logsLoading && useEventsStore.getState().logs.length === 0) {
      console.log('Loading logs for profile page...');
      fetchAllLogs();
    }
  }, [isConnected, address, logsLoading, fetchAllLogs]);

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

  const getActivityIcon = (eventName: string) => {
    switch (eventName) {
      case 'MarketCreated':
        return '📊';
      case 'SharesBought':
        return '💰';
      case 'MarketResolved':
        return '🎯';
      case 'WinningsClaimed':
        return '🏆';
      case 'UsernameSet':
      case 'UsernameChanged':
        return '👤';
      case 'ClaimsContractSet':
      case 'CoreContractSet':
        return '⚙️';
      case 'RewardsDisbursed':
        return '💸';
      case 'AdminChanged':
        return '👑';
      default:
        return '📝';
    }
  };

  const getActivityColor = (eventName: string) => {
    switch (eventName) {
      case 'MarketCreated':
        return 'bg-blue-100 text-blue-800';
      case 'SharesBought':
        return 'bg-green-100 text-green-800';
      case 'MarketResolved':
        return 'bg-purple-100 text-purple-800';
      case 'WinningsClaimed':
        return 'bg-yellow-100 text-yellow-800';
      case 'UsernameSet':
      case 'UsernameChanged':
        return 'bg-indigo-100 text-indigo-800';
      case 'ClaimsContractSet':
      case 'CoreContractSet':
        return 'bg-gray-100 text-gray-800';
      case 'RewardsDisbursed':
        return 'bg-emerald-100 text-emerald-800';
      case 'AdminChanged':
        return 'bg-red-100 text-red-800';
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
                onClick={() => fetchAllLogs()}
                disabled={logsLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
              >
                {logsLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 mb-6">
          <nav className="flex space-x-1">
            {[
              { id: 'overview', label: 'Overview', count: null },
              { id: 'activities', label: 'Activities', count: userLogs.length },
              { id: 'markets', label: 'My Markets', count: userStats.totalMarkets },
              { id: 'referrals', label: 'Referrals', count: referralStats.totalReferrals }
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            {/* Balance Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <span className="text-2xl">💎</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Celo Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {balanceLoading ? '...' : balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : '0 CELO'}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Markets Created</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.totalMarkets}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{userStats.totalTrades}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{userStats.totalResolved}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{formatEther(userStats.totalWinnings)} CELO</p>
                </div>
              </div>
            </div>
          </div>
        )}

                {activeTab === 'activities' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activities</h2>
            
            {logsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading activities...</p>
              </div>
            ) : userLogs.length > 0 ? (
              <div className="space-y-4">
                {userLogs.map((log: any, index: number) => (
                  <div
                    key={`${log.transactionHash}-${index}`}
                    className="flex items-center p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-2xl mr-4">{getActivityIcon(log.eventName)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {log.eventName === 'MarketCreated' && 'Created Market'}
                            {log.eventName === 'SharesBought' && 'Bought Shares'}
                            {log.eventName === 'MarketResolved' && 'Market Resolved'}
                            {log.eventName === 'WinningsClaimed' && 'Claimed Winnings'}
                            {log.eventName === 'UsernameSet' && 'Set Username'}
                            {log.eventName === 'UsernameChanged' && 'Changed Username'}
                            {log.eventName === 'ClaimsContractSet' && 'Set Claims Contract'}
                            {log.eventName === 'RewardsDisbursed' && 'Rewards Disbursed'}
                            {log.eventName === 'AdminChanged' && 'Admin Changed'}
                            {log.eventName === 'CoreContractSet' && 'Core Contract Set'}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {log.args.question || log.args.username || `Market #${log.args.marketId?.toString() || 'N/A'}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActivityColor(log.eventName)}`}>
                            {log.eventName.replace(/([A-Z])/g, ' $1').trim().toUpperCase()}
                          </span>
                          <p className="text-sm text-gray-500 mt-1">
                            {log.timestamp ? formatDate(new Date(log.timestamp * 1000)) : 'Unknown'}
                          </p>
                        </div>
                      </div>
                      {log.args.amount !== undefined && log.args.amount !== null && Number(log.args.amount) > 0 && (
                        <p className="text-sm text-gray-600 mt-2">
                          Amount: {typeof log.args.amount === 'bigint' ? formatEther(log.args.amount) : String(log.args.amount)} CELO
                        </p>
                      )}
                      {log.args.side !== undefined && (
                        <p className="text-sm text-gray-600 mt-1">
                          Side: {log.args.side ? 'YES' : 'NO'}
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
            
            {logsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading markets...</p>
              </div>
            ) : userStats.totalMarkets > 0 ? (
              <div className="space-y-4">
                {userLogs
                  .filter((log: any) => log.eventName === 'MarketCreated')
                  .map((log: any, index: number) => (
                    <div
                      key={`${log.transactionHash}-${index}`}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-2">
                            {log.args.question}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Created: {log.timestamp ? formatDate(new Date(log.timestamp * 1000)) : 'Unknown'}</span>
                            <span>Market ID: {log.args.marketId?.toString()}</span>
                            <span>End Time: {log.args.endTime ? new Date(Number(log.args.endTime) * 1000).toLocaleDateString() : 'Unknown'}</span>
                          </div>
                          {log.args.description && (
                            <p className="text-sm text-gray-600 mt-2">{log.args.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            Active
                          </span>
                          <Link
                            to={`/market/${log.args.marketId?.toString()}`}
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

        {activeTab === 'referrals' && (
          <div className="space-y-6">
            {/* Referral Link Component */}
            <ReferralLink />
            
            {/* Referral Statistics */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Referral Statistics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{referralStats.totalReferrals}</div>
                  <p className="text-sm text-gray-600">Total Referrals</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{referralStats.successfulReferrals}</div>
                  <p className="text-sm text-gray-600">Successful</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">{referralStats.pendingReferrals}</div>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">{referralStats.totalRewards}</div>
                  <p className="text-sm text-gray-600">Total Rewards</p>
                </div>
              </div>
              
              {/* How Referrals Work */}
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">How Referrals Work</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🔗</span>
                    </div>
                    <h4 className="font-medium text-blue-900 mb-2">Share Your Link</h4>
                    <p className="text-sm text-blue-700">Copy and share your unique referral link with friends</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">💰</span>
                    </div>
                    <h4 className="font-medium text-green-900 mb-2">Earn Rewards</h4>
                    <p className="text-sm text-green-700">Get rewards when your referrals create markets or trade</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📊</span>
                    </div>
                    <h4 className="font-medium text-purple-900 mb-2">Track Progress</h4>
                    <p className="text-sm text-purple-700">Monitor your referral performance and earnings</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <NotificationContainer />
        {/* <DebugContractLogs /> */}
      </div>
    </div>
  );
};

export default Profile;

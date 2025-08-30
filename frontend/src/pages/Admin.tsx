import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { usePredictionMarket } from '../hooks/usePredictionMarket';
import { useMarkets } from '../hooks/useMarkets';
import { useNotificationHelpers } from '../hooks/useNotificationHelpers';
import NotificationContainer from '../components/NotificationContainer';
import { MarketStatus } from '../utils/contracts';

const ADMIN_ADDRESS = '0x21D654daaB0fe1be0e584980ca7C1a382850939f';

const Admin: React.FC = () => {
  const { isConnected, address } = useAccount();
  const { allMarkets: markets, loading, error, refetchMarkets } = useMarkets();
  const { resolveMarket, isPending } = usePredictionMarket();
  const { notifySuccess, notifyError, notifyInfo } = useNotificationHelpers();
  
  const [resolvingMarketId, setResolvingMarketId] = useState<bigint | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<boolean | null>(null);

  // Check if current user is admin
  const isAdmin = address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  useEffect(() => {
    if (isAdmin) {
      refetchMarkets();
    }
  }, [isAdmin, refetchMarkets]);

  const handleResolveMarket = async (marketId: bigint, outcome: boolean) => {
    if (!isAdmin) {
      notifyError('Only admin can resolve markets');
      return;
    }

    try {
      setResolvingMarketId(marketId);
      await resolveMarket(marketId, outcome);
      notifySuccess(`Market resolved successfully! Outcome: ${outcome ? 'YES' : 'NO'}`);
      
      // Refresh markets after resolution
      setTimeout(() => {
        refetchMarkets();
      }, 2000);
    } catch (err) {
      console.error('Error resolving market:', err);
      notifyError('Failed to resolve market. Please try again.');
    } finally {
      setResolvingMarketId(null);
      setSelectedOutcome(null);
    }
  };

  const getStatusText = (status: MarketStatus, endTime: bigint) => {
    const now = Math.floor(Date.now() / 1000);
    const isExpired = Number(endTime) <= now;
    
    if (status === MarketStatus.RESOLVED) return 'Resolved';
    if (status === MarketStatus.CANCELLED) return 'Cancelled';
    if (isExpired) return 'Expired';
    return 'Active';
  };

  const getStatusColor = (status: MarketStatus, endTime: bigint) => {
    const now = Math.floor(Date.now() / 1000);
    const isExpired = Number(endTime) <= now;
    
    if (status === MarketStatus.RESOLVED) return 'bg-green-100 text-green-800';
    if (status === MarketStatus.CANCELLED) return 'bg-red-100 text-red-800';
    if (isExpired) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

  const formatTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  const formatPool = (amount: bigint) => {
    return Number(amount) / 1e18; // Assuming 18 decimals
  };

  if (!isConnected) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">
              Wallet Not Connected
            </h2>
            <p className="text-yellow-700">
              Please connect your wallet to access the admin panel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Access Denied
            </h2>
            <p className="text-red-700">
              Only the admin can access this page.
            </p>
            <p className="text-sm text-red-600 mt-2">
              Admin address: {ADMIN_ADDRESS}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Loading Markets...
          </h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Error Loading Markets
            </h2>
            <p className="text-red-700">{error}</p>
            <button
              onClick={refetchMarkets}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const expiredMarkets = markets.filter(market => {
    const now = Math.floor(Date.now() / 1000);
    return market.status === MarketStatus.ACTIVE && Number(market.endTime) <= now;
  });

  const activeMarkets = markets.filter(market => 
    market.status === MarketStatus.ACTIVE && Number(market.endTime) > Math.floor(Date.now() / 1000)
  );

  const resolvedMarkets = markets.filter(market => market.status === MarketStatus.RESOLVED);

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Panel</h1>
          <p className="text-lg text-gray-600">
            Manage prediction markets and resolve expired ones
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{markets.length}</div>
            <div className="text-sm text-gray-600">Total Markets</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-green-600">{activeMarkets.length}</div>
            <div className="text-sm text-gray-600">Active Markets</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-yellow-600">{expiredMarkets.length}</div>
            <div className="text-sm text-gray-600">Expired Markets</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
            <div className="text-2xl font-bold text-purple-600">{resolvedMarkets.length}</div>
            <div className="text-sm text-gray-600">Resolved Markets</div>
          </div>
        </div>

        {/* Expired Markets Section */}
        {expiredMarkets.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Expired Markets - Need Resolution
            </h2>
            <div className="space-y-4">
              {expiredMarkets.map((market) => (
                <div key={market.id.toString()} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-2">{market.question}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Category:</span> {market.category}
                        </div>
                        <div>
                          <span className="font-medium">Ended:</span> {formatTime(market.endTime)}
                        </div>
                        <div>
                          <span className="font-medium">Total Pool:</span> {formatPool(market.totalPool)} ETH
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => {
                          setSelectedOutcome(true);
                          handleResolveMarket(market.id, true);
                        }}
                        disabled={isPending || resolvingMarketId === market.id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {resolvingMarketId === market.id && selectedOutcome === true ? 'Resolving...' : 'Resolve YES'}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOutcome(false);
                          handleResolveMarket(market.id, false);
                        }}
                        disabled={isPending || resolvingMarketId === market.id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {resolvingMarketId === market.id && selectedOutcome === false ? 'Resolving...' : 'Resolve NO'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Markets Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">All Markets</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Market
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Pool
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {markets.map((market) => (
                  <tr key={market.id.toString()}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {market.question}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {market.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {market.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(market.status, market.endTime)}`}>
                        {getStatusText(market.status, market.endTime)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(market.endTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPool(market.totalPool)} ETH
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {market.status === MarketStatus.ACTIVE && Number(market.endTime) <= Math.floor(Date.now() / 1000) ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResolveMarket(market.id, true)}
                            disabled={isPending || resolvingMarketId === market.id}
                            className="text-green-600 hover:text-green-900 disabled:text-green-400 disabled:cursor-not-allowed"
                          >
                            Resolve YES
                          </button>
                          <button
                            onClick={() => handleResolveMarket(market.id, false)}
                            disabled={isPending || resolvingMarketId === market.id}
                            className="text-red-600 hover:text-red-900 disabled:text-red-400 disabled:cursor-not-allowed"
                          >
                            Resolve NO
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400">No actions</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <NotificationContainer />
    </div>
  );
};

export default Admin;

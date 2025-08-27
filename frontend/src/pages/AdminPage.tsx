import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { ADMIN_ADDRESS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';
import { Market, MarketStatus } from '../utils/contracts';
import { useAdminMarkets } from '../hooks/useAdminMarkets';
import { useMarketResolution } from '../hooks/useMarketResolution';
import AdminMarketTable from '../components/admin/AdminMarketTable';
import AdminStats from '../components/admin/AdminStats';
import MarketResolutionModal from '../components/admin/MarketResolutionModal';

const AdminPage: React.FC = () => {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  
  const {
    markets: adminMarkets,
    loading: marketsLoading,
    error: marketsError,
    refetchMarkets
  } = useAdminMarkets();
  
  const {
    resolveMarket,
    resolving,
    resolveError,
    resolveSuccess
  } = useMarketResolution();

  // Check if connected wallet is admin
  const isAdmin = isConnected && address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  useEffect(() => {
    if (!isConnected) {
      navigate('/');
      return;
    }

    if (isConnected && !isAdmin) {
      navigate('/');
      return;
    }
  }, [isConnected, isAdmin, navigate]);

  useEffect(() => {
    if (resolveSuccess) {
      setShowResolutionModal(false);
      setSelectedMarket(null);
      refetchMarkets();
    }
  }, [resolveSuccess, refetchMarkets]);

  const handleResolveMarket = (market: Market) => {
    setSelectedMarket(market);
    setShowResolutionModal(true);
  };

  const handleConfirmResolution = async (marketId: bigint, outcome: boolean) => {
    if (!selectedMarket) return;
    
    try {
      await resolveMarket(marketId, outcome);
    } catch (error) {
      console.error('Failed to resolve market:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8 mt-8">
        <div className="card">
          <h1 className="text-2xl font-bold text-center mb-4">
            {ERROR_MESSAGES.WALLET_NOT_CONNECTED}
          </h1>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8 mt-8">
        <div className="card">
          <h1 className="text-2xl font-bold text-center mb-4">
            {ERROR_MESSAGES.ADMIN_ACCESS_REQUIRED}
          </h1>
          <p className="text-center text-gray-600">
            Only the admin can access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-2">Admin Dashboard</h1>
        <p className="text-center text-gray-600">
          Manage prediction markets and resolve outcomes
        </p>
        <div className="text-center mt-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            Admin: {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
        </div>
      </div>

      {/* Admin Stats */}
      <AdminStats markets={adminMarkets} />

      {/* Markets Management */}
      <div className="card mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Markets Management</h2>
          <button
            onClick={() => refetchMarkets()}
            disabled={marketsLoading}
            className="btn btn-primary"
          >
            {marketsLoading ? 'Refreshing...' : 'Refresh Markets'}
          </button>
        </div>

        {marketsError && (
          <div className="alert alert-error mb-4">
            <span>Error loading markets: {marketsError.message}</span>
          </div>
        )}

        {resolveError && (
          <div className="alert alert-error mb-4">
            <span>Error resolving market: {resolveError.message}</span>
          </div>
        )}

        <AdminMarketTable
          markets={adminMarkets}
          loading={marketsLoading}
          onResolveMarket={handleResolveMarket}
        />
      </div>

      {/* Resolution Modal */}
      {showResolutionModal && selectedMarket && (
        <MarketResolutionModal
          market={selectedMarket}
          isOpen={showResolutionModal}
          onClose={() => setShowResolutionModal(false)}
          onConfirm={handleConfirmResolution}
          loading={resolving}
        />
      )}
    </div>
  );
};

export default AdminPage;

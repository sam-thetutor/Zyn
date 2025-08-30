import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useNavigate } from 'react-router-dom';
import { ADMIN_ADDRESS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants';
import type { Market } from '../utils/contracts';
import { useAdminMarkets } from '../hooks/useAdminMarkets';
import { useMarketResolution } from '../hooks/useMarketResolution';
import { useContractAddress } from '../hooks/useContractAddress';
import AdminMarketTable from '../components/admin/AdminMarketTable';
import AdminStats from '../components/admin/AdminStats';
import MarketResolutionModal from '../components/admin/MarketResolutionModal';

const AdminPage: React.FC = () => {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  
  // Get contract information
  const { 
    coreContractAddress, 
    coreContractABI, 
    isSupportedNetwork,
    currentNetwork 
  } = useContractAddress();
  
  const {
    markets: adminMarkets,
    loading: marketsLoading,
    error: marketsError,
    refetchMarkets
  } = useAdminMarkets();
  
  const {
    resolveMarket,
    loading: resolving,
    error: resolveError,
    canClaim: resolveSuccess
  } = useMarketResolution(selectedMarket?.id || 0n);

  // Check if connected wallet is admin
  const isAdmin = isConnected && address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  // Debug network detection
  useEffect(() => {
    console.log('🔍 Admin Page Network Detection:');
    console.log('  - isConnected:', isConnected);
    console.log('  - isAdmin:', isAdmin);
    console.log('  - coreContractAddress:', coreContractAddress);
    console.log('  - coreContractABI:', coreContractABI);
    console.log('  - isSupportedNetwork:', isSupportedNetwork);
    console.log('  - currentNetwork:', currentNetwork);
  }, [isConnected, isAdmin, coreContractAddress, coreContractABI, isSupportedNetwork, currentNetwork]);

  useEffect(() => {
    if (!isConnected) {
      navigate('/');
      return;
    }

    if (isConnected && !isAdmin) {
      navigate('/');
      return;
    }

    // Check if network is supported
    if (isConnected && isAdmin && !isSupportedNetwork) {
      console.log('❌ Admin connected but network not supported');
    }
  }, [isConnected, isAdmin, isSupportedNetwork, navigate]);

  useEffect(() => {
    if (resolveSuccess) {
      console.log('✅ Market resolved successfully, refreshing markets...');
      setShowResolutionModal(false);
      setSelectedMarket(null);
      refetchMarkets();
      
      // Show success message
      setTimeout(() => {
        // You can add a toast notification here if you have one
        console.log('🎉 Market resolution completed successfully!');
      }, 1000);
    }
  }, [resolveSuccess, refetchMarkets]);

  const handleResolveMarket = (market: Market) => {
    console.log('🔍 Resolving market:', market);
    setSelectedMarket(market);
    setShowResolutionModal(true);
  };

  const handleConfirmResolution = async (marketId: bigint, outcome: boolean) => {
    if (!selectedMarket) {
      console.error('❌ No market selected for resolution');
      return;
    }
    
    if (!isSupportedNetwork || !coreContractAddress || !coreContractABI) {
      console.error('❌ Contract not available for resolution');
      return;
    }
    
    console.log('🚀 Resolving market:', marketId, 'with outcome:', outcome);
    
    try {
      await resolveMarket(outcome);
      console.log('✅ Market resolution initiated successfully');
    } catch (error) {
      console.error('❌ Failed to resolve market:', error);
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
        
        {/* Network Status */}
        <div className="text-center mt-4">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium" 
               style={{ 
                 backgroundColor: isSupportedNetwork ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                 color: isSupportedNetwork ? 'rgb(22, 163, 74)' : 'rgb(185, 28, 28)'
               }}>
            Network: {currentNetwork || 'Unknown'} 
            {isSupportedNetwork ? ' ✅' : ' ❌'}
          </div>
        </div>
      </div>

      {/* Admin Stats */}
      <AdminStats markets={adminMarkets} />

      {/* Network Warning */}
      {isConnected && isAdmin && !isSupportedNetwork && (
        <div className="card mt-6" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--color-danger)' }}>
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="font-medium" style={{ color: 'var(--color-danger)' }}>
                Network Not Supported
              </p>
              <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
                Please connect to Celo Alfajores or Base Mainnet to manage markets.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contract Warning */}
      {isConnected && isAdmin && isSupportedNetwork && (!coreContractAddress || !coreContractABI) && (
        <div className="card mt-6" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'var(--color-warning)' }}>
          <div className="flex items-center">
            <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="font-medium" style={{ color: 'var(--color-warning)' }}>
                Contract Not Found
              </p>
              <p className="text-sm" style={{ color: 'var(--color-warning)' }}>
                Smart contracts not found on current network. Please check your connection.
              </p>
            </div>
          </div>
        </div>
      )}

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
            <span>Error resolving market: {resolveError}</span>
          </div>
        )}

        <AdminMarketTable
          markets={adminMarkets}
          loading={marketsLoading || resolving}
          onResolveMarket={handleResolveMarket}
        />
      </div>

      {/* Admin Actions */}
      <div className="card mt-8">
        <h2 className="text-2xl font-bold mb-6">Admin Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Refresh Markets */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Refresh Markets</h3>
            <p className="text-sm text-gray-600 mb-3">Update market data from blockchain</p>
            <button
              onClick={() => refetchMarkets()}
              disabled={marketsLoading}
              className="btn btn-primary w-full"
            >
              {marketsLoading ? 'Refreshing...' : 'Refresh Markets'}
            </button>
          </div>
          
          {/* Network Info */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Network Status</h3>
            <p className="text-sm text-gray-600 mb-3">Current blockchain network</p>
            <div className="text-center">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isSupportedNetwork 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {currentNetwork || 'Unknown'} {isSupportedNetwork ? '✅' : '❌'}
              </span>
            </div>
          </div>
          
          {/* Contract Status */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Contract Status</h3>
            <p className="text-sm text-gray-600 mb-3">Smart contract availability</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Core Contract:</span>
                <span className={coreContractAddress ? 'text-green-600' : 'text-red-600'}>
                  {coreContractAddress ? '✅ Available' : '❌ Not Found'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>ABI:</span>
                <span className={coreContractABI ? 'text-green-600' : 'text-red-600'}>
                  {coreContractABI ? '✅ Available' : '❌ Not Found'}
                </span>
              </div>
            </div>
          </div>
        </div>
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

import React from 'react';
import { useAccount } from 'wagmi';
import { usePredictionMarketCore } from '../hooks/usePredictionMarketCore';
import { useStats } from '../hooks/useStats';

const DebugStats: React.FC = () => {
  const { address, chainId, isConnected } = useAccount();
  const { 
    totalMarkets, 
    marketCreationFee, 
    refetchTotalMarkets, 
    isLoadingMarkets, 
    totalMarketsError 
  } = usePredictionMarketCore();
  const { stats, loading: statsLoading, error: statsError } = useStats();

  return (
    <div className="p-4 bg-gray-100 rounded-lg m-4">
      <h3 className="text-lg font-bold mb-4">🔍 Debug Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-2">Wallet Status:</h4>
          <ul className="text-sm space-y-1">
            <li>Connected: {isConnected ? '✅ Yes' : '❌ No'}</li>
            <li>Address: {address || 'None'}</li>
            <li>Chain ID: {chainId || 'None'}</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Contract Data:</h4>
          <ul className="text-sm space-y-1">
            <li>Total Markets: {isLoadingMarkets ? 'Loading...' : totalMarkets?.toString() || 'Error'}</li>
            <li>Creation Fee: {marketCreationFee || 'Loading...'}</li>
            <li>Loading: {isLoadingMarkets ? '⏳ Yes' : '✅ No'}</li>
            <li>Error: {totalMarketsError?.message || 'None'}</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Stats Hook:</h4>
          <ul className="text-sm space-y-1">
            <li>Loading: {statsLoading ? '⏳ Yes' : '✅ No'}</li>
            <li>Error: {statsError || 'None'}</li>
            <li>Total Markets: {stats.totalMarkets}</li>
            <li>Active Traders: {stats.activeTraders}</li>
            <li>Total Volume: {stats.totalVolume}</li>
            <li>Resolved Markets: {stats.resolvedMarkets}</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Actions:</h4>
          <button 
            onClick={() => refetchTotalMarkets()}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Refetch Markets
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugStats;

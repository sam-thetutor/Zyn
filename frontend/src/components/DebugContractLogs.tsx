import React, { useState } from 'react';
import { fetchAndLogAllContractData, fetchUserActivity, fetchMarketActivity } from '../utils/fetchContractLogs';

const DebugContractLogs: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [marketId, setMarketId] = useState('');

  const handleFetchAllLogs = async () => {
    setIsLoading(true);
    try {
      console.log('🚀 Starting to fetch all contract logs...');
      await fetchAndLogAllContractData();
      console.log('✅ All logs fetched successfully!');
    } catch (error) {
      console.error('❌ Error fetching logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchUserLogs = async () => {
    if (!userAddress) {
      alert('Please enter a user address');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log(`👤 Fetching logs for user: ${userAddress}`);
      const userLogs = await fetchUserActivity(userAddress);
      console.log('✅ User logs fetched successfully!');
      console.log('User logs:', userLogs);
    } catch (error) {
      console.error('❌ Error fetching user logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchMarketLogs = async () => {
    if (!marketId) {
      alert('Please enter a market ID');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log(`📊 Fetching logs for market: ${marketId}`);
      const marketLogs = await fetchMarketActivity(marketId);
      console.log('✅ Market logs fetched successfully!');
      console.log('Market logs:', marketLogs);
    } catch (error) {
      console.error('❌ Error fetching market logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 z-50">
      <h3 className="text-lg font-semibold mb-4">🔧 Debug Contract Logs</h3>
      
      <div className="space-y-4">
        {/* Fetch All Logs */}
        <div>
          <button
            onClick={handleFetchAllLogs}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {isLoading ? 'Fetching...' : 'Fetch All Contract Logs'}
          </button>
        </div>

        {/* Fetch User Logs */}
        <div>
          <input
            type="text"
            placeholder="Enter user address (0x...)"
            value={userAddress}
            onChange={(e) => setUserAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
          />
          <button
            onClick={handleFetchUserLogs}
            disabled={isLoading || !userAddress}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
          >
            {isLoading ? 'Fetching...' : 'Fetch User Logs'}
          </button>
        </div>

        {/* Fetch Market Logs */}
        <div>
          <input
            type="text"
            placeholder="Enter market ID"
            value={marketId}
            onChange={(e) => setMarketId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
          />
          <button
            onClick={handleFetchMarketLogs}
            disabled={isLoading || !marketId}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
          >
            {isLoading ? 'Fetching...' : 'Fetch Market Logs'}
          </button>
        </div>

        <div className="text-xs text-gray-600">
          💡 Check the browser console for detailed logs
        </div>
      </div>
    </div>
  );
};

export default DebugContractLogs;

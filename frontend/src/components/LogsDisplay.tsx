import React from 'react';
import { useEventsStore } from '../stores/eventsStore';

const LogsDisplay: React.FC = () => {
  const {
    logs,
    loading,
    error,
    fetchAllLogs,
    marketCreatedLogs,
    sharesBoughtLogs,
    celoLogs,
  } = useEventsStore();

  if (loading) {
    return <div>Loading logs...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Contract Logs</h2>
      
      <div className="mb-4">
        <button 
          onClick={fetchAllLogs}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Refresh Logs
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Summary</h3>
          <p>Total Logs: {logs.length}</p>
          <p>Markets Created: {marketCreatedLogs.length}</p>
          <p>Shares Bought: {sharesBoughtLogs.length}</p>
          <p>Celo Logs: {celoLogs.length}</p>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold mb-2">Recent Events</h3>
          {logs.slice(0, 5).map((log: any, index: number) => (
            <div key={index} className="text-sm mb-2">
              <div className="font-medium">{log.eventName}</div>
              <div className="text-gray-600">
                {log.timestamp ? new Date(log.timestamp * 1000).toLocaleString() : 'Unknown'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-semibold mb-2">All Logs</h3>
        <div className="space-y-2">
          {logs.map((log: any, index: number) => (
            <div key={index} className="border p-3 rounded">
              <div className="flex justify-between">
                <span className="font-medium">{log.eventName}</span>
                <span className="text-sm text-gray-500">{log.network}</span>
              </div>
              <div className="text-sm text-gray-600">
                {log.timestamp ? new Date(log.timestamp * 1000).toLocaleString() : 'Unknown'}
              </div>
              <div className="text-xs text-gray-500">
                TX: {log.transactionHash.slice(0, 10)}...
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LogsDisplay;

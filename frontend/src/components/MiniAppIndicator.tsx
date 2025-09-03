import React from 'react';
import { useMiniApp } from '../contexts/MiniAppContext';

export const MiniAppIndicator: React.FC = () => {
  const { isMiniApp, farcasterUser, isReady } = useMiniApp();

  if (!isMiniApp || !isReady) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-purple-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2 text-sm">
        <span>📱</span>
        <span>Farcaster Mini App</span>
        {farcasterUser && (
          <span className="text-purple-200">
            • @{farcasterUser.username || farcasterUser.fid}
          </span>
        )}
      </div>
    </div>
  );
};

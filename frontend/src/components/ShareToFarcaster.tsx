import React, { useState } from 'react';
import { useMiniApp } from '../contexts/MiniAppContext';

interface ShareToFarcasterProps {
  marketId?: string;
  marketQuestion?: string;
  className?: string;
}

export const ShareToFarcaster: React.FC<ShareToFarcasterProps> = ({ 
  marketId, 
  marketQuestion, 
  className = '' 
}) => {
  const { isMiniApp, composeCast, triggerHaptic } = useMiniApp();
  const [isSharing, setIsSharing] = useState(false);

  if (!isMiniApp) {
    return null;
  }

  const handleShare = async () => {
    if (isSharing) return;

    try {
      setIsSharing(true);
      await triggerHaptic('light');

      const shareText = marketQuestion 
        ? `Check out this prediction market: "${marketQuestion}"`
        : 'Check out this prediction market on Zyn!';
      
      const shareUrl = marketId 
        ? `https://zynp.vercel.app/market/${marketId}`
        : 'https://zynp.vercel.app';

      await composeCast(shareText, [shareUrl]);
      
      await triggerHaptic('medium');
    } catch (error) {
      console.error('Failed to share to Farcaster:', error);
      await triggerHaptic('heavy');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className={`flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors ${className}`}
    >
      <span>📱</span>
      <span>{isSharing ? 'Sharing...' : 'Share to Farcaster'}</span>
    </button>
  );
};

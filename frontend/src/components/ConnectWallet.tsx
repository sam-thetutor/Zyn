import React from 'react';
import { useConnect, useAccount } from 'wagmi';

const ConnectWallet: React.FC = () => {
  const { connect, connectors, isPending } = useConnect();
  const { isConnected } = useAccount();

  if (isConnected) {
    return null;
  }

  const handleConnect = () => {
    // Try MetaMask first, fallback to injected
    const metaMaskConnector = connectors.find(c => c.name === 'MetaMask');
    const injectedConnector = connectors.find(c => c.name === 'Injected');
    
    if (metaMaskConnector) {
      connect({ connector: metaMaskConnector });
    } else if (injectedConnector) {
      connect({ connector: injectedConnector });
    }
  };

  return (
    <div className="connect-wallet">
      <button
        onClick={handleConnect}
        disabled={isPending}
        className="btn-primary"
      >
        {isPending ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </div>
  );
};

export default ConnectWallet;
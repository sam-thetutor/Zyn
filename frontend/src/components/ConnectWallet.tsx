import React, { useEffect } from 'react';
import { useConnect, useAccount } from 'wagmi';
import { useMiniApp } from '../hooks/useMiniApp';

const ConnectWallet: React.FC = () => {
  const { connect, connectors, isPending } = useConnect();
  const { isConnected } = useAccount();
  const { isMiniApp, isWalletConnected, connectEmbeddedWallet } = useMiniApp();

  // Auto-connect to embedded wallet when in Mini App
  useEffect(() => {
    const autoConnect = async () => {
      console.log('ConnectWallet: Mini App state:', { isMiniApp, isConnected, isWalletConnected });
      console.log('Available connectors:', connectors.map(c => ({ name: c.name, ready: c.ready, id: c.id })));
      
      if (isMiniApp && !isConnected && isWalletConnected) {
        console.log('Auto-connecting to embedded wallet...');
        const address = await connectEmbeddedWallet();
        if (address) {
          console.log('Auto-connected to embedded wallet:', address);
          // Now try to connect via Wagmi if needed
          const farcasterConnector = connectors.find(c => c.name.includes('Farcaster') || c.name.includes('Mini App'));
          if (farcasterConnector) {
            console.log('Auto-connecting via Wagmi connector...');
            connect({ connector: farcasterConnector });
          }
        }
      }
    };
    
    autoConnect();
  }, [isMiniApp, isConnected, isWalletConnected, connect, connectors, connectEmbeddedWallet]);

  if (isConnected) {
    return null;
  }

  const handleConnect = async () => {
    console.log('ConnectWallet: handleConnect called', { isMiniApp, connectors: connectors.map(c => ({ name: c.name, ready: c.ready, id: c.id })) });
    
    if (isMiniApp) {
      // In Mini App, try to connect to embedded wallet directly
      console.log('Attempting to connect to embedded wallet...');
      const address = await connectEmbeddedWallet();
      if (address) {
        console.log('Successfully connected to embedded wallet:', address);
        // Now try to connect via Wagmi if needed
        const farcasterConnector = connectors.find(c => c.name.includes('Farcaster') || c.name.includes('Mini App'));
        if (farcasterConnector) {
          console.log('Connecting via Wagmi connector...');
          connect({ connector: farcasterConnector });
        }
      } else {
        console.error('Failed to connect to embedded wallet');
      }
    } else {
      // Fallback for non-Mini App environments
      const metaMaskConnector = connectors.find(c => c.name === 'MetaMask');
      const injectedConnector = connectors.find(c => c.name === 'Injected');
      
      if (metaMaskConnector) {
        connect({ connector: metaMaskConnector });
      } else if (injectedConnector) {
        connect({ connector: injectedConnector });
      }
    }
  };

  return (
    <div className="connect-wallet">
      <button
        onClick={handleConnect}
        disabled={isPending}
        className="btn-primary"
      >
        {isPending ? 'Connecting...' : isMiniApp ? 'Connect Farcaster Wallet' : 'Connect Wallet'}
      </button>
    </div>
  );
};

export default ConnectWallet;
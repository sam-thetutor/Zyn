import { useMemo, useEffect, useState } from "react";
import { celo } from "viem/chains";
import { createPublicClient } from "viem";
import { http, custom } from "viem";
import { createWalletClient } from "viem";
import { sdk } from '@farcaster/miniapp-sdk';

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

const useViemHook = () => {
  const [ethereumProvider, setEthereumProvider] = useState<any>(null);
  const [isMiniApp, setIsMiniApp] = useState(false);

  useEffect(() => {
    const initProvider = async () => {
      try {
        // Check if we're in a Mini App environment
        const miniAppCheck = await sdk.isInMiniApp();
        setIsMiniApp(miniAppCheck);

        if (miniAppCheck) {
          // Use Farcaster embedded wallet provider
          const wallet = await sdk.wallet;
          if (wallet && wallet.getEthereumProvider) {
            const provider = await wallet.getEthereumProvider();
            setEthereumProvider(provider);
            console.log('Using Farcaster embedded wallet provider');
          }
        } else {
          // Use regular window.ethereum for web
          setEthereumProvider(window.ethereum);
          console.log('Using window.ethereum provider');
        }
      } catch (error) {
        console.error('Error initializing wallet provider:', error);
        // Fallback to window.ethereum
        setEthereumProvider(window.ethereum);
      }
    };

    initProvider();
  }, []);

  const publicClient = useMemo(() => createPublicClient({
    chain: celo,
    transport: http("https://forno.celo.org"),
  }), []);

  const walletClient = useMemo(() => {
    if (!ethereumProvider) {
      return null;
    }
    
    return createWalletClient({
      chain: celo,
      transport: custom(ethereumProvider),
    });
  }, [ethereumProvider]);

  return {
    publicClient,
    walletClient,
    isMiniApp,
  };
};

export default useViemHook;

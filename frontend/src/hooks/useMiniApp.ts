import { useEffect, useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export const useMiniApp = () => {
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [context, setContext] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  useEffect(() => {
    const initMiniApp = async () => {
      try {
        // Check if we're in a Mini App environment
        const miniAppCheck = await sdk.isInMiniApp();
        setIsMiniApp(miniAppCheck);

        if (miniAppCheck) {
          // Get context information
          const appContext = await sdk.context;
          setContext(appContext);
          console.log('Mini App context:', appContext);

          // Hide splash screen when ready
          await sdk.actions.ready();
          setIsReady(true);

          // Enable back navigation
          await sdk.back.enableWebNavigation();

          // Connect to embedded wallet
          try {
            console.log('Attempting to connect to embedded wallet...');
            const wallet = await sdk.wallet;
            console.log('Wallet object:', wallet);
            
            if (wallet && wallet.ethProvider) {
              console.log('EthProvider found, requesting accounts...');
              const accounts = await wallet.ethProvider.request({ method: 'eth_accounts' });
              console.log('Accounts received:', accounts);
              
              if (accounts && accounts.length > 0) {
                setWalletAddress(accounts[0]);
                setIsWalletConnected(true);
                console.log('Embedded wallet connected:', accounts[0]);
              } else {
                console.log('No accounts found in embedded wallet');
              }
            } else {
              console.log('Wallet or ethProvider not available');
            }
          } catch (error) {
            console.error('Error connecting to embedded wallet:', error);
          }

          console.log('Mini App initialized successfully');
        }
      } catch (error) {
        console.error('Error initializing Mini App:', error);
      }
    };

    initMiniApp();
  }, []);

  const composeCast = async (text: string, embeds?: string[]) => {
    if (!isMiniApp) return;

    try {
      const result = await sdk.actions.composeCast({
        text,
        embeds: embeds && embeds.length > 0 ? embeds.slice(0, 2) as [string] | [string, string] : undefined
      });
      return result;
    } catch (error) {
      console.error('Error composing cast:', error);
      throw error;
    }
  };

  const addToFarcaster = async () => {
    if (!isMiniApp) return;

    try {
      await sdk.actions.addMiniApp();
    } catch (error) {
      console.error('Error adding to Farcaster:', error);
      throw error;
    }
  };

  const connectEmbeddedWallet = async () => {
    if (!isMiniApp) return null;

    try {
      console.log('Explicitly connecting to embedded wallet...');
      const wallet = await sdk.wallet;
      if (wallet && wallet.ethProvider) {
        // Request account access
        const accounts = await wallet.ethProvider.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsWalletConnected(true);
          console.log('Embedded wallet explicitly connected:', accounts[0]);
          return accounts[0];
        }
      }
      return null;
    } catch (error) {
      console.error('Error explicitly connecting to embedded wallet:', error);
      return null;
    }
  };

  const triggerHaptic = async (type: 'light' | 'medium' | 'heavy' | 'soft' | 'rigid' = 'medium') => {
    if (!isMiniApp) return;

    try {
      await sdk.haptics.impactOccurred(type);
    } catch (error) {
      console.error('Error triggering haptic:', error);
    }
  };

  const triggerNotificationHaptic = async (type: 'success' | 'warning' | 'error' = 'success') => {
    if (!isMiniApp) return;

    try {
      await sdk.haptics.notificationOccurred(type);
    } catch (error) {
      console.error('Error triggering notification haptic:', error);
    }
  };

  return {
    isMiniApp,
    isReady,
    context,
    walletAddress,
    isWalletConnected,
    composeCast,
    addToFarcaster,
    connectEmbeddedWallet,
    triggerHaptic,
    triggerNotificationHaptic
  };
};

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { useAccount, useConnect } from 'wagmi';

interface MiniAppContextType {
  // Mini App state
  isMiniApp: boolean;
  isReady: boolean;
  context: any;
  
  // Wallet state
  isWalletConnected: boolean;
  walletAddress: string | null;
  farcasterUser: any;
  
  // Actions
  connectEmbeddedWallet: () => Promise<string | null>;
  composeCast: (text: string, embeds?: string[]) => Promise<any>;
  addToFarcaster: () => Promise<void>;
  triggerHaptic: (type?: 'light' | 'medium' | 'heavy' | 'soft' | 'rigid') => Promise<void>;
  triggerNotificationHaptic: (type?: 'success' | 'warning' | 'error') => Promise<void>;
  
  // Loading states
  isInitializing: boolean;
}

const MiniAppContext = createContext<MiniAppContextType | undefined>(undefined);

interface MiniAppProviderProps {
  children: ReactNode;
}

export const MiniAppProvider: React.FC<MiniAppProviderProps> = ({ children }) => {
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [context, setContext] = useState<any>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [farcasterUser, setFarcasterUser] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();

  useEffect(() => {
    const initMiniApp = async () => {
      try {
        setIsInitializing(true);
        
        // Check if we're in a Mini App environment
        const miniAppCheck = await sdk.isInMiniApp();
        setIsMiniApp(miniAppCheck);
        console.log('Mini App check result:', miniAppCheck);

        if (miniAppCheck) {
          // Get context information
          const appContext = await sdk.context;
          setContext(appContext);
          setFarcasterUser(appContext.user);
          console.log('Mini App context:', appContext);

          // Hide splash screen when ready
          await sdk.actions.ready();
          setIsReady(true);

          // Enable back navigation
          try {
            await sdk.back.enableWebNavigation();
          } catch (error) {
            console.log('Back navigation not supported:', error);
          }

          // Auto-connect to embedded wallet
          await connectEmbeddedWallet();

          console.log('Mini App initialized successfully');
        } else {
          // Not in Mini App, try to connect with regular wallet
          if (connectors.length > 0 && !isConnected) {
            try {
              await connect({ connector: connectors[0] });
            } catch (error) {
              console.log('Failed to connect regular wallet:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing Mini App:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initMiniApp();
  }, []);

  // Update wallet state when wagmi account changes
  useEffect(() => {
    if (isConnected && address) {
      setWalletAddress(address);
      setIsWalletConnected(true);
    } else {
      setWalletAddress(null);
      setIsWalletConnected(false);
    }
  }, [isConnected, address]);

  const connectEmbeddedWallet = async (): Promise<string | null> => {
    if (!isMiniApp) return null;

    try {
      console.log('Connecting to embedded wallet...');
      const wallet = await sdk.wallet;
      
      if (wallet && wallet.getEthereumProvider) {
        const provider = await wallet.getEthereumProvider();
        console.log('Ethereum provider:', provider);
        
        if (provider) {
          // Request account access
          const accounts = await provider.request({ method: 'eth_requestAccounts' });
          console.log('Accounts received:', accounts);
          
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsWalletConnected(true);
            console.log('Embedded wallet connected:', accounts[0]);
            return accounts[0];
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error connecting to embedded wallet:', error);
      return null;
    }
  };

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

  const value: MiniAppContextType = {
    isMiniApp,
    isReady,
    context,
    isWalletConnected,
    walletAddress,
    farcasterUser,
    connectEmbeddedWallet,
    composeCast,
    addToFarcaster,
    triggerHaptic,
    triggerNotificationHaptic,
    isInitializing
  };

  return (
    <MiniAppContext.Provider value={value}>
      {children}
    </MiniAppContext.Provider>
  );
};

export const useMiniApp = (): MiniAppContextType => {
  const context = useContext(MiniAppContext);
  if (context === undefined) {
    throw new Error('useMiniApp must be used within a MiniAppProvider');
  }
  return context;
};

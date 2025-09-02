import { useState, useEffect, useCallback } from 'react';
import { celo, base } from 'viem/chains';
import { CONTRACTS } from '../utils/constants';

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

export const useContractAddress = () => {
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string | undefined>(undefined);

  // Get current chain ID from wallet
  const getCurrentChainId = useCallback(async () => {
    if (!window.ethereum) {
      return undefined;
    }
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      return parseInt(chainId, 16);
    } catch (error) {
      console.error('Error getting chain ID:', error);
      return undefined;
    }
  }, []);



  // Initialize wallet state
  useEffect(() => {
    const initializeWallet = async () => {
      if (!window.ethereum) return;
      
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        setChainId(parseInt(chainId, 16));
        setIsConnected(accounts.length > 0);
        setUserAddress(accounts[0]);
      } catch (error) {
        console.error('Error initializing wallet:', error);
      }
    };

    initializeWallet();

    // Listen for chain changes
    const handleChainChanged = (chainId: string) => {
      setChainId(parseInt(chainId, 16));
    };

    // Listen for account changes
    const handleAccountsChanged = (accounts: string[]) => {
      setIsConnected(accounts.length > 0);
      setUserAddress(accounts[0]);
    };

    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []); // Empty dependency array - only run once on mount
  
  const getCoreContractAddress = () => {
    if (chainId === celo.id) {
      return CONTRACTS.PREDICTION_MARKET_CORE.CELO_MAINNET.address;
    } else if (chainId === base.id) {
      return CONTRACTS.PREDICTION_MARKET_CORE.BASE_MAINNET.address;
    }
    // Default to Celo Mainnet for reading markets without wallet connection
    return CONTRACTS.PREDICTION_MARKET_CORE.CELO_MAINNET.address;
  };

  const getCoreContractABI = () => {
    if (chainId === celo.id) {
      return CONTRACTS.PREDICTION_MARKET_CORE.CELO_MAINNET.abi;
    } else if (chainId === base.id) {
      return CONTRACTS.PREDICTION_MARKET_CORE.BASE_MAINNET.abi;
    }
    // Default to Celo Mainnet ABI for reading markets without wallet connection
    return CONTRACTS.PREDICTION_MARKET_CORE.CELO_MAINNET.abi;
  };

  const getClaimsContractAddress = () => {
    if (chainId === celo.id) {
      return CONTRACTS.PREDICTION_MARKET_CLAIMS.CELO_MAINNET.address;
    } else if (chainId === base.id) {
      return CONTRACTS.PREDICTION_MARKET_CLAIMS.BASE_MAINNET.address;
    }
    // Default to Celo Mainnet for reading claims without wallet connection
    return CONTRACTS.PREDICTION_MARKET_CLAIMS.CELO_MAINNET.address;
  };

  const getClaimsContractABI = () => {
    if (chainId === celo.id) {
      return CONTRACTS.PREDICTION_MARKET_CLAIMS.CELO_MAINNET.abi;
    } else if (chainId === base.id) {
      return CONTRACTS.PREDICTION_MARKET_CLAIMS.BASE_MAINNET.abi;
    }
    // Default to Celo Mainnet ABI for reading claims without wallet connection
    return CONTRACTS.PREDICTION_MARKET_CLAIMS.CELO_MAINNET.abi;
  };

  const getCurrentNetwork = () => {
    if (chainId === celo.id) {
      return 'CELO_MAINNET';
    } else if (chainId === base.id) {
      return 'BASE_MAINNET';
    }
    // Default to Celo Mainnet for reading without wallet connection
    return 'CELO_MAINNET';
  };

  // Wallet connection functions
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length > 0) {
        setIsConnected(true);
        setUserAddress(accounts[0]);
        const currentChainId = await getCurrentChainId();
        setChainId(currentChainId);
      }
      return accounts[0];
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }, [getCurrentChainId]);

  const disconnectWallet = useCallback(() => {
    setIsConnected(false);
    setUserAddress(undefined);
    setChainId(undefined);
  }, []);

  return {
    // Wallet state
    chainId,
    isConnected,
    userAddress,
    
    // Wallet functions
    connectWallet,
    disconnectWallet,
    
    // Core contract
    coreContractAddress: getCoreContractAddress(),
    coreContractABI: getCoreContractABI(),
    
    // Claims contract
    claimsContractAddress: getClaimsContractAddress(),
    claimsContractABI: getClaimsContractABI(),
    
    // Legacy support (for backward compatibility)
    contractAddress: getCoreContractAddress(),
    contractABI: getCoreContractABI(),
    
    currentNetwork: getCurrentNetwork(),
    isSupportedNetwork: chainId === celo.id || chainId === base.id || !chainId, // Allow reading without wallet
  };
};
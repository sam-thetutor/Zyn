import { useAccount, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { NETWORKS } from '../utils/constants';

export const useWallet = () => {
  const { address, isConnected, isConnecting, isDisconnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingNetwork } = useSwitchChain();
  
  const { data: balance, refetch: refetchBalance } = useBalance({
    address,
  });

  // Check if connected to correct network
  const isCorrectNetwork = chainId === NETWORKS.CELO_ALFAJORES.chainId || chainId === NETWORKS.BASE_MAINNET.chainId;
  
  // Check if wallet is ready for transactions
  const isReady = isConnected && isCorrectNetwork && address;
  
  // Shortened address for display
  const shortAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  // Get current network info
  const getCurrentNetwork = () => {
    if (chainId === NETWORKS.CELO_ALFAJORES.chainId) {
      return NETWORKS.CELO_ALFAJORES;
    } else if (chainId === NETWORKS.BASE_MAINNET.chainId) {
      return NETWORKS.BASE_MAINNET;
    }
    return null;
  };

  const currentNetwork = getCurrentNetwork();

  // Network switching
  const switchToCelo = () => {
    if (switchChain) {
      switchChain({ chainId: NETWORKS.CELO_ALFAJORES.chainId });
    }
  };

  const switchToBase = () => {
    if (switchChain) {
      switchChain({ chainId: NETWORKS.BASE_MAINNET.chainId });
    }
  };

  // Format balance for display
  const formattedBalance = balance 
    ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}`
    : `0 ${currentNetwork?.currencySymbol || 'CELO'}`;

  return {
    // Connection state
    address,
    isConnected,
    isConnecting,
    isDisconnected,
    isReady,
    
    // Network state
    chainId,
    isCorrectNetwork,
    isSwitchingNetwork,
    
    // Balance
    balance,
    formattedBalance,
    refetchBalance,
    
    // Display
    shortAddress,
    
    // Actions
    switchToCelo,
    switchToBase,
    
    // Network info
    currentNetwork,
    targetNetwork: NETWORKS.CELO_ALFAJORES,
  };
};

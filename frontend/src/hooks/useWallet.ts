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
  const isCorrectNetwork = chainId === NETWORKS.BASE_MAINNET.chainId;
  
  // Check if wallet is ready for transactions
  const isReady = isConnected && isCorrectNetwork && address;
  
  // Shortened address for display
  const shortAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  // Network switching
  const switchToBase = () => {
    if (switchChain) {
      switchChain({ chainId: NETWORKS.BASE_MAINNET.chainId });
    }
  };

  // Format balance for display
  const formattedBalance = balance 
    ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}`
    : '0 ETH';

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
    switchToBase,
    
    // Network info
    targetNetwork: NETWORKS.BASE_MAINNET,
  };
};

import { useAccount } from 'wagmi';
import { celoAlfajores, base } from 'wagmi/chains';
import { CONTRACTS } from '../utils/constants';

export const useContractAddress = () => {
  const { chainId } = useAccount();
  
  const getCoreContractAddress = () => {
    if (chainId === celoAlfajores.id) {
      return CONTRACTS.PREDICTION_MARKET_CORE.CELO_ALFAJORES.address;
    } else if (chainId === base.id) {
      return CONTRACTS.PREDICTION_MARKET_CORE.BASE_MAINNET.address;
    }
    // Default to Celo Alfajores for reading markets without wallet connection
    return CONTRACTS.PREDICTION_MARKET_CORE.CELO_ALFAJORES.address;
  };

  const getCoreContractABI = () => {
    if (chainId === celoAlfajores.id) {
      return CONTRACTS.PREDICTION_MARKET_CORE.CELO_ALFAJORES.abi;
    } else if (chainId === base.id) {
      return CONTRACTS.PREDICTION_MARKET_CORE.BASE_MAINNET.abi;
    }
    // Default to Celo Alfajores ABI for reading markets without wallet connection
    return CONTRACTS.PREDICTION_MARKET_CORE.CELO_ALFAJORES.abi;
  };

  const getClaimsContractAddress = () => {
    if (chainId === celoAlfajores.id) {
      return CONTRACTS.PREDICTION_MARKET_CLAIMS.CELO_ALFAJORES.address;
    } else if (chainId === base.id) {
      return CONTRACTS.PREDICTION_MARKET_CLAIMS.BASE_MAINNET.address;
    }
    // Default to Celo Alfajores for reading claims without wallet connection
    return CONTRACTS.PREDICTION_MARKET_CLAIMS.CELO_ALFAJORES.address;
  };

  const getClaimsContractABI = () => {
    if (chainId === celoAlfajores.id) {
      return CONTRACTS.PREDICTION_MARKET_CLAIMS.CELO_ALFAJORES.abi;
    } else if (chainId === base.id) {
      return CONTRACTS.PREDICTION_MARKET_CLAIMS.BASE_MAINNET.abi;
    }
    // Default to Celo Alfajores ABI for reading claims without wallet connection
    return CONTRACTS.PREDICTION_MARKET_CLAIMS.CELO_ALFAJORES.abi;
  };

  const getCurrentNetwork = () => {
    if (chainId === celoAlfajores.id) {
      return 'CELO_ALFAJORES';
    } else if (chainId === base.id) {
      return 'BASE_MAINNET';
    }
    // Default to Celo Alfajores for reading without wallet connection
    return 'CELO_ALFAJORES';
  };

  return {
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
    isSupportedNetwork: chainId === celoAlfajores.id || chainId === base.id || !chainId, // Allow reading without wallet
  };
};

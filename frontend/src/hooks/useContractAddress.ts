import { useAccount } from 'wagmi';
import { celo, base } from 'wagmi/chains';
import { CONTRACTS } from '../utils/constants';

export const useContractAddress = () => {
  const { chainId } = useAccount();
  
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
    isSupportedNetwork: chainId === celo.id || chainId === base.id || !chainId, // Allow reading without wallet
  };
};
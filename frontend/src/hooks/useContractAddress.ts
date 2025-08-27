import { useAccount } from 'wagmi';
import { celoAlfajores, base } from 'wagmi/chains';
import { CONTRACTS } from '../utils/constants';

export const useContractAddress = () => {
  const { chainId } = useAccount();
  
  const getContractAddress = () => {
    if (chainId === celoAlfajores.id) {
      return CONTRACTS.PREDICTION_MARKET.CELO_ALFAJORES.address;
    } else if (chainId === base.id) {
      return CONTRACTS.PREDICTION_MARKET.BASE_MAINNET.address;
    }
    return null;
  };

  const getContractABI = () => {
    if (chainId === celoAlfajores.id) {
      return CONTRACTS.PREDICTION_MARKET.CELO_ALFAJORES.abi;
    } else if (chainId === base.id) {
      return CONTRACTS.PREDICTION_MARKET.BASE_MAINNET.abi;
    }
    return null;
  };

  const getCurrentNetwork = () => {
    if (chainId === celoAlfajores.id) {
      return 'CELO_ALFAJORES';
    } else if (chainId === base.id) {
      return 'BASE_MAINNET';
    }
    return null;
  };

  return {
    contractAddress: getContractAddress(),
    contractABI: getContractABI(),
    currentNetwork: getCurrentNetwork(),
    isSupportedNetwork: chainId === celoAlfajores.id || chainId === base.id,
  };
};

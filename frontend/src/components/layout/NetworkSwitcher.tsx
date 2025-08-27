import React, { useState } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { celoAlfajores, base } from 'wagmi/chains';
import { NETWORKS } from '../../utils/constants';

const NetworkSwitcher: React.FC = () => {
  const { chainId } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const [isOpen, setIsOpen] = useState(false);

  const currentNetwork = chainId === celoAlfajores.id ? 'CELO_ALFAJORES' : 
                        chainId === base.id ? 'BASE_MAINNET' : 'UNKNOWN';

  const getCurrentNetworkInfo = () => {
    if (chainId === celoAlfajores.id) {
      return {
        name: 'Celo Alfajores',
        color: 'bg-green-500',
        icon: '🌱'
      };
    } else if (chainId === base.id) {
      return {
        name: 'Base Mainnet',
        color: 'bg-blue-500',
        icon: '🔵'
      };
    } else {
      return {
        name: 'Unknown',
        color: 'bg-gray-500',
        icon: '❓'
      };
    }
  };

  const handleNetworkSwitch = async (targetChainId: number) => {
    if (switchChain && chainId !== targetChainId) {
      try {
        await switchChain({ chainId: targetChainId });
        setIsOpen(false);
      } catch (error) {
        console.error('Failed to switch network:', error);
      }
    }
  };

  const currentInfo = getCurrentNetworkInfo();

  return (
    <div className="relative">
      {/* Current Network Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:opacity-80 ${currentInfo.color} text-white`}
        disabled={isPending}
      >
        <span>{currentInfo.icon}</span>
        <span>{currentInfo.name}</span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Network Options Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="py-2">
            {/* Celo Alfajores Option */}
            <button
              onClick={() => handleNetworkSwitch(celoAlfajores.id)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                chainId === celoAlfajores.id ? 'bg-green-50 text-green-700' : 'text-gray-700'
              }`}
              disabled={chainId === celoAlfajores.id || isPending}
            >
              <div className="flex items-center space-x-2">
                <span>🌱</span>
                <div>
                  <div className="font-medium">Celo Alfajores</div>
                  <div className="text-xs text-gray-500">Testnet</div>
                </div>
                {chainId === celoAlfajores.id && (
                  <span className="text-green-600">✓</span>
                )}
              </div>
            </button>

            {/* Base Mainnet Option */}
            <button
              onClick={() => handleNetworkSwitch(base.id)}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                chainId === base.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
              }`}
              disabled={chainId === base.id || isPending}
            >
              <div className="flex items-center space-x-2">
                <span>🔵</span>
                <div>
                  <div className="font-medium">Base Mainnet</div>
                  <div className="text-xs text-gray-500">Production</div>
                </div>
                {chainId === base.id && (
                  <span className="text-blue-600">✓</span>
                )}
              </div>
            </button>

            {/* Network Info */}
            <div className="px-4 py-2 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                <div>Chain ID: {chainId}</div>
                <div>Currency: {NETWORKS[currentNetwork as keyof typeof NETWORKS]?.currencySymbol || 'Unknown'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NetworkSwitcher;

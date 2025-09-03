// Application configuration
export default {
  appName: 'Zyn Prediction Markets',
  version: '1.0.0',
  description: 'Decentralized prediction markets on Celo',
  
  // Network configuration
  networks: {
    celo: {
      name: 'Celo Mainnet',
      chainId: 42220,
      rpcUrl: 'https://forno.celo.org',
      blockExplorer: 'https://celoscan.io',
      currency: 'CELO',
      currencySymbol: 'CELO'
    },
    base: {
      name: 'Base Mainnet', 
      chainId: 8453,
      rpcUrl: 'https://mainnet.base.org',
      blockExplorer: 'https://basescan.org',
      currency: 'ETH',
      currencySymbol: 'ETH'
    }
  },
  
  // Default network
  defaultNetwork: 'celo',
  
  // Wallet configuration
  wallets: {
    supported: ['metamask', 'walletconnect', 'coinbase', 'injected'],
    autoConnect: true,
    reconnectTimeout: 5000
  },
  
  // API configuration
  api: {
    baseUrl: process.env.VITE_API_BASE_URL || 'https://api.zyn.com',
    timeout: 10000
  },
  
  // UI configuration
  ui: {
    theme: 'light',
    language: 'en',
    currency: 'USD'
  }
};

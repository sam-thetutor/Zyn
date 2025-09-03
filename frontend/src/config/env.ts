// Environment configuration
export default {
  // WalletConnect/AppKit
  walletConnectProjectId: "a34b492d8d46d7145fa4093030be0913",
  
  // API Keys
  alchemyApiKey: process.env.VITE_ALCHEMY_API_KEY,
  infuraApiKey: process.env.VITE_INFURA_API_KEY,
  
  // App Configuration
  appName: process.env.VITE_APP_NAME || 'Zyn Prediction Markets',
  appUrl: process.env.VITE_APP_URL || 'https://zyn.com',
  
  // Environment
  environment: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Feature Flags
  features: {
    enableAnalytics: process.env.VITE_ENABLE_ANALYTICS === 'true',
    enableNotifications: process.env.VITE_ENABLE_NOTIFICATIONS === 'true',
    enableFarcaster: process.env.VITE_ENABLE_FARCASTER === 'true',
  },
  
  // Contract Addresses
  contracts: {
    predictionMarket: process.env.VITE_PREDICTION_MARKET_CONTRACT,
    token: process.env.VITE_TOKEN_CONTRACT,
  }
};

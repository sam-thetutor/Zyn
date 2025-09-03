// Environment configuration
export const config = {
  // WalletConnect Project ID - replace with your actual project ID
  walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'your-project-id',
  
  // App URLs
  appUrl: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
  
  // API URLs
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  
  // Socket URL
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001',
  
  // Contract addresses
  predictionMarketAddress: import.meta.env.VITE_PREDICTION_MARKET_ADDRESS || '',
  predictionMarketClaimsAddress: import.meta.env.VITE_PREDICTION_MARKET_CLAIMS_ADDRESS || '',
  
  // Network configuration
  defaultChain: import.meta.env.VITE_DEFAULT_CHAIN || 'base',
  
  // Feature flags
  enableReferrals: import.meta.env.VITE_ENABLE_REFERRALS === 'true',
  enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
  enableFarcaster: import.meta.env.VITE_ENABLE_FARCASTER === 'true',
}

export default config

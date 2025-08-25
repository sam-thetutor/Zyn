// Network Configuration
export const NETWORKS = {
  BASE_MAINNET: {
    chainId: 8453,
    id: 8453,
    name: 'Base Mainnet',
    rpcUrl: import.meta.env.VITE_BASE_RPC_URL || 'https://mainnet.base.org',
    explorer: import.meta.env.VITE_BASESCAN_URL || 'https://basescan.org',
    currency: 'ETH',
    currencySymbol: 'ETH',
  },
} as const;

// Contract Configuration
export const CONTRACTS = {
  PREDICTION_MARKET: {
    address: import.meta.env.VITE_CONTRACT_ADDRESS || '0x199c954e6Fcc8fa27F21f81Adf48a6504a28006e',
    name: 'PredictionMarket',
    abi: [], // Will be populated from the deployed contract
  },
} as const;

// App Configuration
export const APP_CONFIG = {
  name: 'Zyn',
  description: 'Decentralized prediction markets on Base',
  version: '1.0.0',
  defaultMarketDuration: 24 * 60 * 60, // 24 hours in seconds
  maxMarketDuration: 30 * 24 * 60 * 60, // 30 days in seconds
  minMarketDuration: 60 * 60, // 1 hour in seconds
  maxQuestionLength: 200,
  maxDescriptionLength: 500,
} as const;

// UI Configuration
export const UI_CONFIG = {
  itemsPerPage: 12,
  maxQuestionLength: 200,
  maxDescriptionLength: 500,
  defaultGasLimit: 300000,
  defaultGasPrice: '1000000000', // 1 gwei
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
  WRONG_NETWORK: 'Please switch to Base Mainnet',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction',
  TRANSACTION_FAILED: 'Transaction failed. Please try again',
  MARKET_NOT_FOUND: 'Market not found',
  MARKET_ALREADY_RESOLVED: 'Market is already resolved',
  MARKET_NOT_ENDED: 'Market has not ended yet',
  INSUFFICIENT_SHARES: 'Insufficient shares to sell',
  INVALID_AMOUNT: 'Invalid amount provided',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully',
  MARKET_CREATED: 'Market created successfully',
  SHARES_BOUGHT: 'Shares purchased successfully',
  SHARES_SOLD: 'Shares sold successfully',
  MARKET_RESOLVED: 'Market resolved successfully',
  Winnings_CLAIMED: 'Winnings claimed successfully',
  FEES_UPDATED: 'Fees updated successfully',
} as const;

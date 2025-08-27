import { PREDICTION_MARKET_ABI } from './contracts';

// Network Configuration
export const NETWORKS = {
  CELO_ALFAJORES: {
    chainId: 44787,
    id: 44787,
    name: 'Celo Alfajores Testnet',
    rpcUrl: import.meta.env.VITE_CELO_ALFAJORES_RPC_URL || 'https://alfajores-forno.celo-testnet.org',
    explorer: import.meta.env.VITE_CELOSCAN_URL || 'https://alfajores.celoscan.io',
    currency: 'CELO',
    currencySymbol: 'CELO',
  },
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
    // Celo Alfajores contract
    CELO_ALFAJORES: {
      address: import.meta.env.VITE_CELO_CONTRACT_ADDRESS || '0x0C49604c65588858DC206AAC6EFEc0F8Afe2d1d6',
      name: 'PredictionMarket',
      abi: PREDICTION_MARKET_ABI,
    },
    // Base Mainnet contract (placeholder - needs to be deployed)
    BASE_MAINNET: {
      address: import.meta.env.VITE_BASE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
      name: 'PredictionMarket',
      abi: PREDICTION_MARKET_ABI,
    },
  },
} as const;

// Admin Configuration
export const ADMIN_ADDRESS = '0x21D654daaB0fe1be0e584980ca7C1a382850939f';

// App Configuration
export const APP_CONFIG = {
  name: 'Zyn',
  description: 'Decentralized prediction markets on Celo',
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
  WRONG_NETWORK: 'Please switch to Celo Alfajores Testnet',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction',
  TRANSACTION_FAILED: 'Transaction failed. Please try again',
  MARKET_NOT_FOUND: 'Market not found',
  MARKET_ALREADY_RESOLVED: 'Market is already resolved',
  MARKET_NOT_ENDED: 'Market has not ended yet',
  INSUFFICIENT_SHARES: 'Insufficient shares to sell',
  INVALID_AMOUNT: 'Invalid amount provided',
  ADMIN_ACCESS_REQUIRED: 'Admin access required for this action',
  MARKET_NOT_ACTIVE: 'Market is not active',
  ALREADY_CLAIMED: 'Winnings have already been claimed',
  NO_WINNINGS_TO_CLAIM: 'No winnings to claim for this market',
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
  ADMIN_CHANGED: 'Admin address changed successfully',
} as const;

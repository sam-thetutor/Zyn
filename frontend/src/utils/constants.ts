import { PREDICTION_MARKET_CORE_ABI, PREDICTION_MARKET_CLAIMS_ABI } from './contracts';

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
  PREDICTION_MARKET_CORE: {
    // Celo Alfajores testnet core contract
    CELO_ALFAJORES: {
      address: import.meta.env.VITE_CELO_ALFAJORES_CORE_CONTRACT_ADDRESS || '0xEF2B2cc9c95996213CC6525B55E2B8CF11fc5E38',
      name: 'PredictionMarketCore',
      abi: PREDICTION_MARKET_CORE_ABI,
    },
    // Celo Mainnet core contract (UPDATED with creator fee functionality - v4)
    CELO_MAINNET: {
      address: import.meta.env.VITE_CELO_MAINNET_CORE_CONTRACT_ADDRESS || '0x2D6614fe45da6Aa7e60077434129a51631AC702A',
      name: 'PredictionMarketCore',
      abi: PREDICTION_MARKET_CORE_ABI,
    },
    // Base Mainnet core contract (placeholder - needs to be deployed)
    BASE_MAINNET: {
      address: import.meta.env.VITE_BASE_CORE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
      name: 'PredictionMarketCore',
      abi: PREDICTION_MARKET_CORE_ABI,
    },
  },
  PREDICTION_MARKET_CLAIMS: {
    // Celo Alfajores testnet claims contract
    CELO_ALFAJORES: {
      address: import.meta.env.VITE_CELO_ALFAJORES_CLAIMS_CONTRACT_ADDRESS || '0xB555eff91049546Bf525aB1CCAa2b1edfD6c3218',
      name: 'PredictionMarketClaims',
      abi: PREDICTION_MARKET_CLAIMS_ABI,
    },
    // Celo Mainnet claims contract (UPDATED with creator fee functionality - v4)
    CELO_MAINNET: {
      address: import.meta.env.VITE_CELO_MAINNET_CLAIMS_CONTRACT_ADDRESS || '0xA8479E513D8643001285D9AF6277602B20676B95',
      name: 'PredictionMarketClaims',
      abi: PREDICTION_MARKET_CLAIMS_ABI,
    },
    // Base Mainnet claims contract (placeholder - needs to be deployed)
    BASE_MAINNET: {
      address: import.meta.env.VITE_BASE_CLAIMS_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
      name: 'PredictionMarketClaims',
      abi: PREDICTION_MARKET_CLAIMS_ABI,
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
  maxSourceLength: 100,
  marketCreationFee: '0.01', // 0.01 CELO (mainnet)
  usernameChangeFee: '0.00001', // 0.00001 CELO
} as const;

// UI Configuration
export const UI_CONFIG = {
  itemsPerPage: 12,
  maxQuestionLength: 200,
  maxDescriptionLength: 500,
  maxSourceLength: 100,
  defaultGasLimit: 300000,
  defaultGasPrice: '1000000000', // 1 gwei
  marketCreationFee: '0.01', // 0.01 CELO (mainnet)
  usernameChangeFee: '0.00001', // 0.00001 CELO
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
  WRONG_NETWORK: 'Please switch to Celo Mainnet',
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
  MARKET_NOT_RESOLVED: 'Market must be resolved before claiming',
  INSUFFICIENT_CONTRACT_BALANCE: 'Insufficient contract balance for payout',
  WINNER_CALCULATION_FAILED: 'Failed to calculate winners for this market',
  CLAIMING_NOT_AVAILABLE: 'Claiming is not available for this market',
  CREATOR_FEE_ALREADY_CLAIMED: 'Creator fee has already been claimed for this market',
  NO_CREATOR_FEE_TO_CLAIM: 'No creator fee to claim for this market',
  NOT_MARKET_CREATOR: 'Only the market creator can claim the creator fee',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully',
  MARKET_CREATED: 'Market created successfully',
  SHARES_BOUGHT: 'Shares purchased successfully',
  SHARES_SOLD: 'Shares sold successfully',
  MARKET_RESOLVED: 'Market resolved successfully',
  Winnings_CLAIMED: 'Winnings claimed successfully',
  WINNERS_CALCULATED: 'Winners calculated successfully',
  REWARDS_DISBURSED: 'Rewards disbursed successfully',
  FEES_UPDATED: 'Fees updated successfully',
  ADMIN_CHANGED: 'Admin address changed successfully',
  CREATOR_FEE_CLAIMED: 'Creator fee claimed successfully',
  CREATOR_FEE_PERCENTAGE_UPDATED: 'Creator fee percentage updated successfully',
} as const;

export const changeFeeData = 10000000000000000

// Divvi Integration
export const DIVVI_CONSUMER_ADDRESS = '0x21D654daaB0fe1be0e584980ca7C1a382850939f';
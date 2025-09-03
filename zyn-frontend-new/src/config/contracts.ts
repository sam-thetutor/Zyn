import { celo, base } from 'viem/chains';
import { PREDICTION_MARKET_CORE_ABI, PREDICTION_MARKET_CLAIMS_ABI } from './abis';

// Contract addresses for different networks
export const getCoreContractAddress = (chainId?: number): `0x${string}` => {
  if (chainId === celo.id) {
    return (import.meta.env.VITE_CELO_MAINNET_CORE_CONTRACT_ADDRESS || '0x2D6614fe45da6Aa7e60077434129a51631AC702A') as `0x${string}`;
  } else if (chainId === base.id) {
    return (import.meta.env.VITE_BASE_CORE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;
  }
  // Default to Celo Mainnet for reading markets without wallet connection
  return (import.meta.env.VITE_CELO_MAINNET_CORE_CONTRACT_ADDRESS || '0x2D6614fe45da6Aa7e60077434129a51631AC702A') as `0x${string}`;
};

export const getClaimsContractAddress = (chainId?: number): `0x${string}` => {
  if (chainId === celo.id) {
    return (import.meta.env.VITE_CELO_MAINNET_CLAIMS_CONTRACT_ADDRESS || '0xA8479E513D8643001285D9AF6277602B20676B95') as `0x${string}`;
  } else if (chainId === base.id) {
    return (import.meta.env.VITE_BASE_CLAIMS_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;
  }
  // Default to Celo Mainnet for reading claims without wallet connection
  return (import.meta.env.VITE_CELO_MAINNET_CLAIMS_CONTRACT_ADDRESS || '0xA8479E513D8643001285D9AF6277602B20676B95') as `0x${string}`;
};

export const getCurrentNetwork = (chainId?: number): string => {
  if (chainId === celo.id) {
    return 'CELO_MAINNET';
  } else if (chainId === base.id) {
    return 'BASE_MAINNET';
  }
  // Default to Celo Mainnet for reading without wallet connection
  return 'CELO_MAINNET';
};

export const isSupportedNetwork = (chainId?: number): boolean => {
  return chainId === celo.id || chainId === base.id || !chainId;
};

// Contract configuration objects
export const getCoreContractConfig = (chainId?: number) => ({
  address: getCoreContractAddress(chainId),
  abi: PREDICTION_MARKET_CORE_ABI,
});

export const getClaimsContractConfig = (chainId?: number) => ({
  address: getClaimsContractAddress(chainId),
  abi: PREDICTION_MARKET_CLAIMS_ABI,
});

// App Configuration
export const APP_CONFIG = {
  name: 'Zyn',
  description: 'Decentralized prediction markets on Base and Celo',
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
  WRONG_NETWORK: 'Please switch to a supported network',
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

// Divvi Integration
export const DIVVI_CONSUMER_ADDRESS = '0x21D654daaB0fe1be0e584980ca7C1a382850939f';

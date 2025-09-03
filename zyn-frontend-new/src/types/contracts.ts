// TypeScript interfaces for the contracts
export interface Market {
  id: bigint;
  question: string;
  endTime: bigint;
  totalPool: bigint;
  totalYes: bigint;
  totalNo: bigint;
  status: MarketStatus;
  outcome: boolean;
  createdAt: bigint;
  creator: string;
}

export interface MarketMetadata {
  description: string;
  category: string;
  image: string;
  source: string;
}

// Combined interface for frontend use (Market + MarketMetadata)
export interface MarketWithMetadata extends Market {
  description: string;
  category: string;
  image: string;
  source: string;
}

export interface CreatorFeeData {
  creator: string;
  fee: bigint;
  claimed: boolean;
}

export const MarketStatus = {
  ACTIVE: 0,
  RESOLVED: 1,
  CANCELLED: 2,
} as const;

export type MarketStatus = typeof MarketStatus[keyof typeof MarketStatus];

export interface MarketCreatedEvent {
  marketId: bigint;
  creator: string;
  question: string;
  category: string;
  endTime: bigint;
}

export interface SharesBoughtEvent {
  marketId: bigint;
  buyer: string;
  isYesShares: boolean;
  amount: bigint;
}

export interface MarketResolvedEvent {
  marketId: bigint;
  resolver: string;
  outcome: boolean;
}

export interface UsernameSetEvent {
  user: string;
  username: string;
}

export interface UsernameChangedEvent {
  user: string;
  oldUsername: string;
  newUsername: string;
}

export interface RewardsDisbursedEvent {
  marketId: bigint;
  claimant: string;
  amount: bigint;
}

export interface WinningsClaimedEvent {
  marketId: bigint;
  user: string;
  amount: bigint;
}

// User participation interface
export interface UserParticipation {
  participated: boolean;
  side: boolean; // true for YES, false for NO
  yesShares: bigint;
  noShares: bigint;
}

// Winner information interface
export interface WinnerInfo {
  isWinner: boolean;
  winnings: bigint;
  hasClaimed: boolean;
}

// Extended market interface with user data
export interface MarketWithUserShares extends MarketWithMetadata {
  timeRemaining: number;
  isEnded: boolean;
  isActive: boolean;
  userYesShares: bigint;
  userNoShares: bigint;
  userParticipation?: UserParticipation;
  winnerInfo?: WinnerInfo;
}

// Dashboard statistics interface
export interface DashboardStats {
  totalMarkets: number;
  activeTraders: number;
  totalVolume: string;
  resolvedMarkets: number;
  totalVolumeWei: bigint;
}

// Contract state interface
export interface ContractState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  transactionHash?: string;
}

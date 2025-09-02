import { create } from 'zustand';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { celo, base } from 'wagmi/chains';
import { CONTRACTS } from '../utils/constants';

// Event signatures from the actual contracts
const MARKET_EVENTS = [
  // From PredictionMarketCore.sol
  'event MarketCreated(uint256 indexed marketId, address indexed creator, string question, string description, string source, uint256 endTime, uint256 creationFee)',
  'event SharesBought(uint256 indexed marketId, address indexed buyer, bool side, uint256 amount)',
  'event MarketResolved(uint256 indexed marketId, address indexed resolver, bool outcome)',
  'event UsernameSet(address indexed user, string username)',
  'event UsernameChanged(address indexed user, string oldUsername, string newUsername)',
  'event ClaimsContractSet(address indexed oldContract, address indexed newContract)',
  'event RewardsDisbursed(uint256 indexed marketId, address indexed claimant, uint256 amount)',
  
  // From PredictionMarketClaims.sol
  'event WinningsClaimed(uint256 indexed marketId, address indexed claimant, uint256 amount)',
  'event AdminChanged(address indexed oldAdmin, address indexed newAdmin)',
  'event CoreContractSet(address indexed oldContract, address indexed newContract)',
];

export interface ContractLog {
  network: string;
  contractType: string;
  contractAddress: string;
  contractName: string;
  eventName: string;
  blockNumber: bigint;
  transactionHash: string;
  args: any;
  timestamp?: number;
}

// User activity tracking for leaderboard
export interface UserActivity {
  address: string;
  type: 'invest' | 'win' | 'lose' | 'create_market' | 'claim_winnings';
  amount: bigint;
  marketId: string;
  timestamp: number;
  transactionHash: string;
  side?: boolean; // For investments: true = yes, false = no
  outcome?: boolean; // For market resolution: true = yes won, false = no won
}

// User leaderboard stats
export interface UserLeaderboardStats {
  address: string;
  username?: string;
  totalPnL: bigint;           // Net profit/loss in wei
  totalInvested: bigint;      // Total amount invested
  totalWinnings: bigint;      // Total winnings claimed
  winRate: number;           // Percentage (0-100)
  totalMarkets: number;      // Markets participated in
  winningMarkets: number;    // Markets won
  currentStreak: number;     // Current streak (positive = winning, negative = losing)
  bestStreak: number;        // Best winning streak
  totalVolume: bigint;       // Total trading volume
  riskAdjustedReturn: number; // PnL / Volume ratio
  rank: number;              // Current leaderboard position
  lastActivity: number;      // Timestamp of last activity
  activities: UserActivity[]; // All user activities
}

interface EventsStore {
  // State
  logs: ContractLog[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  userActivities: UserActivity[];
  leaderboardStats: UserLeaderboardStats[];
  lastProcessedTimestamp: number | null;
  lastLeaderboardTimestamp: number | null;
  
  // Actions
  fetchAllLogs: () => Promise<ContractLog[]>;
  setLogs: (logs: ContractLog[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
  
  // User activity tracking
  processUserActivities: () => void;
  getUserActivities: (userAddress: string) => UserActivity[];
  calculateUserStats: (userAddress: string) => UserLeaderboardStats;
  
  // Leaderboard functions
  generateLeaderboard: (timeframe?: 'daily' | 'weekly' | 'monthly' | 'all') => UserLeaderboardStats[];
  getUserRank: (userAddress: string) => number;
  getTopUsers: (count?: number) => UserLeaderboardStats[];
  
  // Computed values
  getLogsByEvent: (eventName: string) => ContractLog[];
  getLogsByNetwork: (network: string) => ContractLog[];
  getRecentLogs: (count?: number) => ContractLog[];
  getUserLogs: (userAddress: string) => ContractLog[];
  getMarketLogs: (marketId: string) => ContractLog[];
  
  // Convenience getters
  marketCreatedLogs: ContractLog[];
  sharesBoughtLogs: ContractLog[];
  marketResolvedLogs: ContractLog[];
  winningsClaimedLogs: ContractLog[];
  celoLogs: ContractLog[];
  baseLogs: ContractLog[];
}

// Initialize clients
const celoClient = createPublicClient({
  chain: celo,
  transport: http('https://forno.celo.org', {
    timeout: 30000,
    retryCount: 3,
    retryDelay: 1000,
  }),
});

const baseClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org', {
    timeout: 30000,
    retryCount: 3,
    retryDelay: 1000,
  }),
});

// Fetch logs from a specific network
const fetchNetworkLogs = async (client: any, contracts: any, network: string): Promise<ContractLog[]> => {
  const logs: ContractLog[] = [];
  const currentBlock = await client.getBlockNumber();
  
  // Calculate blocks from 3 weeks ago
  const blocksPerDay = 17280; // 24 * 60 * 60 / 5 seconds per block
  const daysToFetch = 21; // 3 weeks
  const fromBlock = currentBlock - BigInt(blocksPerDay * daysToFetch);
  
  console.log(`📦 Scanning blocks ${fromBlock} to ${currentBlock} on ${network} (${daysToFetch} days)`);

  for (const [contractType, address] of Object.entries(contracts)) {
    if (address === '0x0000000000000000000000000000000000000000') {
      console.log(`⚠️  Skipping ${contractType} - not deployed`);
      continue;
    }

    console.log(`📋 Fetching from ${contractType} contract: ${address}`);

    for (const eventSignature of MARKET_EVENTS) {
      try {
        const eventAbi = parseAbiItem(eventSignature);
        const eventName = (eventAbi as any).name;
        
        console.log(`  📝 Fetching ${eventName} events...`);
        
        const eventLogs = await client.getLogs({
          address,
          event: eventAbi,
          fromBlock,
          toBlock: currentBlock,
        });

        console.log(`  ✅ Found ${eventLogs.length} ${eventName} events`);

        for (const log of eventLogs) {
          const block = await client.getBlock({ blockNumber: log.blockNumber });
          logs.push({
            network,
            contractType: contractType as string,
            contractAddress: address as string,
            contractName: contractType === 'core' ? 'PredictionMarketCore' : 'PredictionMarketClaims',
            eventName,
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            args: log.args,
            timestamp: Number(block.timestamp),
          });
        }
      } catch (error) {
        console.log(`  ⚠️  Error fetching ${eventSignature}:`, error);
      }
    }
  }

  return logs;
};

export const useEventsStore = create<EventsStore>((set, get) => ({
  // Initial state
  logs: [],
  loading: false,
  error: null,
  lastFetched: null,
  userActivities: [],
  leaderboardStats: [],
  lastProcessedTimestamp: null,
  lastLeaderboardTimestamp: null,
  
  // Actions
  fetchAllLogs: async () => {
    const state = get();
    
    // Prevent multiple simultaneous fetches
    if (state.loading) {
      console.log('⏳ Already fetching logs, skipping...');
      return state.logs;
    }

    set({ loading: true, error: null });

    try {
      console.log('🚀 Starting to fetch all contract logs...');
      
      const allLogs: ContractLog[] = [];

      // Fetch from Celo Mainnet
      console.log('\n🔍 Fetching from Celo Mainnet...');
      const celoLogs = await fetchNetworkLogs(
        celoClient, 
        {
          core: CONTRACTS.PREDICTION_MARKET_CORE.CELO_MAINNET.address,
          claims: CONTRACTS.PREDICTION_MARKET_CLAIMS.CELO_MAINNET.address
        }, 
        'CELO_MAINNET'
      );
      allLogs.push(...celoLogs);

      // Fetch from Base Mainnet (if deployed)
      console.log('\n🔍 Fetching from Base Mainnet...');
      if (CONTRACTS.PREDICTION_MARKET_CORE.BASE_MAINNET.address !== '0x0000000000000000000000000000000000000000') {
        const baseLogs = await fetchNetworkLogs(
          baseClient, 
          {
            core: CONTRACTS.PREDICTION_MARKET_CORE.BASE_MAINNET.address,
            claims: CONTRACTS.PREDICTION_MARKET_CLAIMS.BASE_MAINNET.address
          }, 
          'BASE_MAINNET'
        );
        allLogs.push(...baseLogs);
      } else {
        console.log('⚠️  Skipping Base Mainnet - contracts not deployed yet');
      }

      // Sort by timestamp (newest first)
      const sortedLogs = allLogs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      
      set({ 
        logs: sortedLogs, 
        loading: false, 
        lastFetched: Date.now() 
      });
      
      console.log(`✅ Fetched ${sortedLogs.length} total events`);
      return sortedLogs;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch logs';
      set({ error: errorMessage, loading: false });
      console.error('❌ Error fetching logs:', err);
      throw err;
    }
  },

  setLogs: (logs) => set({ logs }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  reset: () => set({ logs: [], loading: false, error: null, lastFetched: null }),

  // Computed values
  getLogsByEvent: (eventName) => {
    const { logs } = get();
    return logs ? logs.filter(log => log.eventName === eventName) : [];
  },

  getLogsByNetwork: (network) => {
    const { logs } = get();
    return logs ? logs.filter(log => log.network === network) : [];
  },

  getRecentLogs: (count = 10) => {
    const { logs } = get();
    return logs ? logs.slice(0, count) : [];
  },

  getUserLogs: (userAddress) => {
    const { logs } = get();
    if (!userAddress || !logs) return [];
    
    console.log('getUserLogs called with:', userAddress);
    console.log('Total logs available:', logs.length);
    
    const userLogs = logs.filter(log => {
      // Check all possible user-related fields in the event args
      const args = log.args || {};
      
      // Market creation events
      if (args.creator === userAddress) return true;
      
      // Trading events
      if (args.buyer === userAddress) return true;
      if (args.seller === userAddress) return true;
      
      // Market resolution events
      if (args.resolver === userAddress) return true;
      
      // User profile events
      if (args.user === userAddress) return true;
      
      // Claiming events
      if (args.claimant === userAddress) return true;
      
      // Referral events
      if (args.referrer === userAddress) return true;
      if (args.referee === userAddress) return true;
      
      // Admin events
      if (args.oldAdmin === userAddress) return true;
      if (args.newAdmin === userAddress) return true;
      
      // Contract setting events
      if (args.oldContract === userAddress) return true;
      if (args.newContract === userAddress) return true;
      
      return false;
    });
    
    console.log('Filtered user logs:', userLogs.length);
    return userLogs;
  },

  getMarketLogs: (marketId) => {
    const { logs } = get();
    if (!logs) return [];
    
    return logs.filter(log => {
      return log.args.marketId?.toString() === marketId;
    });
  },

  // Convenience getters
  get marketCreatedLogs() {
    return get().getLogsByEvent('MarketCreated');
  },

  get sharesBoughtLogs() {
    return get().getLogsByEvent('SharesBought');
  },

  get marketResolvedLogs() {
    return get().getLogsByEvent('MarketResolved');
  },

  get winningsClaimedLogs() {
    return get().getLogsByEvent('WinningsClaimed');
  },

  get celoLogs() {
    return get().getLogsByNetwork('CELO_MAINNET');
  },

  get baseLogs() {
    return get().getLogsByNetwork('BASE_MAINNET');
  },

  // User activity tracking functions
  processUserActivities: () => {
    const { logs, lastProcessedTimestamp } = get();
    
    // Skip processing if we already processed these logs recently
    if (lastProcessedTimestamp && logs.length > 0) {
      const latestLogTimestamp = Math.max(...logs.map(log => log.timestamp || 0));
      if (latestLogTimestamp <= lastProcessedTimestamp) {
        console.log('📊 User activities already processed, skipping...');
        return;
      }
    }
    
    const activities: UserActivity[] = [];

    logs.forEach(log => {
      const args = log.args || {};
      const timestamp = log.timestamp || Date.now();

      switch (log.eventName) {
        case 'MarketCreated':
          if (args.creator) {
            activities.push({
              address: args.creator.toLowerCase(),
              type: 'create_market',
              amount: BigInt(args.creationFee || 0),
              marketId: args.marketId?.toString() || '',
              timestamp,
              transactionHash: log.transactionHash,
            });
          }
          break;

        case 'SharesBought':
          if (args.buyer) {
            activities.push({
              address: args.buyer.toLowerCase(),
              type: 'invest',
              amount: BigInt(args.amount || 0),
              marketId: args.marketId?.toString() || '',
              timestamp,
              transactionHash: log.transactionHash,
              side: args.side,
            });
          }
          break;

        case 'WinningsClaimed':
          if (args.claimant) {
            activities.push({
              address: args.claimant.toLowerCase(),
              type: 'claim_winnings',
              amount: BigInt(args.amount || 0),
              marketId: args.marketId?.toString() || '',
              timestamp,
              transactionHash: log.transactionHash,
            });
          }
          break;

        case 'MarketResolved':
          // This will be used to determine win/lose for previous investments
          if (args.resolver) {
            activities.push({
              address: args.resolver.toLowerCase(),
              type: 'win', // Market resolver gets a win
              amount: 0n,
              marketId: args.marketId?.toString() || '',
              timestamp,
              transactionHash: log.transactionHash,
              outcome: args.outcome,
            });
          }
          break;
      }
    });

    // Sort by timestamp
    activities.sort((a, b) => a.timestamp - b.timestamp);
    
    const latestTimestamp = activities.length > 0 ? Math.max(...activities.map(a => a.timestamp)) : Date.now();
    
    set({ 
      userActivities: activities,
      lastProcessedTimestamp: latestTimestamp
    });
    console.log(`📊 Processed ${activities.length} user activities`);
  },

  getUserActivities: (userAddress: string) => {
    const { userActivities } = get();
    if (!userAddress) return [];
    
    return userActivities.filter(activity => 
      activity.address.toLowerCase() === userAddress.toLowerCase()
    );
  },

  calculateUserStats: (userAddress: string) => {
    if (!userAddress) {
      return {
        address: '',
        totalPnL: 0n,
        totalInvested: 0n,
        totalWinnings: 0n,
        winRate: 0,
        totalMarkets: 0,
        winningMarkets: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalVolume: 0n,
        riskAdjustedReturn: 0,
        rank: 0,
        lastActivity: 0,
        activities: [],
      };
    }

    const userActivities = get().getUserActivities(userAddress);
    
    // Calculate basic stats
    let totalInvested = 0n;
    let totalWinnings = 0n;
    let totalVolume = 0n;
    let totalMarkets = 0;
    let winningMarkets = 0;
    let lastActivity = 0;

    // Track market outcomes for win rate calculation
    const marketOutcomes = new Map<string, { invested: bigint; won: boolean; amount: bigint }>();

    userActivities.forEach(activity => {
      lastActivity = Math.max(lastActivity, activity.timestamp);

      switch (activity.type) {
        case 'invest':
          totalInvested += activity.amount;
          totalVolume += activity.amount;
          
          const marketId = activity.marketId;
          if (!marketOutcomes.has(marketId)) {
            marketOutcomes.set(marketId, { invested: 0n, won: false, amount: 0n });
            totalMarkets++;
          }
          
          const marketData = marketOutcomes.get(marketId)!;
          marketData.invested += activity.amount;
          break;

        case 'claim_winnings':
          totalWinnings += activity.amount;
          const marketData2 = marketOutcomes.get(activity.marketId);
          if (marketData2) {
            marketData2.won = true;
            marketData2.amount = activity.amount;
          }
          break;

        case 'create_market':
          totalVolume += activity.amount;
          break;
      }
    });

    // Calculate win rate
    marketOutcomes.forEach((data) => {
      if (data.invested > 0n && data.won) {
        winningMarkets++;
      }
    });

    const winRate = totalMarkets > 0 ? (winningMarkets / totalMarkets) * 100 : 0;
    const totalPnL = totalWinnings - totalInvested;
    const riskAdjustedReturn = totalVolume > 0n ? Number(totalPnL) / Number(totalVolume) : 0;

    // Calculate streaks (simplified - would need more complex logic for accurate streaks)
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    // Sort activities by timestamp and calculate streaks
    const sortedActivities = [...userActivities].sort((a, b) => a.timestamp - b.timestamp);
    
    sortedActivities.forEach(activity => {
      if (activity.type === 'claim_winnings') {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else if (activity.type === 'invest') {
        // Reset streak on new investment (simplified logic)
        if (tempStreak > 0) {
          currentStreak = tempStreak;
          tempStreak = 0;
        }
      }
    });

    return {
      address: userAddress,
      totalPnL,
      totalInvested,
      totalWinnings,
      winRate,
      totalMarkets,
      winningMarkets,
      currentStreak,
      bestStreak,
      totalVolume,
      riskAdjustedReturn,
      rank: 0, // Will be set by leaderboard generation
      lastActivity,
      activities: userActivities,
    };
  },

  // Leaderboard functions
  generateLeaderboard: (timeframe: 'daily' | 'weekly' | 'monthly' | 'all' = 'all') => {
    const { userActivities, lastLeaderboardTimestamp, leaderboardStats } = get();
    
    // Skip generation if we already generated recently and timeframe is 'all' AND we have stats
    if (timeframe === 'all' && lastLeaderboardTimestamp && userActivities.length > 0 && leaderboardStats.length > 0) {
      const latestActivityTimestamp = Math.max(...userActivities.map(a => a.timestamp));
      if (latestActivityTimestamp <= lastLeaderboardTimestamp) {
        console.log('🏆 Leaderboard already generated recently, skipping...');
        return get().leaderboardStats;
      }
    }
    
    // Get unique users
    const uniqueUsers = new Set<string>();
    userActivities.forEach(activity => {
      uniqueUsers.add(activity.address);
    });
    
    console.log(`🏆 Generating leaderboard for ${uniqueUsers.size} unique users with ${userActivities.length} activities`);

    // Calculate stats for all users
    const allUserStats: UserLeaderboardStats[] = [];
    uniqueUsers.forEach(userAddress => {
      const stats = get().calculateUserStats(userAddress);
      allUserStats.push(stats);
    });

    // Sort by PnL (descending)
    allUserStats.sort((a, b) => Number(b.totalPnL) - Number(a.totalPnL));

    // Assign ranks
    allUserStats.forEach((stats, index) => {
      stats.rank = index + 1;
    });

    // Filter by timeframe if needed
    let filteredStats = allUserStats;
    if (timeframe !== 'all') {
      const now = Date.now();
      const timeframeMs = {
        daily: 24 * 60 * 60 * 1000,
        weekly: 7 * 24 * 60 * 60 * 1000,
        monthly: 30 * 24 * 60 * 60 * 1000,
      }[timeframe];

      filteredStats = allUserStats.filter(stats => 
        stats.lastActivity > (now - timeframeMs)
      );
    }

    const now = Date.now();
    set({ 
      leaderboardStats: filteredStats,
      lastLeaderboardTimestamp: now
    });
    console.log(`🏆 Generated leaderboard with ${filteredStats.length} users`);
    console.log('🏆 Top 3 users:', filteredStats.slice(0, 3).map(u => ({ 
      address: u.address, 
      totalPnL: u.totalPnL.toString(), 
      rank: u.rank 
    })));
    
    return filteredStats;
  },

  getUserRank: (userAddress: string) => {
    const { leaderboardStats } = get();
    const userStats = leaderboardStats.find(stats => 
      stats.address.toLowerCase() === userAddress.toLowerCase()
    );
    return userStats?.rank || 0;
  },

  getTopUsers: (count: number = 10) => {
    const { leaderboardStats } = get();
    return leaderboardStats.slice(0, count);
  },
}));

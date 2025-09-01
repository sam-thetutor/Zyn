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

interface EventsStore {
  // State
  logs: ContractLog[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  
  // Actions
  fetchAllLogs: () => Promise<ContractLog[]>;
  setLogs: (logs: ContractLog[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
  
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
}));

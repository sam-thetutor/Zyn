import { useState, useEffect, useCallback, useRef } from 'react';
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

export const useGetLogs = () => {
  const [logs, setLogs] = useState<ContractLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  // Initialize clients for both networks
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
  const fetchNetworkLogs = useCallback(async (client: any, contracts: any, network: string) => {
    const logs: ContractLog[] = [];
    const currentBlock = await client.getBlockNumber();
    
    // Calculate blocks from 3 weeks ago
    // Assuming ~5 seconds per block on Celo, 3 weeks = 21 * 24 * 60 * 60 / 5 = ~362,880 blocks
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
  }, []);

  // Fetch all logs
  const fetchAllLogs = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (loading) {
      console.log('⏳ Already fetching logs, skipping...');
      return logs;
    }

    setLoading(true);
    setError(null);

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
      
      setLogs(sortedLogs);
      hasFetchedRef.current = true;
      console.log(`✅ Fetched ${sortedLogs.length} total events`);
      
      return sortedLogs;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch logs';
      setError(errorMessage);
      console.error('❌ Error fetching logs:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchNetworkLogs, loading, logs]);

  // Fetch logs for specific user
  const fetchUserLogs = useCallback(async (userAddress: string) => {
    if (!userAddress) return [];
    
    const allLogs = await fetchAllLogs();
    const userLogs = allLogs.filter(log => {
      if (log.args.creator === userAddress) return true;
      if (log.args.buyer === userAddress) return true;
      if (log.args.seller === userAddress) return true;
      if (log.args.resolver === userAddress) return true;
      if (log.args.user === userAddress) return true;
      if (log.args.claimant === userAddress) return true;
      if (log.args.referrer === userAddress) return true;
      if (log.args.referee === userAddress) return true;
      return false;
    });

    console.log(`👤 Found ${userLogs.length} events for user ${userAddress}`);
    return userLogs;
  }, [fetchAllLogs]);

  // Fetch logs for specific market
  const fetchMarketLogs = useCallback(async (marketId: string) => {
    const allLogs = await fetchAllLogs();
    const marketLogs = allLogs.filter(log => {
      return log.args.marketId?.toString() === marketId;
    });

    console.log(`📊 Found ${marketLogs.length} events for market ${marketId}`);
    return marketLogs;
  }, [fetchAllLogs]);

  // Get logs by event type
  const getLogsByEvent = useCallback((eventName: string) => {
    return logs ? logs.filter(log => log.eventName === eventName) : [];
  }, [logs]);

  // Get recent logs
  const getRecentLogs = useCallback((count: number = 10) => {
    return logs ? logs.slice(0, count) : [];
  }, [logs]);

  // Get logs by network
  const getLogsByNetwork = useCallback((network: string) => {
    return logs ? logs.filter(log => log.network === network) : [];
  }, [logs]);

  // Auto-fetch logs when component mounts (regardless of wallet connection)
  useEffect(() => {
    if (!hasFetchedRef.current && !loading) {
      fetchAllLogs();
    }
  }, [fetchAllLogs, loading]);

  return {
    logs,
    loading,
    error,
    fetchAllLogs,
    fetchUserLogs,
    fetchMarketLogs,
    getLogsByEvent,
    getRecentLogs,
    getLogsByNetwork,
    // Convenience getters
    marketCreatedLogs: getLogsByEvent('MarketCreated'),
    sharesBoughtLogs: getLogsByEvent('SharesBought'),
    marketResolvedLogs: getLogsByEvent('MarketResolved'),
    winningsClaimedLogs: getLogsByEvent('WinningsClaimed'),
    celoLogs: getLogsByNetwork('CELO_MAINNET'),
    baseLogs: getLogsByNetwork('BASE_MAINNET'),
  };
};

export default useGetLogs;
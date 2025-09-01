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

interface LogData {
  network: string;
  contractAddress: string;
  contractName: string;
  eventName: string;
  blockNumber: bigint;
  transactionHash: string;
  args: any;
  timestamp?: number;
}

class ContractLogFetcher {
  private celoClient: any;
  private baseClient: any;
  private logs: LogData[] = [];

  constructor() {
    // Initialize clients for both networks
    this.celoClient = createPublicClient({
      chain: celo,
      transport: http('https://forno.celo.org', {
        timeout: 30000,
        retryCount: 3,
        retryDelay: 1000,
      }),
    });

    this.baseClient = createPublicClient({
      chain: base,
      transport: http('https://mainnet.base.org', {
        timeout: 30000,
        retryCount: 3,
        retryDelay: 1000,
      }),
    });
  }

  async fetchAllLogs() {
    console.log('🚀 Starting to fetch all contract logs...');
    console.log('📊 Networks: Celo Mainnet, Base Mainnet');
    console.log('📋 Events to fetch:', MARKET_EVENTS.length);
    console.log('');

    try {
      // Fetch logs from Celo Mainnet
      await this.fetchNetworkLogs('CELO_MAINNET', this.celoClient, CONTRACTS.PREDICTION_MARKET_CORE.CELO_MAINNET.address, 'PredictionMarketCore');
      await this.fetchNetworkLogs('CELO_MAINNET', this.celoClient, CONTRACTS.PREDICTION_MARKET_CLAIMS.CELO_MAINNET.address, 'PredictionMarketClaims');

      // Fetch logs from Base Mainnet
      await this.fetchNetworkLogs('BASE_MAINNET', this.baseClient, CONTRACTS.PREDICTION_MARKET_CORE.BASE_MAINNET.address, 'PredictionMarketCore');
      await this.fetchNetworkLogs('BASE_MAINNET', this.baseClient, CONTRACTS.PREDICTION_MARKET_CLAIMS.BASE_MAINNET.address, 'PredictionMarketClaims');

      // Display summary
      this.displaySummary();
      
      // Return all logs for further processing
      return this.logs;
    } catch (error) {
      console.error('❌ Error fetching logs:', error);
      throw error;
    }
  }

  private async fetchNetworkLogs(network: string, client: any, contractAddress: string, contractName: string) {
    console.log(`🔍 Fetching logs from ${network} - ${contractName} (${contractAddress})`);
    
    if (contractAddress === '0x0000000000000000000000000000000000000000') {
      console.log(`⚠️  Skipping ${contractName} on ${network} - contract not deployed (zero address)`);
      return;
    }

    try {
      const currentBlock = await client.getBlockNumber();
      
      // Calculate blocks from 3 weeks ago
      // Assuming ~5 seconds per block on Celo, 3 weeks = 21 * 24 * 60 * 60 / 5 = ~362,880 blocks
      const blocksPerDay = 17280; // 24 * 60 * 60 / 5 seconds per block
      const daysToFetch = 21; // 3 weeks
      const fromBlock = currentBlock - BigInt(blocksPerDay * daysToFetch);
      
      console.log(`📦 Scanning blocks ${fromBlock} to ${currentBlock} (${Number(currentBlock - fromBlock)} blocks)`);

      for (const eventSignature of MARKET_EVENTS) {
        try {
          const eventAbi = parseAbiItem(eventSignature);
          const eventName = (eventAbi as any).name;
          
          console.log(`  📝 Fetching ${eventName} events...`);
          
          const logs = await client.getLogs({
            address: contractAddress,
            event: eventAbi,
            fromBlock,
            toBlock: currentBlock,
          });

          console.log(`    ✅ Found ${logs.length} ${eventName} events`);

          // Process each log
          for (const log of logs) {
            const block = await client.getBlock({ blockNumber: log.blockNumber });
            const timestamp = Number(block.timestamp);

            const logData: LogData = {
              network,
              contractAddress,
              contractName,
              eventName,
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash,
              args: log.args,
              timestamp,
            };

            this.logs.push(logData);
          }

        } catch (eventError) {
          console.log(`    ⚠️  Error fetching ${eventSignature}:`, eventError);
        }
      }

      console.log(`✅ Completed fetching logs from ${network} - ${contractName}`);
      console.log('');

    } catch (error) {
      console.error(`❌ Error fetching logs from ${network} - ${contractName}:`, error);
    }
  }

  private displaySummary() {
    console.log('📊 LOG FETCHING SUMMARY');
    console.log('========================');
    console.log(`Total logs fetched: ${this.logs.length}`);
    console.log('');

    // Group by network
    const networkStats = this.logs.reduce((acc, log) => {
      if (!acc[log.network]) {
        acc[log.network] = { total: 0, events: {} };
      }
      acc[log.network].total++;
      
      if (!acc[log.network].events[log.eventName]) {
        acc[log.network].events[log.eventName] = 0;
      }
      acc[log.network].events[log.eventName]++;
      
      return acc;
    }, {} as Record<string, { total: number; events: Record<string, number> }>);

    Object.entries(networkStats).forEach(([network, stats]) => {
      console.log(`🌐 ${network}: ${stats.total} total events`);
      Object.entries(stats.events).forEach(([event, count]) => {
        console.log(`  📝 ${event}: ${count}`);
      });
      console.log('');
    });

    // Display recent events
    console.log('🕒 RECENT EVENTS (Last 10)');
    console.log('==========================');
    const recentLogs = this.logs
      .sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber))
      .slice(0, 10);

    recentLogs.forEach((log, index) => {
      const date = log.timestamp ? new Date(log.timestamp * 1000).toLocaleString() : 'Unknown';
      console.log(`${index + 1}. [${log.network}] ${log.eventName}`);
      console.log(`   Block: ${log.blockNumber}, Time: ${date}`);
      console.log(`   Contract: ${log.contractName} (${log.contractAddress})`);
      console.log(`   Args:`, log.args);
      console.log(`   TX: ${log.transactionHash}`);
      console.log('');
    });
  }

  // Utility methods for specific queries
  async getUserActivity(userAddress: string) {
    console.log(`👤 Fetching activity for user: ${userAddress}`);
    
    const userLogs = this.logs.filter(log => {
      if (log.args.creator === userAddress) return true;
      if (log.args.buyer === userAddress) return true;
      if (log.args.seller === userAddress) return true;
      if (log.args.resolver === userAddress) return true;
      if (log.args.user === userAddress) return true;
      if (log.args.referrer === userAddress) return true;
      if (log.args.referee === userAddress) return true;
      return false;
    });

    console.log(`Found ${userLogs.length} events for user ${userAddress}`);
    return userLogs;
  }

  async getMarketActivity(marketId: string) {
    console.log(`📊 Fetching activity for market: ${marketId}`);
    
    const marketLogs = this.logs.filter(log => {
      return log.args.marketId?.toString() === marketId;
    });

    console.log(`Found ${marketLogs.length} events for market ${marketId}`);
    return marketLogs;
  }

  async getRecentActivity(hours: number = 24) {
    const cutoffTime = Math.floor(Date.now() / 1000) - (hours * 60 * 60);
    const recentLogs = this.logs.filter(log => log.timestamp && log.timestamp > cutoffTime);
    
    console.log(`🕒 Found ${recentLogs.length} events in the last ${hours} hours`);
    return recentLogs;
  }
}

// Export the class and a convenience function
export { ContractLogFetcher };

// Convenience function to run the log fetcher
export async function fetchAndLogAllContractData() {
  const fetcher = new ContractLogFetcher();
  return await fetcher.fetchAllLogs();
}

// Convenience function to get user activity
export async function fetchUserActivity(userAddress: string) {
  const fetcher = new ContractLogFetcher();
  await fetcher.fetchAllLogs();
  return await fetcher.getUserActivity(userAddress);
}

// Convenience function to get market activity
export async function fetchMarketActivity(marketId: string) {
  const fetcher = new ContractLogFetcher();
  await fetcher.fetchAllLogs();
  return await fetcher.getMarketActivity(marketId);
}

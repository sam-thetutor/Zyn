#!/usr/bin/env node

/**
 * Standalone script to fetch contract logs
 * Run with: node scripts/fetchContractLogs.js
 */

import { createPublicClient, http, parseAbiItem } from 'viem';
import { celo, base } from 'wagmi/chains';

// Contract addresses (update these with your actual deployed addresses)
const CONTRACTS = {
  CELO_MAINNET: {
    core: '0x0C49604c65588858DC206AAC6EFEc0F8Afe2d1d6',
    claims: '0x95B70dD47553f727638257b2A20D63c15b450A4A'
  }
};

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

async function fetchContractLogs() {
  console.log('🚀 Starting to fetch contract logs...');
  
  // Initialize clients
  const celoClient = createPublicClient({
    chain: celo,
    transport: http('https://forno.celo.org'),
  });

 

  const allLogs = [];

  // Fetch from Celo Mainnet
  console.log('\n🔍 Fetching from Celo Mainnet...');
  const celoLogs = await fetchNetworkLogs(celoClient, CONTRACTS.CELO_MAINNET, 'CELO_MAINNET');
  allLogs.push(...celoLogs);

  // Fetch from Base Mainnet
  console.log('\n🔍 Fetching from Base Mainnet...');
  // Note: Base contracts not deployed yet - skipping
  console.log('⚠️  Skipping Base Mainnet - contracts not deployed yet');

  // Display summary
  displaySummary(allLogs);
}

async function fetchNetworkLogs(client, contracts, network) {
  const logs = [];
  const currentBlock = await client.getBlockNumber();
  
  // Calculate blocks from 3 weeks ago
  // Assuming ~5 seconds per block on Celo, 3 weeks = 21 * 24 * 60 * 60 / 5 = ~362,880 blocks
  const blocksPerDay = 17280; // 24 * 60 * 60 / 5 seconds per block
  const daysToFetch = 21; // 3 weeks
  const fromBlock = currentBlock - BigInt(blocksPerDay * daysToFetch);
  
  console.log(`📦 Scanning blocks ${fromBlock} to ${currentBlock} on ${network} (${daysToFetch} days)`);
  console.log(`📅 Time range: ~${new Date(Date.now() - (daysToFetch * 24 * 60 * 60 * 1000)).toLocaleDateString()} to ${new Date().toLocaleDateString()}`);

  for (const [contractType, address] of Object.entries(contracts)) {
    if (address === '0x0000000000000000000000000000000000000000') {
      console.log(`⚠️  Skipping ${contractType} - not deployed`);
      continue;
    }

    console.log(`📋 Fetching from ${contractType} contract: ${address}`);

    for (const eventSignature of MARKET_EVENTS) {
      try {
        const eventAbi = parseAbiItem(eventSignature);
        const eventLogs = await client.getLogs({
          address,
          event: eventAbi,
          fromBlock,
          toBlock: currentBlock,
        });

        console.log(`  ✅ Found ${eventLogs.length} ${eventAbi.name} events`);

        for (const log of eventLogs) {
          const block = await client.getBlock({ blockNumber: log.blockNumber });
          logs.push({
            network,
            contractType,
            contractAddress: address,
            eventName: eventAbi.name,
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            args: log.args,
            timestamp: Number(block.timestamp),
          });
        }
      } catch (error) {
        console.log(`  ⚠️  Error fetching ${eventSignature}:`, error.message);
      }
    }
  }

  return logs;
}

function displaySummary(logs) {
  console.log('\n📊 LOG FETCHING SUMMARY');
  console.log('========================');
  console.log(`Total logs fetched: ${logs.length}`);

  // Group by network
  const networkStats = logs.reduce((acc, log) => {
    if (!acc[log.network]) {
      acc[log.network] = { total: 0, events: {} };
    }
    acc[log.network].total++;
    
    if (!acc[log.network].events[log.eventName]) {
      acc[log.network].events[log.eventName] = 0;
    }
    acc[log.network].events[log.eventName]++;
    
    return acc;
  }, {});

  Object.entries(networkStats).forEach(([network, stats]) => {
    console.log(`\n🌐 ${network}: ${stats.total} total events`);
    Object.entries(stats.events).forEach(([event, count]) => {
      console.log(`  📝 ${event}: ${count}`);
    });
  });

  // Display recent events
  console.log('\n🕒 RECENT EVENTS (Last 10)');
  console.log('==========================');
  const recentLogs = logs
    .sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber))
    .slice(0, 10);

  recentLogs.forEach((log, index) => {
    const date = new Date(log.timestamp * 1000).toLocaleString();
    console.log(`${index + 1}. [${log.network}] ${log.eventName}`);
    console.log(`   Block: ${log.blockNumber}, Time: ${date}`);
    console.log(`   Contract: ${log.contractType} (${log.contractAddress})`);
    console.log(`   Args:`, log.args);
    console.log(`   TX: ${log.transactionHash}`);
    console.log('');
  });

  // Save to file (if logs exist)
  if (logs.length > 0) {
    import('fs').then(fs => {
      const outputPath = './contract-logs.json';
      // Convert BigInts to strings for JSON serialization
      const serializableLogs = logs.map(log => ({
        ...log,
        args: JSON.parse(JSON.stringify(log.args, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        ))
      }));
      fs.writeFileSync(outputPath, JSON.stringify(serializableLogs, null, 2));
      console.log(`💾 Logs saved to ${outputPath}`);
    }).catch(err => {
      console.log('⚠️  Could not save to file:', err.message);
    });
  } else {
    console.log('📝 No logs to save');
  }
}

// Run the script
fetchContractLogs().catch(console.error);

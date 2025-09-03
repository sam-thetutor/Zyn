#!/usr/bin/env node

import { createPublicClient, http, formatEther } from 'viem';
import { celo, base } from 'viem/chains';

// Contract addresses
const CELO_CORE_CONTRACT = '0x2D6614fe45da6Aa7e60077434129a51631AC702A';
const CELO_CLAIMS_CONTRACT = '0xA8479E513D8643001285D9AF6277602B20676B95';

// ABI for getMarketCount function
const CORE_ABI = [
  {
    "inputs": [],
    "name": "getMarketCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMarketCreationFee",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

async function testContractData() {
  console.log('🚀 Testing contract data fetching...\n');

  try {
    // Create public client for Celo
    const celoClient = createPublicClient({
      chain: celo,
      transport: http()
    });

    console.log('📡 Connected to Celo network');
    console.log('📍 Contract address:', CELO_CORE_CONTRACT);

    // Test 1: Get market count
    console.log('\n1️⃣ Testing getMarketCount...');
    try {
      const marketCount = await celoClient.readContract({
        address: CELO_CORE_CONTRACT,
        abi: CORE_ABI,
        functionName: 'getMarketCount',
        args: []
      });
      console.log('✅ Market count:', marketCount.toString());
    } catch (error) {
      console.log('❌ Error fetching market count:', error.message);
    }

    // Test 2: Get market creation fee
    console.log('\n2️⃣ Testing getMarketCreationFee...');
    try {
      const creationFee = await celoClient.readContract({
        address: CELO_CORE_CONTRACT,
        abi: CORE_ABI,
        functionName: 'getMarketCreationFee',
        args: []
      });
      console.log('✅ Market creation fee:', formatEther(creationFee), 'CELO');
    } catch (error) {
      console.log('❌ Error fetching creation fee:', error.message);
    }

    // Test 3: Try to get a specific market (if any exist)
    console.log('\n3️⃣ Testing getMarket (if markets exist)...');
    try {
      const marketCount = await celoClient.readContract({
        address: CELO_CORE_CONTRACT,
        abi: CORE_ABI,
        functionName: 'getMarketCount',
        args: []
      });

      if (marketCount > 0n) {
        // Try to get the first market
        const marketABI = [
          {
            "inputs": [{"internalType": "uint256", "name": "marketId", "type": "uint256"}],
            "name": "getMarket",
            "outputs": [
              {"internalType": "string", "name": "question", "type": "string"},
              {"internalType": "uint256", "name": "endTime", "type": "uint256"},
              {"internalType": "uint256", "name": "totalPool", "type": "uint256"},
              {"internalType": "uint256", "name": "totalYes", "type": "uint256"},
              {"internalType": "uint256", "name": "totalNo", "type": "uint256"},
              {"internalType": "uint8", "name": "status", "type": "uint8"},
              {"internalType": "bool", "name": "outcome", "type": "bool"},
              {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
              {"internalType": "address", "name": "creator", "type": "address"}
            ],
            "stateMutability": "view",
            "type": "function"
          }
        ];

        const market = await celoClient.readContract({
          address: CELO_CORE_CONTRACT,
          abi: marketABI,
          functionName: 'getMarket',
          args: [1n] // Try to get market ID 1
        });
        console.log('✅ First market data:', market);
      } else {
        console.log('ℹ️ No markets found on contract');
      }
    } catch (error) {
      console.log('❌ Error fetching market data:', error.message);
    }

    // Test 4: Check if we can connect to Base network
    console.log('\n4️⃣ Testing Base network connection...');
    try {
      const baseClient = createPublicClient({
        chain: base,
        transport: http()
      });
      console.log('✅ Connected to Base network');
      
      // Try to get block number to test connection
      const blockNumber = await baseClient.getBlockNumber();
      console.log('✅ Base block number:', blockNumber.toString());
    } catch (error) {
      console.log('❌ Error connecting to Base:', error.message);
    }

  } catch (error) {
    console.log('❌ General error:', error.message);
  }

  console.log('\n🏁 Test completed!');
}

// Run the test
testContractData().catch(console.error);

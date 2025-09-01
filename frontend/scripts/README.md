# Contract Log Fetcher Scripts

This directory contains scripts to fetch and analyze logs from the deployed smart contracts.

## 🚀 Quick Start

### Option 1: Browser Console (Recommended)
1. Open your browser and navigate to the Zyn app
2. Open Developer Tools (F12)
3. Go to the Console tab
4. Copy and paste this code:

```javascript
// Import and run the log fetcher
import('./src/utils/fetchContractLogs.ts').then(async (module) => {
  const { fetchAndLogAllContractData } = module;
  await fetchAndLogAllContractData();
}).catch(console.error);
```

### Option 2: Debug Component
1. The `DebugContractLogs` component is already added to the Profile page
2. Navigate to `/profile` in the app
3. Look for the debug panel in the bottom-right corner
4. Click "Fetch All Contract Logs" to start

### Option 3: Command Line Script
```bash
cd frontend
node scripts/fetchContractLogs.js
```

## 📊 What the Scripts Do

The scripts will:
1. **Connect to both Celo and Base networks**
2. **Fetch all event logs** from the last 10,000 blocks
3. **Parse and categorize events** by type
4. **Display a summary** of all activities
5. **Show recent events** with timestamps
6. **Save results** to a JSON file (command line version)

## 🔍 Event Types Tracked

- `MarketCreated` - New prediction markets
- `SharesBought` - Users buying shares
- `SharesSold` - Users selling shares
- `MarketResolved` - Markets being resolved
- `WinningsClaimed` - Users claiming winnings
- `FeeUpdated` - Fee changes
- `AdminChanged` - Admin address changes
- `ReferralReward` - Referral rewards

## 🛠️ Troubleshooting

### No Data Showing?
1. **Check contract addresses** in `constants.ts`
2. **Verify network connection** - ensure you're on Celo or Base
3. **Check browser console** for error messages
4. **Verify contracts are deployed** on the target networks

### Common Issues:
- **Zero addresses**: Contracts not deployed yet
- **RPC errors**: Network connectivity issues
- **No events**: Contracts haven't been used yet
- **Wrong network**: User connected to wrong chain

## 📝 Output Format

The scripts output structured data including:
- Network (CELO_MAINNET/BASE_MAINNET)
- Contract address and type
- Event name and arguments
- Block number and timestamp
- Transaction hash

## 🎯 Use Cases

- **Debug profile page issues**
- **Monitor contract activity**
- **Track user interactions**
- **Audit market creation and resolution**
- **Analyze trading patterns**

## 🔧 Customization

To modify the scripts:
1. Update contract addresses in `constants.ts`
2. Add new event signatures to `MARKET_EVENTS`
3. Modify the block range (currently 10,000 blocks)
4. Add custom filtering logic

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify your network connection
3. Ensure contracts are properly deployed
4. Check that RPC endpoints are accessible

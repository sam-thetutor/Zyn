// Browser Console Script to Fetch Contract Logs
// Copy and paste this into your browser console while on the Zyn app

console.log('🔧 Loading Contract Log Fetcher...');

// Import the fetchContractLogs utility
import('./fetchContractLogs.ts').then(async (module) => {
  const { fetchAndLogAllContractData, fetchUserActivity, fetchMarketActivity } = module;
  
  // Make functions available globally for console access
  (window as any).fetchAllLogs = fetchAndLogAllContractData;
  (window as any).fetchUserLogs = fetchUserActivity;
  (window as any).fetchMarketLogs = fetchMarketActivity;
  
  console.log('✅ Contract Log Fetcher loaded!');
  console.log('');
  console.log('📋 Available functions:');
  console.log('  - fetchAllLogs() - Fetch all contract logs');
  console.log('  - fetchUserLogs("0x...") - Fetch logs for specific user');
  console.log('  - fetchMarketLogs("123") - Fetch logs for specific market');
  console.log('');
  console.log('🚀 Run fetchAllLogs() to start fetching all contract data...');
}).catch(error => {
  console.error('❌ Failed to load Contract Log Fetcher:', error);
  console.log('');
  console.log('💡 Alternative: Create a temporary component to run this script');
});

// Alternative: Direct execution (if import fails)
console.log('💡 If import fails, you can also run this directly:');
console.log('1. Open the Network tab in DevTools');
console.log('2. Look for requests to the contract addresses');
console.log('3. Check the Console for any error messages');
console.log('4. Verify the contract addresses in constants.ts');

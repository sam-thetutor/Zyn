// Simulate the frontend time calculation
const now = Math.floor(Date.now() / 1000);
console.log("Frontend current time:", now);
console.log("Frontend current date:", new Date(now * 1000).toISOString());

// Market end times from the contract
const marketEndTimes = [
    1757000315, // Market 24
    1757101126, // Market 25  
    1757464736  // Market 26
];

marketEndTimes.forEach((endTime, index) => {
    const marketId = 24 + index;
    const timeRemaining = Math.max(0, endTime - now);
    const isEnded = timeRemaining <= 0;
    const endDate = new Date(endTime * 1000);
    
    console.log(`\nMarket ${marketId}:`);
    console.log(`  End time: ${endDate.toISOString()}`);
    console.log(`  Time remaining: ${timeRemaining} seconds`);
    console.log(`  Is ended (frontend): ${isEnded}`);
});

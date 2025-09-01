const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Resolving Existing Markets");
    console.log("=============================\n");

    // Get signers
    const [admin] = await ethers.getSigners();
    console.log(`👑 Admin: ${admin.address}`);
    
    // Connect to contract
    const contractAddress = "0x0101e93BAe8dfA2F59ecd6E7A52B9bF38c9367A4";
    console.log(`🔗 Contract Address: ${contractAddress}`);
    
    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    const predictionMarket = PredictionMarket.attach(contractAddress);
    console.log("✅ Connected to contract\n");

    // Get current blockchain timestamp
    const currentBlock = await admin.provider.getBlock("latest");
    const currentTimestamp = currentBlock.timestamp;
    console.log(`⏰ Current blockchain time: ${new Date(currentTimestamp * 1000).toLocaleString()}\n`);

    // Check market count
    const marketCount = await predictionMarket.getMarketCount();
    console.log(`📊 Total markets: ${marketCount}\n`);

    // Check each market and resolve if ready
    for (let i = 1; i <= marketCount; i++) {
        try {
            const market = await predictionMarket.markets(i);
            console.log(`🏪 Market ${i}: ${market.question}`);
            console.log(`   End Time: ${new Date(Number(market.endTime) * 1000).toLocaleString()}`);
            console.log(`   Status: ${market.status === 0 ? 'ACTIVE' : market.status === 1 ? 'RESOLVED' : 'CANCELLED'}`);
            console.log(`   Total Pool: ${ethers.formatEther(market.totalPool)} CELO`);
            
            const timeUntilEnd = Number(market.endTime) - currentTimestamp;
            if (timeUntilEnd > 0) {
                console.log(`   ⏰ Time until end: ${timeUntilEnd} seconds`);
                console.log(`   ⏳ Waiting for market to end...`);
                
                // Wait for market to end
                const waitTime = Math.max(0, timeUntilEnd + 5); // 5 second buffer
                await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
                console.log(`   ✅ Market has ended`);
            }
            
            // Resolve market if not already resolved
            if (market.status === 0) {
                // Determine outcome based on market ID for testing
                let outcome;
                if (i === 1) outcome = true;   // Market 1: YES wins
                else if (i === 2) outcome = false; // Market 2: NO wins
                else if (i === 3) outcome = true;  // Market 3: YES wins
                else outcome = false;              // Market 4: NO wins
                
                console.log(`   🔍 Resolving as ${outcome ? 'YES' : 'NO'}...`);
                const resolveTx = await predictionMarket.connect(admin).resolveMarket(i, outcome);
                await resolveTx.wait();
                console.log(`   ✅ Market resolved successfully`);
                
                // Wait for blockchain state to update
                await new Promise(resolve => setTimeout(resolve, 3000));
            } else {
                console.log(`   ✅ Already resolved`);
            }
            console.log();
            
        } catch (error) {
            console.log(`❌ Error with Market ${i}: ${error.message}\n`);
        }
    }

    // Display final market statuses
    console.log("📊 Final Market Statuses:");
    console.log("========================\n");
    
    for (let i = 1; i <= marketCount; i++) {
        try {
            const market = await predictionMarket.markets(i);
            const winners = await predictionMarket.getMarketWinners(i);
            
            console.log(`🏪 Market ${i}: ${market.question}`);
            console.log(`   Status: ${market.status === 0 ? 'ACTIVE' : market.status === 1 ? 'RESOLVED' : 'CANCELLED'}`);
            console.log(`   Outcome: ${market.outcome ? 'YES' : 'NO'}`);
            console.log(`   Total Pool: ${ethers.formatEther(market.totalPool)} CELO`);
            console.log(`   Winners: ${winners.length}`);
            console.log(`   Category: ${market.category || 'Unknown'}`);
            console.log();
        } catch (error) {
            console.log(`❌ Error getting Market ${i} data: ${error.message}\n`);
        }
    }

    console.log("🎉 Market resolution completed!");
    console.log("📱 You can now view these resolved markets on the frontend!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

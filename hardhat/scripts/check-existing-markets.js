const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Checking Existing Markets in Deployed Contract");
    console.log("================================================\n");

    // Get signers
    const [admin] = await ethers.getSigners();
    
    // Connect to deployed contract
    const contractAddress = "0x349Af029010e91F0E99d4ECf5a1cB9456703BA58";
    console.log(`🔗 Contract Address: ${contractAddress}`);
    
    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    const predictionMarket = PredictionMarket.attach(contractAddress);
    console.log("✅ Connected to contract\n");

    // Get current blockchain timestamp
    const currentBlock = await admin.provider.getBlock("latest");
    const currentTimestamp = currentBlock.timestamp;
    console.log(`⏰ Current blockchain time: ${new Date(currentTimestamp * 1000).toLocaleString()}`);
    console.log(`⏰ Current timestamp: ${currentTimestamp}\n`);

    // Check if there are any existing markets
    try {
        const marketCount = await predictionMarket._marketIds();
        console.log(`📊 Total markets created: ${marketCount}\n`);
        
        if (marketCount > 0) {
            console.log("🏪 Existing Markets:");
            console.log("==================\n");
            
            for (let i = 1; i <= marketCount; i++) {
                try {
                    const market = await predictionMarket.markets(i);
                    console.log(`Market ${i}:`);
                    console.log(`   Question: ${market.question}`);
                    console.log(`   End Time: ${market.endTime}`);
                    console.log(`   End Time (readable): ${new Date(Number(market.endTime) * 1000).toLocaleString()}`);
                    console.log(`   Status: ${market.status}`);
                    console.log(`   Total Pool: ${ethers.formatEther(market.totalPool)} CELO`);
                    
                    // Check if market has ended
                    const timeUntilEnd = Number(market.endTime) - currentTimestamp;
                    if (timeUntilEnd > 0) {
                        console.log(`   ⏰ Time until end: ${timeUntilEnd} seconds`);
                        console.log(`   ✅ Market is still active`);
                    } else {
                        console.log(`   ⏰ Market ended ${Math.abs(timeUntilEnd)} seconds ago`);
                        console.log(`   ❌ Market has ended`);
                    }
                    console.log();
                } catch (error) {
                    console.log(`❌ Error reading Market ${i}: ${error.message}\n`);
                }
            }
        } else {
            console.log("📭 No markets found in contract");
        }
    } catch (error) {
        console.log(`❌ Error getting market count: ${error.message}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

const { ethers } = require("hardhat");

async function main() {
    console.log("🐛 Debugging Market Creation Issue");
    console.log("==================================\n");

    // Get signers
    const [admin] = await ethers.getSigners();
    console.log(`👑 Admin: ${admin.address}`);
    
    // Connect to deployed contract
    const contractAddress = "0x349Af029010e91F0E99d4ECf5a1cB9456703BA58";
    console.log(`🔗 Connecting to deployed contract: ${contractAddress}`);
    
    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    const predictionMarket = PredictionMarket.attach(contractAddress);
    console.log("✅ Connected to contract\n");

    // Get current blockchain timestamp
    const currentBlock = await admin.provider.getBlock("latest");
    const currentTimestamp = currentBlock.timestamp;
    console.log(`⏰ Current blockchain time: ${new Date(currentTimestamp * 1000).toLocaleString()}`);
    console.log(`⏰ Current timestamp: ${currentTimestamp}\n`);

    // Create a simple market
    console.log("🏪 Creating a test market...");
    const creationFee = await predictionMarket.marketCreationFee();
    const endTime = currentTimestamp + 600; // 10 minutes from now
    
    console.log(`📅 End time: ${new Date(endTime * 1000).toLocaleString()}`);
    console.log(`📅 End timestamp: ${endTime}`);
    console.log(`⏱️  Time until end: ${endTime - currentTimestamp} seconds\n`);
    
    const createTx = await predictionMarket.connect(admin).createMarket(
        "Debug Test Market",
        "Testing market creation",
        "Test",
        "https://example.com/test.jpg",
        endTime,
        { value: creationFee }
    );
    
    await createTx.wait();
    console.log("✅ Market created successfully\n");

    // Check market status immediately
    console.log("🔍 Checking market status...");
    const market = await predictionMarket.markets(1);
    console.log(`   Market ID: ${market.id}`);
    console.log(`   Question: ${market.question}`);
    console.log(`   End Time: ${market.endTime}`);
    console.log(`   End Time (readable): ${new Date(market.endTime * 1000).toLocaleString()}`);
    console.log(`   Status: ${market.status}`);
    console.log(`   Total Pool: ${ethers.formatEther(market.totalPool)} CELO\n`);

    // Check if market has ended
    const currentBlockAfter = await admin.provider.getBlock("latest");
    const currentTimestampAfter = currentBlockAfter.timestamp;
    console.log(`⏰ Current time after creation: ${new Date(currentTimestampAfter * 1000).toLocaleString()}`);
    console.log(`⏰ Current timestamp after creation: ${currentTimestampAfter}`);
    console.log(`⏱️  Time until end: ${market.endTime - currentTimestampAfter} seconds\n`);

    // Try to buy shares
    console.log("🛒 Attempting to buy shares...");
    try {
        const buyTx = await predictionMarket.connect(admin).buyShares(1, true, { value: ethers.parseEther("0.01") });
        await buyTx.wait();
        console.log("✅ Successfully bought shares!");
    } catch (error) {
        console.log(`❌ Failed to buy shares: ${error.message}`);
        
        // Check if it's because market has ended
        if (error.message.includes("Market has ended")) {
            console.log("\n🔍 Market has ended error detected. Let's investigate:");
            
            // Check the exact end time again
            const marketAgain = await predictionMarket.markets(1);
            console.log(`   Market end time: ${marketAgain.endTime}`);
            console.log(`   Current time: ${currentTimestampAfter}`);
            console.log(`   Difference: ${marketAgain.endTime - currentTimestampAfter} seconds`);
            
            // Check if there's a timezone or conversion issue
            console.log(`   Market end time (Date): ${new Date(marketAgain.endTime * 1000)}`);
            console.log(`   Current time (Date): ${new Date(currentTimestampAfter * 1000)}`);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

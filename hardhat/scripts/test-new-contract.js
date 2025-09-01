const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 Testing New Contract");
    console.log("=======================\n");

    // Get signers
    const [admin] = await ethers.getSigners();
    console.log(`👑 Admin: ${admin.address}`);
    
    // Connect to new contract
    const contractAddress = "0x0101e93BAe8dfA2F59ecd6E7A52B9bF38c9367A4";
    console.log(`🔗 Contract Address: ${contractAddress}`);
    
    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    const predictionMarket = PredictionMarket.attach(contractAddress);
    console.log("✅ Connected to contract\n");

    // Get current blockchain timestamp
    const currentBlock = await admin.provider.getBlock("latest");
    const currentTimestamp = currentBlock.timestamp;
    console.log(`⏰ Current blockchain time: ${new Date(currentTimestamp * 1000).toLocaleString()}`);
    console.log(`⏰ Current timestamp: ${currentTimestamp}\n`);

    // Check market count
    const marketCount = await predictionMarket.getMarketCount();
    console.log(`📊 Current market count: ${marketCount}\n`);

    // Create a test market
    console.log("🏪 Creating a test market...");
    const creationFee = await predictionMarket.marketCreationFee();
    const endTime = currentTimestamp + 600; // 10 minutes from now
    
    console.log(`📅 End time: ${new Date(endTime * 1000).toLocaleString()}`);
    console.log(`📅 End timestamp: ${endTime}`);
    console.log(`⏱️  Time until end: ${endTime - currentTimestamp} seconds\n`);
    
    const createTx = await predictionMarket.connect(admin).createMarket(
        "Test Market - Will Bitcoin reach $100k?",
        "A simple test market",
        "Test",
        "https://example.com/test.jpg",
        endTime,
        { value: creationFee }
    );
    
    await createTx.wait();
    console.log("✅ Market created successfully\n");

    // Check new market count
    const newMarketCount = await predictionMarket.getMarketCount();
    console.log(`📊 New market count: ${newMarketCount}\n`);

    // Check market details
    console.log("🔍 Checking market details...");
    const market = await predictionMarket.markets(1);
    console.log(`   Market ID: ${market.id}`);
    console.log(`   Question: ${market.question}`);
    console.log(`   End Time: ${market.endTime}`);
    console.log(`   End Time (readable): ${new Date(Number(market.endTime) * 1000).toLocaleString()}`);
    console.log(`   Status: ${market.status}`);
    console.log(`   Total Pool: ${ethers.formatEther(market.totalPool)} CELO\n`);

    // Try to buy shares
    console.log("🛒 Attempting to buy shares...");
    try {
        const buyTx = await predictionMarket.connect(admin).buyShares(1, true, { value: ethers.parseEther("0.01") });
        await buyTx.wait();
        console.log("✅ Successfully bought shares!");
        
        // Check updated market data
        const updatedMarket = await predictionMarket.markets(1);
        console.log(`   Updated Total Pool: ${ethers.formatEther(updatedMarket.totalPool)} CELO`);
        console.log(`   Updated Total Yes: ${ethers.formatEther(updatedMarket.totalYes)} CELO`);
        
    } catch (error) {
        console.log(`❌ Failed to buy shares: ${error.message}`);
    }

    console.log("\n🎉 Test completed successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

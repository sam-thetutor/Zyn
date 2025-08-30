const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying Streamlined PredictionMarket Contract");
    console.log("==================================================\n");

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);
    
    // Get balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "CELO");
    
    // Deploy the PredictionMarketStreamlined contract
    console.log("📦 Deploying PredictionMarketStreamlined contract...");
    const PredictionMarketStreamlined = await ethers.getContractFactory("PredictionMarketStreamlined");
    
    // Estimate gas first
    const deploymentData = PredictionMarketStreamlined.interface.encodeDeploy();
    const estimatedGas = await ethers.provider.estimateGas({
        from: deployer.address,
        data: deploymentData
    });
    console.log("⛽ Estimated gas:", estimatedGas.toString());
    
    const predictionMarket = await PredictionMarketStreamlined.deploy({
        gasLimit: 500000 // Set much higher gas limit
    });
    
    await predictionMarket.waitForDeployment();
    const contractAddress = await predictionMarket.getAddress();
    console.log("✅ PredictionMarketStreamlined deployed to:", contractAddress);
    
    // Test basic functionality
    console.log("🧪 Testing basic functionality...");
    
    // Test username functionality
    console.log("👤 Testing username functionality...");
    const username = "admin_user";
    await predictionMarket.setUsername(username);
    console.log("✅ Username set successfully:", username);
    
    // Check username
    const retrievedUsername = await predictionMarket.getUsername(deployer.address);
    console.log("📝 Retrieved username:", retrievedUsername);
    
    // Check if username is available
    const isAvailable = await predictionMarket.isUsernameAvailable("newuser456");
    console.log("🔍 New username available:", isAvailable);
    
    // Test market creation
    console.log("🏪 Testing market creation...");
    const creationFee = await predictionMarket.marketCreationFee();
    const endTime = Math.floor(Date.now() / 1000) + 120; // 2 minutes from now
    
    const createTx = await predictionMarket.createMarket(
        "Test Market - Will Bitcoin reach $100k?",
        "A test market for functionality testing",
        "Test",
        "https://example.com/test.jpg",
        endTime,
        { value: creationFee }
    );
    
    await createTx.wait();
    console.log("✅ Market created successfully");
    
    // Check market count
    const marketCount = await predictionMarket.getMarketCount();
    console.log("📊 Market count:", marketCount.toString());
    
    // Test buying shares
    console.log("🛒 Testing share purchase...");
    const shareAmount = ethers.parseEther("0.01");
    
    const buyTx = await predictionMarket.buyShares(1, true, { value: shareAmount });
    await buyTx.wait();
    console.log("✅ Shares purchased successfully");
    
    // Check user shares
    const userShares = await predictionMarket.getUserShares(1, deployer.address, true);
    console.log("📈 User YES shares:", ethers.formatEther(userShares), "CELO");
    
    // Test getAllParticipants
    console.log("👥 Testing participant tracking...");
    const participants = await predictionMarket.getAllParticipants(1);
    console.log("📊 Participants count:", participants.addresses.length);
    
    console.log("\n🎉 All tests completed successfully!");
    console.log("📱 Contract ready for frontend integration!");
    console.log(`🔗 Contract Address: ${contractAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });

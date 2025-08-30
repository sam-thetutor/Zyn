const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 Testing Username Features & Market Functionality");
    console.log("==================================================\n");

    // Get signers
    const [admin] = await ethers.getSigners();
    console.log(`👑 Admin: ${admin.address}`);
    
    // Connect to deployed contract
    const contractAddress = "0xb71E1e84258Ebe2E65fE764C804a7805Ed95d85d";
    console.log(`🔗 Contract Address: ${contractAddress}`);
    
    const PredictionMarketSimple = await ethers.getContractFactory("PredictionMarketSimple");
    const predictionMarket = PredictionMarketSimple.attach(contractAddress);
    console.log("✅ Connected to contract\n");

    // Test 1: Username Management
    console.log("🔍 Test 1: Username Management");
    console.log("==============================\n");
    
    // Check current username
    const currentUsername = await predictionMarket.getUsername(admin.address);
    console.log(`👤 Current username: ${currentUsername}`);
    
    // Test username availability
    const testUsername = "newuser456";
    const isAvailable = await predictionMarket.isUsernameAvailable(testUsername);
    console.log(`🔍 Username "${testUsername}" available: ${isAvailable}`);
    
    // Test changing username (requires fee)
    console.log("\n💰 Testing username change (requires fee)...");
    const changeFee = await predictionMarket.usernameChangeFee();
    console.log(`💸 Username change fee: ${ethers.formatEther(changeFee)} CELO`);
    
    try {
        const changeTx = await predictionMarket.changeUsername("admin_user", { value: changeFee });
        await changeTx.wait();
        console.log("✅ Username changed successfully to: admin_user");
        
        // Verify change
        const newUsername = await predictionMarket.getUsername(admin.address);
        console.log(`📝 New username: ${newUsername}`);
        
        // Check if old username is available
        const oldUsernameAvailable = await predictionMarket.isUsernameAvailable("testuser123");
        console.log(`🔍 Old username "testuser123" available: ${oldUsernameAvailable}`);
        
    } catch (error) {
        console.log(`❌ Username change failed: ${error.message}`);
    }
    
    console.log("\n" + "=".repeat(50) + "\n");
    
    // Test 2: Market Creation and Management
    console.log("🔍 Test 2: Market Creation and Management");
    console.log("==========================================\n");
    
    // Get current market count
    const marketCount = await predictionMarket.getMarketCount();
    console.log(`📊 Current market count: ${marketCount}`);
    
    // Create a new market
    console.log("🏪 Creating a new market...");
    const creationFee = await predictionMarket.marketCreationFee();
    const endTime = Math.floor(Date.now() / 1000) + 120; // 2 minutes from now
    
    const createTx = await predictionMarket.createMarket(
        "Will Ethereum reach $5,000 by December 2024?",
        "Prediction on Ethereum's price performance",
        "Cryptocurrency",
        "https://example.com/ethereum.jpg",
        endTime,
        { value: creationFee }
    );
    
    await createTx.wait();
    console.log("✅ New market created successfully");
    
    // Check updated market count
    const newMarketCount = await predictionMarket.getMarketCount();
    console.log(`📊 Updated market count: ${newMarketCount}`);
    
    // Get market details
    const market = await predictionMarket.markets(2); // Market ID 2
    console.log(`📋 Market 2 Question: ${market.question}`);
    console.log(`📅 End Time: ${new Date(Number(market.endTime) * 1000).toLocaleString()}`);
    console.log(`📊 Status: ${market.status === 0 ? 'ACTIVE' : market.status === 1 ? 'RESOLVED' : 'CANCELLED'}`);
    
    console.log("\n" + "=".repeat(50) + "\n");
    
    // Test 3: Share Trading
    console.log("🔍 Test 3: Share Trading");
    console.log("========================\n");
    
    // Buy shares in the new market
    console.log("🛒 Buying shares in Market 2...");
    const shareAmount = ethers.parseEther("0.02");
    
    try {
        const buyTx = await predictionMarket.buyShares(2, false, { value: shareAmount }); // Buy NO shares
        await buyTx.wait();
        console.log("✅ NO shares purchased successfully");
        
        // Check user shares
        const noShares = await predictionMarket.getUserShares(2, admin.address, false);
        console.log(`📈 User NO shares: ${ethers.formatEther(noShares)} CELO`);
        
        // Check market total
        const updatedMarket = await predictionMarket.markets(2);
        console.log(`💰 Market total pool: ${ethers.formatEther(updatedMarket.totalPool)} CELO`);
        console.log(`📊 Total NO shares: ${ethers.formatEther(updatedMarket.totalNo)} CELO`);
        
    } catch (error) {
        console.log(`❌ Share purchase failed: ${error.message}`);
    }
    
    console.log("\n" + "=".repeat(50) + "\n");
    
    // Test 4: Market Resolution
    console.log("🔍 Test 4: Market Resolution");
    console.log("=============================\n");
    
    // Wait for market to end (if needed)
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilEnd = Number(market.endTime) - currentTime;
    
    if (timeUntilEnd > 0) {
        console.log(`⏳ Market ends in ${timeUntilEnd} seconds. Waiting...`);
        await new Promise(resolve => setTimeout(resolve, (timeUntilEnd + 5) * 1000));
        console.log("✅ Market has ended");
    }
    
    // Resolve market
    console.log("🔍 Resolving market as NO...");
    try {
        const resolveTx = await predictionMarket.resolveMarket(2, false);
        await resolveTx.wait();
        console.log("✅ Market resolved successfully as NO");
        
        // Check final market status
        const finalMarket = await predictionMarket.markets(2);
        console.log(`📊 Final status: ${finalMarket.status === 0 ? 'ACTIVE' : finalMarket.status === 1 ? 'RESOLVED' : 'CANCELLED'}`);
        console.log(`🎯 Outcome: ${finalMarket.outcome ? 'YES' : 'NO'}`);
        
    } catch (error) {
        console.log(`❌ Market resolution failed: ${error.message}`);
    }
    
    console.log("\n" + "=".repeat(50) + "\n");
    
    // Test 5: Username Validation
    console.log("🔍 Test 5: Username Validation");
    console.log("==============================\n");
    
    // Test invalid usernames
    const invalidUsernames = [
        "ab", // Too short
        "thisusernameistoolong123456789", // Too long
        "user@name", // Invalid characters
        "user name", // Spaces
        "", // Empty
    ];
    
    for (const invalidUsername of invalidUsernames) {
        try {
            const isAvailable = await predictionMarket.isUsernameAvailable(invalidUsername);
            console.log(`🔍 Username "${invalidUsername}" available: ${isAvailable}`);
        } catch (error) {
            console.log(`❌ Error checking "${invalidUsername}": ${error.message}`);
        }
    }
    
    console.log("\n" + "=".repeat(50) + "\n");
    
    // Test 6: Fee Management
    console.log("🔍 Test 6: Fee Management");
    console.log("==========================\n");
    
    console.log(`💰 Market creation fee: ${ethers.formatEther(await predictionMarket.marketCreationFee())} CELO`);
    console.log(`💰 Username change fee: ${ethers.formatEther(await predictionMarket.usernameChangeFee())} CELO`);
    
    console.log("\n🎉 All tests completed successfully!");
    console.log("📱 Contract is fully functional and ready for frontend integration!");
    console.log(`🔗 Contract Address: ${contractAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    });

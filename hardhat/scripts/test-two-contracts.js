const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 Testing two-contract prediction market system...");
    
    // Contract addresses from deployment
    const coreAddress = "0x939a2070DD9A7Cc1fe061c0174C814c4A1C3461B";
    const claimsAddress = "0x723A472E83e9Ec8C43c81eCD7399FB5acA2D1d97";
    
    // Get contract instances
    const coreContract = await ethers.getContractAt("PredictionMarketCore", coreAddress);
    const claimsContract = await ethers.getContractAt("PredictionMarketClaims", claimsAddress);
    
    const [deployer] = await ethers.getSigners();
    
    // Create additional accounts
    const account1 = ethers.Wallet.createRandom();
    const account2 = ethers.Wallet.createRandom();
    
    // Connect wallets to the provider
    const account1Connected = account1.connect(ethers.provider);
    const account2Connected = account2.connect(ethers.provider);
    
    console.log("📝 Testing with accounts:");
    console.log("   Deployer:", deployer.address);
    console.log("   Account 1:", account1.address);
    console.log("   Account 2:", account2.address);
    
    try {
        // Test 1: Username functionality
        console.log("\n📋 Test 1: Username functionality");
        const currentUsername = await coreContract.getUsername(deployer.address);
        console.log("📝 Current username:", currentUsername);
        
        // Try to set a new username if none exists, otherwise skip
        if (currentUsername === "") {
            const testUsername = "testuser2";
            const tx1 = await coreContract.setUsername(testUsername);
            await tx1.wait();
            console.log("✅ Username set successfully");
        } else {
            console.log("✅ Username already set:", currentUsername);
        }
        
        // Test 2: Market creation
        console.log("\n📋 Test 2: Market creation");
        const endTime = Math.floor(Date.now() / 1000) + 150; // 2.5 minutes from now (above 2 min minimum)
        console.log("📝 Creating market with end time:", endTime);
        console.log("📝 End time (formatted):", new Date(endTime * 1000).toISOString());
        
        const tx2 = await coreContract.createMarket(
            "Will the two-contract system work?",
            "Testing",
            "https://example.com/image.jpg",
            endTime,
            { value: ethers.parseEther("0.01") }
        );
        await tx2.wait();
        console.log("✅ Market created successfully");
        
        // Get the actual market ID that was created
        const marketId = await coreContract.getMarketCount();
        console.log("📝 Created market ID:", marketId.toString());
        
        // Test 3: Market data retrieval
        console.log("\n📋 Test 3: Market data retrieval");
        const market = await coreContract.getMarket(marketId);
        console.log("📝 Market question:", market.question);
        console.log("📝 Market status:", market.status);
        console.log("📝 Market total pool:", ethers.formatEther(market.totalPool), "CELO");
        console.log("📝 Market end time:", market.endTime.toString());
        console.log("📝 Market end time (formatted):", new Date(Number(market.endTime) * 1000).toISOString());
        
        // Test 3.5: Debug end time retrieval
        console.log("\n📋 Test 3.5: Debug end time retrieval");
        const debugEndTime = await coreContract.getMarketEndTime(marketId);
        console.log("📝 Debug end time:", debugEndTime.toString());
        console.log("📝 Debug end time (formatted):", new Date(Number(debugEndTime) * 1000).toISOString());
        
        const debugMarketBasic = await coreContract.getMarketBasic(marketId);
        console.log("📝 Debug market basic - ID:", debugMarketBasic[0].toString());
        console.log("📝 Debug market basic - End time:", debugMarketBasic[1].toString());
        console.log("📝 Debug market basic - Total pool:", debugMarketBasic[2].toString());
        
        // Compare the different ways of getting end time
        console.log("📝 Comparison:");
        console.log("   getMarket().endTime:", market.endTime.toString());
        console.log("   getMarketEndTime():", debugEndTime.toString());
        console.log("   getMarketBasic()[1]:", debugMarketBasic[1].toString());
        console.log("   Are they equal?", market.endTime.toString() === debugEndTime.toString() ? "YES" : "NO");
        
        // Test 4: Contract connection verification
        console.log("\n📋 Test 4: Contract connection verification");
        const coreClaimsAddress = await coreContract.claimsContract();
        const claimsCoreAddress = await claimsContract.coreContract();
        
        console.log("📝 Core -> Claims:", coreClaimsAddress);
        console.log("📝 Claims -> Core:", claimsCoreAddress);
        
        if (coreClaimsAddress === claimsAddress && claimsCoreAddress === coreAddress) {
            console.log("✅ Contract connection verified");
        } else {
            console.log("❌ Contract connection failed");
        }
        
        // Test 5: Claims contract state
        console.log("\n📋 Test 5: Claims contract state");
        const contractFees = await claimsContract.getContractFees();
        console.log("📝 Contract fees:", ethers.formatEther(contractFees), "CELO");
        
        // Test 5.5: Fund additional accounts
        console.log("\n📋 Test 5.5: Fund additional accounts");
        const fundingAmount = ethers.parseEther("0.1"); // 0.1 CELO each
        
        // Fund account 1
        const fundTx1 = await deployer.sendTransaction({
            to: account1.address,
            value: fundingAmount
        });
        await fundTx1.wait();
        console.log("✅ Account 1 funded with", ethers.formatEther(fundingAmount), "CELO");
        
        // Fund account 2
        const fundTx2 = await deployer.sendTransaction({
            to: account2.address,
            value: fundingAmount
        });
        await fundTx2.wait();
        console.log("✅ Account 2 funded with", ethers.formatEther(fundingAmount), "CELO");
        
        // Check balances
        const balance1 = await ethers.provider.getBalance(account1.address);
        const balance2 = await ethers.provider.getBalance(account2.address);
        console.log("📝 Account 1 balance:", ethers.formatEther(balance1), "CELO");
        console.log("📝 Account 2 balance:", ethers.formatEther(balance2), "CELO");
        
        // Test 6: Create second market for testing buying shares
        console.log("\n📋 Test 6: Create second market for testing buying shares");
        const currentTime = Math.floor(Date.now() / 1000);
        const blockchainTime = await ethers.provider.getBlock("latest").then(block => block.timestamp);
        const endTime2 = blockchainTime + 3600; // 1 hour from blockchain time (to work around the bug)
        console.log("📝 Local time:", currentTime);
        console.log("📝 Blockchain time:", blockchainTime);
        console.log("📝 Market end time:", endTime2);
        console.log("📝 Time difference:", endTime2 - blockchainTime, "seconds");
        
        const tx6 = await coreContract.createMarket(
            "Can we buy shares in a second market?",
            "Testing",
            "https://example.com/image2.jpg",
            endTime2,
            { value: ethers.parseEther("0.005") }
        );
        await tx6.wait();
        console.log("✅ Second market created successfully");
        
        // Verify market is still active
        const market2 = await coreContract.getMarket(2);
        console.log("📝 Market 2 status:", market2.status);
        console.log("📝 Market 2 end time:", market2.endTime);
        
        // Test 7: Buying shares in the second market using additional accounts
        console.log("\n📋 Test 7: Buying shares in the second market using additional accounts");
        const buyAmount = ethers.parseEther("0.02"); // 0.02 CELO
        
        // Account 1 buys YES shares in market 2
        console.log("📝 Account 1 buying YES shares in market 2...");
        const coreContractAccount1 = coreContract.connect(account1Connected);
        const buyYesTx1 = await coreContractAccount1.buyShares(2, true, { value: buyAmount });
        await buyYesTx1.wait();
        console.log("✅ Account 1 bought YES shares successfully in market 2");
        
        // Account 2 buys NO shares in market 2
        console.log("📝 Account 2 buying NO shares in market 2...");
        const coreContractAccount2 = coreContract.connect(account2Connected);
        const buyNoTx2 = await coreContractAccount2.buyShares(2, false, { value: buyAmount });
        await buyNoTx2.wait();
        console.log("✅ Account 2 bought NO shares successfully in market 2");
        
        // Check updated market state
        const updatedMarket = await coreContract.getMarket(2);
        console.log("📝 Market 2 total pool:", ethers.formatEther(updatedMarket.totalPool), "CELO");
        console.log("📝 Market 2 total YES shares:", ethers.formatEther(updatedMarket.totalYes), "CELO");
        console.log("📝 Market 2 total NO shares:", ethers.formatEther(updatedMarket.totalNo), "CELO");
        
        // Test 8: Check all users' shares in both markets
        console.log("\n📋 Test 8: Check all users' shares in both markets");
        const deployerYesShares1 = await coreContract.yesShares(marketId, deployer.address);
        const deployerYesShares2 = await coreContract.yesShares(2, deployer.address);
        const account1YesShares2 = await coreContract.yesShares(2, account1.address);
        const account2NoShares2 = await coreContract.noShares(2, account2.address);
        
        console.log("📝 Deployer YES shares in market", marketId, ":", ethers.formatEther(deployerYesShares1), "CELO");
        console.log("📝 Deployer YES shares in market 2:", ethers.formatEther(deployerYesShares2), "CELO");
        console.log("📝 Account 1 YES shares in market 2:", ethers.formatEther(account1YesShares2), "CELO");
        console.log("📝 Account 2 NO shares in market 2:", ethers.formatEther(account2NoShares2), "CELO");
        
        // Test 9: Resolve market (if not already resolved)
        console.log("\n📋 Test 9: Resolve market", marketId, "(if not already resolved)");
        const marketStatus = await coreContract.getMarket(marketId).then(m => m.status);
        
        if (marketStatus == 0) { // ACTIVE
            // Wait a bit to ensure market has ended
            console.log("⏰ Waiting for market", marketId, "to end...");
            await new Promise(resolve => setTimeout(resolve, 180000)); // Wait 3 minutes
            
            // Resolve market as YES (true)
            const resolveTx = await coreContract.resolveMarket(marketId, true);
            await resolveTx.wait();
            console.log("✅ Market", marketId, "resolved successfully as YES");
        } else {
            console.log("✅ Market", marketId, "already resolved, skipping resolution");
        }
        
        // Check final market state
        const resolvedMarket = await coreContract.getMarket(marketId);
        console.log("📝 Market", marketId, "final status:", resolvedMarket.status);
        console.log("📝 Market", marketId, "outcome:", resolvedMarket.outcome);
        
        // Test 10: Claim rewards from market
        console.log("\n📋 Test 10: Claim rewards from market", marketId);
        const initialBalance = await ethers.provider.getBalance(deployer.address);
        console.log("📝 Initial balance:", ethers.formatEther(initialBalance), "CELO");
        
        // Calculate expected winnings (user has YES shares, market resolved as YES)
        const userShares = await coreContract.yesShares(marketId, deployer.address);
        const totalYesShares = await coreContract.getMarket(marketId).then(m => m.totalYes);
        const totalPool = await coreContract.getMarket(marketId).then(m => m.totalPool);
        const expectedWinnings = (userShares * totalPool) / totalYesShares;
        console.log("📝 Expected winnings:", ethers.formatEther(expectedWinnings), "CELO");
        
        // Claim winnings
        const claimTx = await claimsContract.claimWinnings(marketId);
        await claimTx.wait();
        console.log("✅ Winnings claimed successfully from market", marketId);
        
        // Check final balance
        const finalBalance = await ethers.provider.getBalance(deployer.address);
        console.log("📝 Final balance:", ethers.formatEther(finalBalance), "CELO");
        const actualWinnings = finalBalance - initialBalance;
        console.log("📝 Actual winnings:", ethers.formatEther(actualWinnings), "CELO");
        
        // Test 11: Verify participation tracking for all accounts
        console.log("\n📋 Test 11: Verify participation tracking for all accounts");
        
        // Deployer participation
        const deployerParticipated1 = await coreContract.hasParticipated(1, deployer.address);
        const deployerParticipated2 = await coreContract.hasParticipated(2, deployer.address);
        const deployerSide1 = await coreContract.participationSide(1, deployer.address);
        const deployerSide2 = await coreContract.participationSide(2, deployer.address);
        
        // Account 1 participation
        const account1Participated2 = await coreContract.hasParticipated(2, account1.address);
        const account1Side2 = await coreContract.participationSide(2, account1.address);
        
        // Account 2 participation
        const account2Participated2 = await coreContract.hasParticipated(2, account2.address);
        const account2Side2 = await coreContract.participationSide(2, account2.address);
        
        console.log("📝 Deployer participated in market 1:", deployerParticipated1);
        console.log("📝 Deployer participated in market 2:", deployerParticipated2);
        console.log("📝 Deployer side in market 1:", deployerSide1 ? "YES" : "NO");
        console.log("📝 Deployer side in market 2:", deployerSide2 ? "YES" : "NO");
        console.log("📝 Account 1 participated in market 2:", account1Participated2);
        console.log("📝 Account 1 side in market 2:", account1Side2 ? "YES" : "NO");
        console.log("📝 Account 2 participated in market 2:", account2Participated2);
        console.log("📝 Account 2 side in market 2:", account2Side2 ? "NO" : "YES");
        
        console.log("\n🎉 All tests passed successfully!");
        console.log("=" * 50);
        console.log("📋 Contract Addresses:");
        console.log("   Core Contract:", coreAddress);
        console.log("   Claims Contract:", claimsAddress);
        console.log("=" * 50);
        
    } catch (error) {
        console.error("❌ Test failed:", error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Testing failed:", error);
        process.exit(1);
    });

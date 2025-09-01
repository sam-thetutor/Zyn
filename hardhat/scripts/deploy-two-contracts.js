const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Starting deployment of two-contract prediction market system...");
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "CELO");
    
    // Step 1: Deploy Core Contract
    console.log("\n📋 Step 1: Deploying PredictionMarketCore...");
    const PredictionMarketCore = await ethers.getContractFactory("PredictionMarketCore");
    
    let coreContract;
    try {
        coreContract = await PredictionMarketCore.deploy();
        await coreContract.waitForDeployment();
        console.log("✅ PredictionMarketCore deployed to:", await coreContract.getAddress());
    } catch (error) {
        console.error("❌ Failed to deploy PredictionMarketCore:", error.message);
        process.exit(1);
    }
    
    // Step 2: Deploy Claims Contract
    console.log("\n📋 Step 2: Deploying PredictionMarketClaims...");
    const PredictionMarketClaims = await ethers.getContractFactory("PredictionMarketClaims");
    
    let claimsContract;
    try {
        claimsContract = await PredictionMarketClaims.deploy(await coreContract.getAddress());
        await claimsContract.waitForDeployment();
        console.log("✅ PredictionMarketClaims deployed to:", await claimsContract.getAddress());
    } catch (error) {
        console.error("❌ Failed to deploy PredictionMarketClaims:", error.message);
        process.exit(1);
    }
    
    // Step 3: Set Claims Contract in Core Contract
    console.log("\n📋 Step 3: Setting Claims Contract reference in Core Contract...");
    try {
        const tx = await coreContract.setClaimsContract(await claimsContract.getAddress());
        await tx.wait();
        console.log("✅ Claims Contract reference set in Core Contract");
    } catch (error) {
        console.error("❌ Failed to set Claims Contract reference:", error.message);
        process.exit(1);
    }
    
    // Step 4: Verify the connection
    console.log("\n📋 Step 4: Verifying contract connection...");
    try {
        const coreClaimsAddress = await coreContract.claimsContract();
        const claimsCoreAddress = await claimsContract.coreContract();
        
        if (coreClaimsAddress === await claimsContract.getAddress() && 
            claimsCoreAddress === await coreContract.getAddress()) {
            console.log("✅ Contract connection verified successfully");
        } else {
            console.error("❌ Contract connection verification failed");
            process.exit(1);
        }
    } catch (error) {
        console.error("❌ Failed to verify contract connection:", error.message);
        process.exit(1);
    }
    
    // Step 5: Test basic functionality
    console.log("\n📋 Step 5: Testing basic functionality...");
    try {
        // Test username setting
        const testUsername = "testuser";
        const tx1 = await coreContract.setUsername(testUsername);
        await tx1.wait();
        console.log("✅ Username setting test passed");
        
        // Test username retrieval
        const retrievedUsername = await coreContract.getUsername(deployer.address);
        if (retrievedUsername === testUsername) {
            console.log("✅ Username retrieval test passed");
        } else {
            console.error("❌ Username retrieval test failed");
        }
        
        // Test market creation
        const endTime = Math.floor(Date.now() / 1000) + 120; // 2 minutes from now
        const tx2 = await coreContract.createMarket(
            "Will the test pass?",
            "Testing",
            "https://example.com/image.jpg",
            endTime,
            { value: ethers.parseEther("0.01") }
        );
        await tx2.wait();
        console.log("✅ Market creation test passed");
        
        // Test market data retrieval
        const market = await coreContract.getMarket(1);
        if (market.question === "Will the test pass?") {
            console.log("✅ Market data retrieval test passed");
        } else {
            console.error("❌ Market data retrieval test failed");
        }
        
    } catch (error) {
        console.error("❌ Basic functionality test failed:", error.message);
        process.exit(1);
    }
    
    // Deployment Summary
    console.log("\n🎉 Deployment completed successfully!");
    console.log("=" * 50);
    console.log("📋 Contract Addresses:");
    console.log("   Core Contract:", await coreContract.getAddress());
    console.log("   Claims Contract:", await claimsContract.getAddress());
    console.log("   Deployer:", deployer.address);
    console.log("=" * 50);
    console.log("\n💡 Next steps:");
    console.log("   1. Update frontend constants with new contract addresses");
    console.log("   2. Update frontend ABI to use both contracts");
    console.log("   3. Test the complete system with real transactions");
    
    // Save addresses to a file for easy reference
    const fs = require('fs');
    const deploymentInfo = {
        network: "celo-alfajores",
        timestamp: new Date().toISOString(),
        coreContract: await coreContract.getAddress(),
        claimsContract: await claimsContract.getAddress(),
        deployer: deployer.address
    };
    
    fs.writeFileSync('deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("\n💾 Deployment info saved to deployment-info.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });

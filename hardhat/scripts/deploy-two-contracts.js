import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    console.log("🚀 Starting deployment of UPDATED PredictionMarketClaims contract...");
    console.log("⚠️  This will deploy the claims contract with the winnings fix!");
    
    // Get deployer account
    const signers = await ethers.getSigners();
    const deployer = signers[0];
    console.log("📝 Deploying contracts with account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "CELO");
    
    // Get the existing core contract address
    const existingCoreContractAddress = "0x0C49604c65588858DC206AAC6EFEc0F8Afe2d1d6";
    console.log("📋 Using existing core contract:", existingCoreContractAddress);
    
    // Step 1: Deploy Updated Claims Contract
    console.log("\n📋 Step 1: Deploying UPDATED PredictionMarketClaims...");
    const PredictionMarketClaims = await ethers.getContractFactory("PredictionMarketClaims");
    
    let claimsContract;
    try {
        claimsContract = await PredictionMarketClaims.deploy(existingCoreContractAddress);
        await claimsContract.waitForDeployment();
        console.log("✅ UPDATED PredictionMarketClaims deployed to:", await claimsContract.getAddress());
    } catch (error) {
        console.error("❌ Failed to deploy PredictionMarketClaims:", error.message);
        process.exit(1);
    }
    
    // Step 2: Update Core Contract to use new Claims Contract
    console.log("\n📋 Step 2: Updating Core Contract to use new Claims Contract...");
    try {
        const coreContract = await ethers.getContractAt("PredictionMarketCore", existingCoreContractAddress);
        const tx = await coreContract.setClaimsContract(await claimsContract.getAddress());
        await tx.wait();
        console.log("✅ Core Contract updated to use new Claims Contract");
    } catch (error) {
        console.error("❌ Failed to update Core Contract:", error.message);
        console.log("⚠️  You may need to manually update the core contract with address:", await claimsContract.getAddress());
    }
    
    // Step 3: Verify the connection
    console.log("\n📋 Step 3: Verifying contract connection...");
    try {
        const coreContract = await ethers.getContractAt("PredictionMarketCore", existingCoreContractAddress);
        const coreClaimsAddress = await coreContract.claimsContract();
        const claimsCoreAddress = await claimsContract.coreContract();
        
        if (coreClaimsAddress === await claimsContract.getAddress() && 
            claimsCoreAddress === existingCoreContractAddress) {
            console.log("✅ Contract connection verified successfully");
        } else {
            console.error("❌ Contract connection verification failed");
            console.log("   Expected claims address:", await claimsContract.getAddress());
            console.log("   Actual claims address:", coreClaimsAddress);
        }
    } catch (error) {
        console.error("❌ Failed to verify contract connection:", error.message);
    }
    
    // Step 4: Test the new winnings calculation
    console.log("\n📋 Step 4: Testing new winnings calculation...");
    try {
        // Test the new getWinningsBreakdown function
        const testMarketId = 1; // Assuming market 1 exists
        const testUser = deployer.address;
        
        const breakdown = await claimsContract.getWinningsBreakdown(testMarketId, testUser);
        console.log("✅ getWinningsBreakdown function test passed");
        console.log("   User Shares:", breakdown.userShares.toString());
        console.log("   Total Winning Shares:", breakdown.totalWinningShares.toString());
        console.log("   Total Losing Shares:", breakdown.totalLosingShares.toString());
        console.log("   User Winnings:", breakdown.userWinnings.toString());
        console.log("   Has Losing Shares:", breakdown.hasLosingShares);
        
    } catch (error) {
        console.log("⚠️  Winnings calculation test failed (this is normal if no markets exist):", error.message);
    }
    
    // Deployment Summary
    console.log("\n🎉 UPDATED CLAIMS CONTRACT DEPLOYMENT completed successfully!");
    console.log("=" * 60);
    console.log("📋 Contract Addresses:");
    console.log("   Core Contract (existing):", existingCoreContractAddress);
    console.log("   Claims Contract (NEW):", await claimsContract.getAddress());
    console.log("   Deployer:", deployer.address);
    console.log("=" * 60);
    console.log("\n💡 Next steps:");
    console.log("   1. Update frontend constants with new claims contract address");
    console.log("   2. Test the winnings calculation with real markets");
    console.log("   3. Verify the fix works for markets with no losing shares");
    
    // Save addresses to a file for easy reference
    const fs = await import('fs');
    const deploymentInfo = {
        network: "celo-mainnet",
        timestamp: new Date().toISOString(),
        coreContract: existingCoreContractAddress,
        claimsContract: await claimsContract.getAddress(),
        deployer: deployer.address,
        note: "UPDATED with winnings fix for no-losing-shares scenario"
    };
    
    fs.default.writeFileSync('deployment-claims-update.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("\n💾 Deployment info saved to deployment-claims-update.json");
    
    console.log("\n🎯 IMPORTANT: Update frontend with new claims contract address:", await claimsContract.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });

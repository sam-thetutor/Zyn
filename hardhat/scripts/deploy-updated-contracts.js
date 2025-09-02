import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    console.log("🚀 Starting MAINNET deployment of UPDATED prediction market system...");
    console.log("✨ NEW FEATURE: Market creators can claim 15% of losing shares after resolution!");
    console.log("⚠️  WARNING: This will deploy to CELO MAINNET with 1 CELO market creation fee!");
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "CELO");
    
    // Verify we have sufficient balance for deployment
    const balance = await deployer.provider.getBalance(deployer.address);
    if (balance < ethers.parseEther("0.1")) {
        console.error("❌ Insufficient balance for deployment. Need at least 0.1 CELO for gas fees.");
        process.exit(1);
    }
    
    // Step 1: Deploy Core Contract
    console.log("\n📋 Step 1: Deploying UPDATED PredictionMarketCore...");
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
    console.log("\n📋 Step 2: Deploying UPDATED PredictionMarketClaims...");
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
        console.log("✅ Claims Contract reference set successfully!");
    } catch (error) {
        console.error("❌ Failed to set Claims Contract reference:", error.message);
        process.exit(1);
    }
    
    // Step 4: Verify deployment
    console.log("\n📋 Step 4: Verifying deployment...");
    try {
        const coreClaimsAddress = await coreContract.claimsContract();
        const claimsCoreAddress = await claimsContract.coreContract();
        
        console.log("🔍 Verification Results:");
        console.log("   Core Contract Claims Address:", coreClaimsAddress);
        console.log("   Claims Contract Core Address:", claimsCoreAddress);
        
        if (coreClaimsAddress.toLowerCase() === (await claimsContract.getAddress()).toLowerCase() &&
            claimsCoreAddress.toLowerCase() === (await coreContract.getAddress()).toLowerCase()) {
            console.log("✅ Contract references verified successfully!");
        } else {
            console.log("❌ Contract reference verification failed!");
        }
        
        // Test creator fee constant
        const creatorFeePercentage = await coreContract.CREATOR_FEE_PERCENTAGE();
        console.log("   Creator Fee Percentage:", creatorFeePercentage.toString() + "%");
        
    } catch (error) {
        console.error("❌ Verification failed:", error.message);
    }
    
    // Save deployment info
    const deploymentInfo = {
        network: "celo-mainnet",
        chainId: 42220,
        timestamp: new Date().toISOString(),
        coreContract: await coreContract.getAddress(),
        claimsContract: await claimsContract.getAddress(),
        deployer: deployer.address,
        marketCreationFee: "1 CELO",
        creatorFeePercentage: "15% of losing shares",
        rpcUrl: "https://forno.celo.org",
        explorerUrl: "https://celoscan.io",
        features: [
            "Market creation with configurable fee (default 1 CELO)",
            "Creator fee claiming (configurable % of losing shares after resolution)",
            "Admin function to update creator fee percentage",
            "Admin function to update market creation fee",
            "Username management",
            "Winner calculation and claiming",
            "Admin fee withdrawal"
        ]
    };
    
    // Write deployment info to file
    const fs = await import('fs');
    const deploymentFile = `deployment-updated-${Date.now()}.json`;
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log("=" .repeat(60));
    console.log("📋 DEPLOYMENT SUMMARY:");
    console.log("   Network: Celo Mainnet");
    console.log("   Core Contract:", await coreContract.getAddress());
    console.log("   Claims Contract:", await claimsContract.getAddress());
    console.log("   Deployer:", deployer.address);
    console.log("   Market Creation Fee: 1 CELO");
    console.log("   Creator Fee: 15% of losing shares");
    console.log("   Deployment Info Saved:", deploymentFile);
    
    console.log("\n✨ NEW FEATURES:");
    console.log("   ✅ Market creators can claim configurable % of losing shares after resolution");
    console.log("   ✅ Creator fee is calculated automatically when market resolves");
    console.log("   ✅ Only market creator can claim their fee");
    console.log("   ✅ Creator fee can only be claimed once per market");
    console.log("   ✅ Admin can update creator fee percentage (0-50%)");
    console.log("   ✅ Admin can update market creation fee (0-10 CELO)");
    console.log("   ✅ Updated fee distribution: winners get remaining, creator gets %, platform gets 15% (all from losing shares)");
    
    console.log("\n🔗 NEXT STEPS:");
    console.log("   1. Update frontend constants with new contract addresses");
    console.log("   2. Test the new creator fee claiming functionality");
    console.log("   3. Update any documentation with new features");
    console.log("   4. Inform users about the creator fee feature");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });

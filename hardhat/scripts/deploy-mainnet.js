const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Starting MAINNET deployment of two-contract prediction market system...");
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
    
    // Step 5: Verify market creation fee is correct
    console.log("\n📋 Step 5: Verifying market creation fee...");
    try {
        const fee = await coreContract.MARKET_CREATION_FEE();
        const expectedFee = ethers.parseEther("1"); // 1 CELO
        
        if (fee === expectedFee) {
            console.log("✅ Market creation fee verified: 1 CELO");
        } else {
            console.error("❌ Market creation fee mismatch. Expected: 1 CELO, Got:", ethers.formatEther(fee), "CELO");
            process.exit(1);
        }
    } catch (error) {
        console.error("❌ Failed to verify market creation fee:", error.message);
        process.exit(1);
    }
    
    // Deployment Summary
    console.log("\n🎉 MAINNET DEPLOYMENT completed successfully!");
    console.log("=" * 60);
    console.log("📋 Contract Addresses:");
    console.log("   Core Contract:", await coreContract.getAddress());
    console.log("   Claims Contract:", await claimsContract.getAddress());
    console.log("   Deployer:", deployer.address);
    console.log("   Network: Celo Mainnet (Chain ID: 42220)");
    console.log("   Market Creation Fee: 1 CELO");
    console.log("=" * 60);
    console.log("\n💡 Next steps:");
    console.log("   1. Verify contracts on Celoscan:");
    console.log("      Core: https://celoscan.io/address/" + await coreContract.getAddress());
    console.log("      Claims: https://celoscan.io/address/" + await claimsContract.getAddress());
    console.log("   2. Update frontend constants with new contract addresses");
    console.log("   3. Update frontend network configuration to use mainnet");
    console.log("   4. Test with a real 1 CELO market creation");
    
    // Save addresses to a file for easy reference
    const fs = require('fs');
    const deploymentInfo = {
        network: "celo-mainnet",
        chainId: 42220,
        timestamp: new Date().toISOString(),
        coreContract: await coreContract.getAddress(),
        claimsContract: await claimsContract.getAddress(),
        deployer: deployer.address,
        marketCreationFee: "1 CELO",
        rpcUrl: "https://forno.celo.org",
        explorerUrl: "https://celoscan.io"
    };
    
    fs.writeFileSync('deployment-mainnet.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("\n💾 Deployment info saved to deployment-mainnet.json");
    
    console.log("\n⚠️  IMPORTANT: Keep your private key safe and never share it!");
    console.log("💰 Users will need 1 CELO to create markets on mainnet");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });

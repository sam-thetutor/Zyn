const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Starting deployment of PredictionMarket contract to Base mainnet...");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);
    
    // Get balance using ethers v6 syntax
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
    
    // Deploy the PredictionMarket contract
    console.log("📦 Deploying PredictionMarket contract...");
    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    const predictionMarket = await PredictionMarket.deploy({
        gasLimit: 3000000, // Set gas limit to control costs
        gasPrice: ethers.parseUnits("0.5", "gwei") // 0.5 gwei
    });
    
    await predictionMarket.waitForDeployment();
    const contractAddress = await predictionMarket.getAddress();
    console.log("✅ PredictionMarket deployed to:", contractAddress);
    
    // Wait for a few block confirmations
    console.log("⏳ Waiting for block confirmations...");
    const deploymentReceipt = await predictionMarket.deploymentTransaction();
    if (deploymentReceipt) {
        await deploymentReceipt.wait(5);
    }
    
    // Get contract ABI
    const contractArtifact = await artifacts.readArtifact("PredictionMarket");
    const contractABI = contractArtifact.abi;
    
    // Create deployment info object
    const deploymentInfo = {
        network: "base-mainnet",
        contractName: "PredictionMarket",
        contractAddress: contractAddress,
        deployer: deployer.address,
        deploymentTime: new Date().toISOString(),
        blockNumber: await ethers.provider.getBlockNumber(),
        transactionHash: deploymentReceipt ? deploymentReceipt.hash : "N/A",
        abi: contractABI
    };
    
    // Save deployment info to file
    const deploymentPath = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentPath)) {
        fs.mkdirSync(deploymentPath, { recursive: true });
    }
    
    const deploymentFile = path.join(deploymentPath, `deployment-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log("💾 Deployment info saved to:", deploymentFile);
    
    // Save ABI to separate file for easy access
    const abiFile = path.join(deploymentPath, "PredictionMarket-abi.json");
    fs.writeFileSync(abiFile, JSON.stringify(contractABI, null, 2));
    console.log("📄 Contract ABI saved to:", abiFile);
    
    // Verify contract on BaseScan (if available)
    console.log("\n🔍 To verify your contract on BaseScan:");
    console.log(`   Visit: https://basescan.org/address/${contractAddress}`);
    console.log(`   Contract Address: ${contractAddress}`);
    
    // Display contract details
    console.log("\n📊 Contract Details:");
    console.log("   Market Creation Fee:", ethers.formatEther(await predictionMarket.marketCreationFee()), "ETH");
    console.log("   Trading Fee:", ethers.formatEther(await predictionMarket.tradingFee()), "ETH");
    console.log("   Owner:", await predictionMarket.owner());
    
    console.log("\n🎉 Deployment completed successfully!");
    console.log("   Contract Address:", contractAddress);
    console.log("   Deployer:", deployer.address);
    console.log("   Network: Base Mainnet");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });

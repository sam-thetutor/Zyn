const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Starting deployment of PredictionMarket contract to Celo Alfajores testnet...");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);
    
    // Get balance using ethers v6 syntax
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "CELO");
    
    // Deploy the PredictionMarket contract
    console.log("📦 Deploying PredictionMarket contract...");
    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    
    // Estimate gas first
    const deploymentData = PredictionMarket.interface.encodeDeploy();
    const estimatedGas = await ethers.provider.estimateGas({
        from: deployer.address,
        data: deploymentData
    });
    console.log("⛽ Estimated gas:", estimatedGas.toString());
    
    const predictionMarket = await PredictionMarket.deploy({
        gasLimit: 1000000 // Set very high gas limit for deployment
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
        network: "celo-alfajores",
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
    
    // Verify contract on CeloScan (if available)
    console.log("\n🔍 To verify your contract on CeloScan:");
    console.log(`   Visit: https://alfajores.celoscan.io/address/${contractAddress}`);
    console.log(`   Contract Address: ${contractAddress}`);
    
    // Display contract details
    console.log("\n📊 Contract Details:");
    console.log("   Market Creation Fee:", ethers.formatEther(await predictionMarket.marketCreationFee()), "CELO");
    console.log("   Trading Fee:", ethers.formatEther(await predictionMarket.tradingFee()), "CELO");
    console.log("   Owner:", await predictionMarket.owner());
    
    console.log("\n🎉 Deployment completed successfully!");
    console.log("   Contract Address:", contractAddress);
    console.log("   Deployer:", deployer.address);
    console.log("   Network: Celo Alfajores Testnet");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });

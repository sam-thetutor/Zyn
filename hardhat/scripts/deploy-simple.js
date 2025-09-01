const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying Simple Test Contract");
    console.log("================================\n");

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying contracts with account:", deployer.address);
    
    // Get balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "CELO");
    
    // Deploy the SimpleTest contract
    console.log("📦 Deploying SimpleTest contract...");
    const SimpleTest = await ethers.getContractFactory("SimpleTest");
    const simpleTest = await SimpleTest.deploy();
    
    await simpleTest.waitForDeployment();
    const contractAddress = await simpleTest.getAddress();
    console.log("✅ SimpleTest deployed to:", contractAddress);
    
    // Test the contract
    console.log("🧪 Testing contract...");
    const message = await simpleTest.getMessage();
    console.log("📝 Initial message:", message);
    
    console.log("🎉 Deployment and test completed successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });

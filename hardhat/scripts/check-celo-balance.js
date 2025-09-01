const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Checking Admin Balance on Celo Alfajores");
    console.log("==========================================\n");

    // Get signers
    const [admin] = await ethers.getSigners();
    console.log(`👑 Admin: ${admin.address}`);
    
    // Check balance
    const balance = await admin.provider.getBalance(admin.address);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} CELO`);
    console.log(`💰 Balance in Wei: ${balance}`);
    
    // Check if sufficient for our needs
    const requiredForFunding = ethers.parseEther("0.1"); // 0.1 CELO per user × 5 users = 0.5 CELO
    const requiredForMarkets = ethers.parseEther("0.0005"); // 5 markets × 0.0001 CELO creation fee
    
    if (balance >= requiredForFunding + requiredForMarkets) {
        console.log("✅ Sufficient balance for market creation and user funding!");
    } else {
        console.log("❌ Insufficient balance for full operation");
        console.log(`   Required: ${ethers.formatEther(requiredForFunding + requiredForMarkets)} CELO`);
        console.log(`   Available: ${ethers.formatEther(balance)} CELO`);
    }
    
    // Get network info
    const network = await admin.provider.getNetwork();
    console.log(`🌐 Network ID: ${network.chainId}`);
    console.log(`🌐 Network Name: ${network.name}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

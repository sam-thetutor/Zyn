import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    console.log("📊 Checking Market Creation Fee");
    console.log("=" .repeat(50));
    
    // Contract addresses from the latest deployment
    const coreContractAddress = "0x2D6614fe45da6Aa7e60077434129a51631AC702A";
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Using account:", deployer.address);
    
    // Connect to the core contract
    const PredictionMarketCore = await ethers.getContractFactory("PredictionMarketCore");
    const coreContract = PredictionMarketCore.attach(coreContractAddress);
    
    try {
        // Check current market creation fee
        const currentFee = await coreContract.getMarketCreationFee();
        console.log("📊 Current market creation fee:", ethers.formatEther(currentFee), "CELO");
        
        // Check creator fee percentage
        const creatorFeePercentage = await coreContract.creatorFeePercentage();
        console.log("📊 Creator fee percentage:", creatorFeePercentage.toString(), "%");
        
        // Check contract owner
        const owner = await coreContract.owner();
        console.log("👑 Contract owner:", owner);
        
        // Check if current account is admin
        const isAdmin = owner.toLowerCase() === deployer.address.toLowerCase();
        console.log("🔐 Is current account admin:", isAdmin ? "✅ Yes" : "❌ No");
        
        console.log("\n📋 Contract Information:");
        console.log("   Contract Address:", coreContractAddress);
        console.log("   Market Creation Fee:", ethers.formatEther(currentFee), "CELO");
        console.log("   Creator Fee Percentage:", creatorFeePercentage.toString(), "%");
        console.log("   Owner:", owner);
        
    } catch (error) {
        console.error("❌ Failed to check market creation fee:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

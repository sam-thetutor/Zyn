import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    console.log("🔍 Checking CORRECT New Contract");
    console.log("=" .repeat(50));
    
    // Correct new contract address
    const newContractAddress = "0x2D6614fe45da6Aa7e60077434129a51631AC702A";
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Using account:", deployer.address);
    
    // Connect to new contract
    const PredictionMarketCore = await ethers.getContractFactory("PredictionMarketCore");
    const newContract = PredictionMarketCore.attach(newContractAddress);
    
    try {
        // Get market count
        const nextMarketId = await newContract.nextMarketId();
        const marketCount = Number(nextMarketId) - 1;
        
        console.log("📊 New Contract Information:");
        console.log("   Contract Address:", newContractAddress);
        console.log("   Next Market ID:", nextMarketId.toString());
        console.log("   Total Markets:", marketCount);
        
        if (marketCount === 0) {
            console.log("❌ No markets found - migration may have failed");
            return;
        }
        
        console.log("\n📋 Testing Market Retrieval:");
        // Test getting a few markets to see if there are ABI issues
        for (let i = 1; i <= Math.min(marketCount, 5); i++) {
            try {
                const market = await newContract.getMarket(i);
                console.log(`✅ Market ${i}: ${market.question.substring(0, 50)}...`);
            } catch (error) {
                console.log(`❌ Error getting market ${i}:`, error.message);
            }
        }
        
        // Check creator fee percentage
        try {
            const creatorFeePercentage = await newContract.creatorFeePercentage();
            console.log(`\n📊 Creator Fee Percentage: ${creatorFeePercentage}%`);
        } catch (error) {
            console.log(`❌ Error getting creator fee percentage:`, error.message);
        }
        
        // Check market creation fee
        try {
            const marketCreationFee = await newContract.getMarketCreationFee();
            console.log(`📊 Market Creation Fee: ${ethers.formatEther(marketCreationFee)} CELO`);
        } catch (error) {
            console.log(`❌ Error getting market creation fee:`, error.message);
        }
        
    } catch (error) {
        console.error("❌ Error checking contract:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

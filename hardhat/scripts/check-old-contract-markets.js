import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    console.log("🔍 Checking Old Contract Markets");
    console.log("=" .repeat(50));
    
    // Old contract address with markets
    const oldContractAddress = "0x0C49604c65588858DC206AAC6EFEc0F8Afe2d1d6";
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Using account:", deployer.address);
    
    // Connect to old contract
    const PredictionMarketCore = await ethers.getContractFactory("PredictionMarketCore");
    const oldContract = PredictionMarketCore.attach(oldContractAddress);
    
    try {
        // Get market count
        const nextMarketId = await oldContract.nextMarketId();
        const marketCount = Number(nextMarketId) - 1;
        
        console.log("📊 Contract Information:");
        console.log("   Contract Address:", oldContractAddress);
        console.log("   Next Market ID:", nextMarketId.toString());
        console.log("   Total Markets:", marketCount);
        
        if (marketCount === 0) {
            console.log("✅ No markets found in old contract");
            return;
        }
        
        console.log("\n📋 Market List:");
        for (let i = 1; i <= marketCount; i++) {
            try {
                const market = await oldContract.getMarket(i);
                console.log(`\n🏪 Market ${i}:`);
                console.log(`   Question: ${market.question}`);
                console.log(`   Status: ${market.status} (0=ACTIVE, 1=RESOLVED, 2=CANCELLED)`);
                console.log(`   Total Pool: ${ethers.formatEther(market.totalPool)} CELO`);
                console.log(`   End Time: ${new Date(Number(market.endTime.toString()) * 1000).toLocaleString()}`);
            } catch (error) {
                console.log(`   ❌ Error reading market ${i}:`, error.message);
            }
        }
        
        console.log("\n💡 Migration Options:");
        console.log("   1. Run migration script to copy market metadata to new contract");
        console.log("   2. Note: User shares and winnings cannot be migrated");
        console.log("   3. Users will need to re-participate in recreated markets");
        
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

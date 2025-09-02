import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    console.log("🔍 ANALYZING DATA FOR MIGRATION FROM OLD CONTRACT");
    console.log("=" .repeat(60));
    
    // Core contract address (old contract with existing markets)
    const coreContractAddress = "0x0C49604c65588858DC206AAC6EFEc0F8Afe2d1d6";
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Using account:", deployer.address);
    
    // Connect to the core contract
    const PredictionMarketCore = await ethers.getContractFactory("PredictionMarketCore");
    const coreContract = PredictionMarketCore.attach(coreContractAddress);
    
    try {
        // Get basic contract info
        const nextMarketId = await coreContract.nextMarketId();
        const marketCount = nextMarketId - 1;
        const claimsContract = await coreContract.claimsContract();
        
        console.log("\n📊 CONTRACT OVERVIEW:");
        console.log("   Next Market ID:", nextMarketId.toString());
        console.log("   Total Markets:", marketCount.toString());
        console.log("   Claims Contract:", claimsContract);
        
        if (marketCount === 0) {
            console.log("\n✅ No markets to migrate - contract is empty!");
            return;
        }
        
        console.log("\n📋 MIGRATION ANALYSIS:");
        console.log("=" .repeat(40));
        
        // Analyze each market
        const migrationData = {
            markets: [],
            usernames: {},
            totalUsers: 0,
            totalMarkets: Number(marketCount)
        };
        
        for (let i = 1; i <= marketCount; i++) {
            try {
                const market = await coreContract.getMarket(i);
                console.log(`\n🏪 Market ${i}:`);
                console.log(`   Question: ${market.question}`);
                console.log(`   Status: ${market.status} (0=ACTIVE, 1=RESOLVED, 2=CANCELLED)`);
                console.log(`   End Time: ${new Date(Number(market.endTime.toString()) * 1000).toISOString()}`);
                console.log(`   Total Pool: ${ethers.formatEther(market.totalPool)} CELO`);
                console.log(`   Total Yes: ${ethers.formatEther(market.totalYes)} CELO`);
                console.log(`   Total No: ${ethers.formatEther(market.totalNo)} CELO`);
                console.log(`   Outcome: ${market.outcome}`);
                console.log(`   Created: ${new Date(Number(market.createdAt.toString()) * 1000).toISOString()}`);
                
                migrationData.markets.push({
                    id: i,
                    question: market.question,
                    description: market.description,
                    category: market.category,
                    image: market.image,
                    source: market.source,
                    endTime: market.endTime.toString(),
                    totalPool: market.totalPool.toString(),
                    totalYes: market.totalYes.toString(),
                    totalNo: market.totalNo.toString(),
                    status: Number(market.status),
                    outcome: market.outcome,
                    createdAt: market.createdAt.toString()
                });
                
            } catch (error) {
                console.log(`   ❌ Error reading market ${i}:`, error.message);
            }
        }
        
        // Check for usernames (this is more complex as we need to iterate through events)
        console.log("\n👤 USERNAME ANALYSIS:");
        console.log("   Note: Usernames are stored in events, not easily queryable");
        console.log("   Recommendation: Re-register usernames in new contract");
        
        console.log("\n📝 MIGRATION RECOMMENDATIONS:");
        console.log("=" .repeat(40));
        
        if (marketCount > 0) {
            console.log("⚠️  CRITICAL ISSUES:");
            console.log("   1. User shares and participation data cannot be easily migrated");
            console.log("   2. Active markets with user funds cannot be transferred");
            console.log("   3. Resolved markets with unclaimed winnings are lost");
            
            console.log("\n💡 MIGRATION STRATEGIES:");
            console.log("   Option 1: FRESH START (Recommended)");
            console.log("   - Deploy new contract");
            console.log("   - Users re-register usernames");
            console.log("   - Create new markets");
            console.log("   - Users lose existing shares/winnings");
            
            console.log("\n   Option 2: PARTIAL MIGRATION");
            console.log("   - Migrate only market metadata (questions, descriptions)");
            console.log("   - Users lose all shares and winnings");
            console.log("   - Requires manual market recreation");
            
            console.log("\n   Option 3: GRACEFUL SHUTDOWN");
            console.log("   - Wait for all active markets to end");
            console.log("   - Allow users to claim winnings");
            console.log("   - Then deploy new contract");
            
            console.log("\n🚨 ACTIVE MARKETS CHECK:");
            const activeMarkets = migrationData.markets.filter(m => m.status === 0);
            if (activeMarkets.length > 0) {
                console.log(`   Found ${activeMarkets.length} active markets with user funds!`);
                console.log("   These markets have CELO locked in them");
                activeMarkets.forEach(market => {
                    console.log(`   - Market ${market.id}: ${market.question.substring(0, 50)}...`);
                });
            } else {
                console.log("   ✅ No active markets found - safe to migrate");
            }
        }
        
        // Save migration data to file
        const fs = await import('fs');
        const migrationFile = `migration-data-${Date.now()}.json`;
        fs.writeFileSync(migrationFile, JSON.stringify(migrationData, null, 2));
        console.log(`\n💾 Migration data saved to: ${migrationFile}`);
        
    } catch (error) {
        console.error("❌ Error analyzing contract:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    console.log("🔄 SIMPLE MARKET MIGRATION");
    console.log("=" .repeat(50));
    
    // Contract addresses
    const oldContractAddress = "0x0C49604c65588858DC206AAC6EFEc0F8Afe2d1d6";
    const newContractAddress = "0x2D6614fe45da6Aa7e60077434129a51631AC702A";
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Using account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "CELO");
    
    // Connect to contracts
    const PredictionMarketCore = await ethers.getContractFactory("PredictionMarketCore");
    const oldContract = PredictionMarketCore.attach(oldContractAddress);
    const newContract = PredictionMarketCore.attach(newContractAddress);
    
    try {
        // Get market count
        const oldNextMarketId = await oldContract.nextMarketId();
        const marketCount = Number(oldNextMarketId) - 1;
        
        console.log(`📊 Found ${marketCount} markets to migrate`);
        
        if (marketCount === 0) {
            console.log("✅ No markets to migrate");
            return;
        }
        
        let migratedCount = 0;
        let failedCount = 0;
        
        // Migrate each market
        for (let i = 1; i <= marketCount; i++) {
            try {
                console.log(`\n🔄 Migrating market ${i}/${marketCount}...`);
                
                // Get market data from old contract
                const oldMarket = await oldContract.getMarket(i);
                console.log(`   📝 Question: ${oldMarket.question}`);
                
                // Set random end time between 5 minutes to 4 hours from now
                const minMinutes = 5;
                const maxMinutes = 4 * 60; // 4 hours
                const randomMinutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
                const newEndTime = Math.floor(Date.now() / 1000) + (randomMinutes * 60);
                const endTimeDate = new Date(newEndTime * 1000);
                
                console.log(`   📅 New end time: ${endTimeDate.toLocaleString()} (${randomMinutes} minutes from now)`);
                
                // Create market in new contract
                const tx = await newContract.createMarket(
                    oldMarket.question,
                    oldMarket.description || "Migrated from old contract",
                    oldMarket.category || "Other",
                    oldMarket.image || "https://picsum.photos/400/300?random=" + i,
                    oldMarket.source || "Migration",
                    newEndTime,
                    { value: ethers.parseEther("0.01") }
                );
                
                console.log(`   📝 Transaction hash: ${tx.hash}`);
                const receipt = await tx.wait();
                console.log(`   ✅ Transaction confirmed in block: ${receipt.blockNumber}`);
                
                console.log(`   ✅ Migrated: ${oldMarket.question.substring(0, 50)}...`);
                migratedCount++;
                
                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 3000));
                
            } catch (error) {
                console.log(`   ❌ Failed to migrate market ${i}:`, error.message);
                failedCount++;
            }
        }
        
        console.log("\n📊 MIGRATION SUMMARY:");
        console.log(`   ✅ Successfully migrated: ${migratedCount} markets`);
        console.log(`   ❌ Failed to migrate: ${failedCount} markets`);
        console.log(`   📊 Total processed: ${migratedCount + failedCount} markets`);
        
        if (migratedCount > 0) {
            console.log("\n🎉 Migration completed!");
            console.log("   Markets are now available in the new contract");
            console.log("   Users can participate with the new 0.01 CELO fee");
        }
        
    } catch (error) {
        console.error("❌ Migration failed:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

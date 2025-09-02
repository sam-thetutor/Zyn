import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    console.log("🔄 MIGRATING MARKET METADATA TO NEW CONTRACT");
    console.log("⚠️  WARNING: This only migrates market questions/descriptions, NOT user shares!");
    console.log("=" .repeat(60));
    
    // Contract addresses
    const oldCoreContractAddress = "0x0C49604c65588858DC206AAC6EFEc0F8Afe2d1d6"; // Previous contract with markets
    const newContractAddress = "0x2D6614fe45da6Aa7e60077434129a51631AC702A"; // New contract with creator fee functionality
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Using account:", deployer.address);
    
    // Connect to old contract
    const PredictionMarketCore = await ethers.getContractFactory("PredictionMarketCore");
    const oldContract = PredictionMarketCore.attach(oldCoreContractAddress);
    
    console.log("📋 Contract Addresses:");
    console.log("   Old Contract:", oldCoreContractAddress);
    console.log("   New Contract:", newContractAddress);
    
    const newContract = PredictionMarketCore.attach(newContractAddress);
    
    try {
        // Get market count from old contract
        const oldNextMarketId = await oldContract.nextMarketId();
        const marketCount = Number(oldNextMarketId) - 1;
        
        console.log(`📊 Found ${marketCount} markets to migrate`);
        
        if (marketCount === 0) {
            console.log("✅ No markets to migrate");
            return;
        }
        
        // Check if new contract is ready
        const newNextMarketId = await newContract.nextMarketId();
        console.log(`📊 New contract current market count: ${Number(newNextMarketId) - 1}`);
        
        console.log("\n🚨 IMPORTANT NOTES:");
        console.log("   - This script only recreates market questions/descriptions");
        console.log("   - All user shares and winnings are LOST");
        console.log("   - Users will need to re-participate in markets");
        console.log("   - Market IDs will be different in new contract");
        
        const confirm = await askConfirmation("Do you want to proceed with metadata migration?");
        if (!confirm) {
            console.log("❌ Migration cancelled by user");
            return;
        }
        
        let migratedCount = 0;
        let failedCount = 0;
        
        // Migrate each market
        for (let i = 1; i <= marketCount; i++) {
            try {
                console.log(`\n🔄 Migrating market ${i}/${marketCount}...`);
                
                const oldMarket = await oldContract.getMarket(i);
                
                // Skip if market is active (has user funds)
                if (Number(oldMarket.status) === 0) {
                    console.log(`   ⚠️  Skipping active market: ${oldMarket.question.substring(0, 50)}...`);
                    console.log(`   Reason: Market has user funds that cannot be migrated`);
                    failedCount++;
                    continue;
                }
                
                // Create market in new contract
                // Set random end time between 5 minutes to 4 hours from now
                const minMinutes = 5;
                const maxMinutes = 4 * 60; // 4 hours
                const randomMinutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;
                const newEndTime = Math.floor(Date.now() / 1000) + (randomMinutes * 60);
                const endTimeDate = new Date(newEndTime * 1000);
                
                console.log(`   📅 New end time: ${endTimeDate.toLocaleString()} (${randomMinutes} minutes from now)`);
                
                const tx = await newContract.createMarket(
                    oldMarket.question,
                    oldMarket.description,
                    oldMarket.category,
                    oldMarket.image,
                    oldMarket.source,
                    newEndTime,
                    { value: ethers.parseEther("0.01") } // Market creation fee (updated to 0.01 CELO)
                );
                
                console.log(`   📝 Transaction hash: ${tx.hash}`);
                const receipt = await tx.wait();
                console.log(`   ✅ Transaction confirmed in block: ${receipt.blockNumber}`);
                
                console.log(`   ✅ Migrated: ${oldMarket.question.substring(0, 50)}...`);
                migratedCount++;
                
                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000));
                
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
            console.log("   Users can now participate in the recreated markets");
            console.log("   All previous shares and winnings are lost");
        }
        
    } catch (error) {
        console.error("❌ Migration failed:", error.message);
    }
}

// Helper function to ask for confirmation
async function askConfirmation(question) {
    const readline = await import('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    return new Promise((resolve) => {
        rl.question(`${question} (y/N): `, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

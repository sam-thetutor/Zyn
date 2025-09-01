const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 Testing complete prediction market flow...");
    
    // Contract addresses from deployment
    const coreAddress = "0x88Ea452D3a0075C31Dd59713d2985D6808C202Fb";
    const claimsAddress = "0x9425d81019595082F14b9FC6544c1E030e2ACAff";
    
    // Get contract instances
    const coreContract = await ethers.getContractAt("PredictionMarketCore", coreAddress);
    const claimsContract = await ethers.getContractAt("PredictionMarketClaims", claimsAddress);
    
    const [deployer] = await ethers.getSigners();
    console.log("📝 Testing with account:", deployer.address);
    
    try {
        // Step 1: Create a market
        console.log("\n📋 Step 1: Create a market");
        const endTime = Math.floor(Date.now() / 1000) + 150; // 2.5 minutes from now
        console.log("📝 Creating market with end time:", endTime);
        
        const createTx = await coreContract.createMarket(
            "Will the new claiming system work?",
            "Testing",
            "https://example.com/image.jpg",
            endTime,
            { value: ethers.parseEther("0.01") }
        );
        await createTx.wait();
        console.log("✅ Market created successfully");
        
        // Get the market ID
        const marketId = await coreContract.getMarketCount();
        console.log("📝 Market ID:", marketId.toString());
        
        // Step 1.5: Create additional test accounts and fund them
        console.log("\n📋 Step 1.5: Create additional test accounts and fund them");
        
        // Create 3 additional accounts
        const account1 = ethers.Wallet.createRandom().connect(ethers.provider);
        const account2 = ethers.Wallet.createRandom().connect(ethers.provider);
        const account3 = ethers.Wallet.createRandom().connect(ethers.provider);
        
        console.log("📝 Account 1 (will bet YES - winning side):", account1.address);
        console.log("📝 Account 2 (will bet NO - losing side):", account2.address);
        console.log("📝 Account 3 (will bet NO - losing side):", account3.address);
        
        // Fund the accounts with CELO from deployer
        const fundAmount = ethers.parseEther("0.1");
        const fundTx1 = await deployer.sendTransaction({
            to: account1.address,
            value: fundAmount
        });
        const fundTx2 = await deployer.sendTransaction({
            to: account2.address,
            value: fundAmount
        });
        const fundTx3 = await deployer.sendTransaction({
            to: account3.address,
            value: fundAmount
        });
        
        await fundTx1.wait();
        await fundTx2.wait();
        await fundTx3.wait();
        
        console.log("✅ All accounts funded with 0.1 CELO each");
        
        // Step 1.6: Have accounts buy shares
        console.log("\n📋 Step 1.6: Have accounts buy shares");
        
        // Account 1 buys YES shares (will win)
        const buyYesTx1 = await coreContract.connect(account1).buyShares(
            marketId,
            true, // YES
            { value: ethers.parseEther("0.02") }
        );
        await buyYesTx1.wait();
        console.log("✅ Account 1 bought 0.02 CELO worth of YES shares");
        
        // Account 2 buys NO shares (will lose)
        const buyNoTx2 = await coreContract.connect(account2).buyShares(
            marketId,
            false, // NO
            { value: ethers.parseEther("0.015") }
        );
        await buyNoTx2.wait();
        console.log("✅ Account 2 bought 0.015 CELO worth of NO shares");
        
        // Account 3 buys NO shares (will lose)
        const buyNoTx3 = await coreContract.connect(account3).buyShares(
            marketId,
            false, // NO
            { value: ethers.parseEther("0.025") }
        );
        await buyNoTx3.wait();
        console.log("✅ Account 3 bought 0.025 CELO worth of NO shares");
        
        // Check total pool
        const marketAfterBuying = await coreContract.getMarket(marketId);
        console.log("📝 Total pool after all purchases:", ethers.formatEther(marketAfterBuying.totalPool), "CELO");
        console.log("📝 Total YES shares:", ethers.formatEther(marketAfterBuying.totalYes), "CELO");
        console.log("📝 Total NO shares:", ethers.formatEther(marketAfterBuying.totalNo), "CELO");
        
        // Step 2: Wait for market to end and resolve it
        console.log("\n📋 Step 2: Wait for market to end and resolve it");
        console.log("⏰ Waiting for market to end...");
        await new Promise(resolve => setTimeout(resolve, 180000)); // Wait 3 minutes
        
        // Resolve market as YES (true) - Account 1 will win, others will lose
        const resolveTx = await coreContract.resolveMarket(marketId, true);
        await resolveTx.wait();
        console.log("✅ Market resolved successfully as YES");
        
        // Step 3: Test claiming functionality for all accounts
        console.log("\n📋 Step 3: Test claiming functionality for all accounts");
        
        // Check market status
        const market = await coreContract.getMarket(marketId);
        console.log("📝 Market status:", market.status.toString());
        console.log("📝 Market outcome:", market.outcome);
        console.log("📝 Market total pool:", ethers.formatEther(market.totalPool), "CELO");
        
        // Check all accounts' participation and winnings
        const accounts = [
            { name: "Deployer", address: deployer.address, expectedWinner: true },
            { name: "Account 1", address: account1.address, expectedWinner: true },
            { name: "Account 2", address: account2.address, expectedWinner: false },
            { name: "Account 3", address: account3.address, expectedWinner: false }
        ];
        
        for (const account of accounts) {
            console.log(`\n📋 Checking ${account.name} (${account.address})`);
            
            // Check participation
            const participation = await coreContract.getUserParticipation(marketId, account.address);
            console.log(`📝 ${account.name} participated:`, participation[0]);
            console.log(`📝 ${account.name} side:`, participation[1]);
            console.log(`📝 ${account.name} YES shares:`, ethers.formatEther(participation[2]), "CELO");
            console.log(`📝 ${account.name} NO shares:`, ethers.formatEther(participation[3]), "CELO");
            
            // Check if winner
            const isWinner = await claimsContract.isWinner(marketId, account.address);
            console.log(`📝 ${account.name} is winner:`, isWinner);
            console.log(`📝 Expected winner:`, account.expectedWinner);
            
            // Calculate winnings
            const userWinnings = await claimsContract.calculateUserWinnings(marketId, account.address);
            console.log(`📝 ${account.name} winnings:`, ethers.formatEther(userWinnings), "CELO");
        }
        
        // Check core contract balance
        const coreBalance = await ethers.provider.getBalance(coreAddress);
        console.log("\n📝 Core contract balance:", ethers.formatEther(coreBalance), "CELO");
        
        // Step 4: Have winners claim their winnings
        console.log("\n📋 Step 4: Have winners claim their winnings");
        
        for (const account of accounts) {
            if (account.expectedWinner) {
                console.log(`\n📋 ${account.name} claiming winnings...`);
                
                let signer;
                if (account.name === "Deployer") {
                    signer = deployer;
                } else if (account.name === "Account 1") {
                    signer = account1;
                }
                
                const initialBalance = await ethers.provider.getBalance(account.address);
                console.log(`📝 ${account.name} initial balance:`, ethers.formatEther(initialBalance), "CELO");
                
                const claimTx = await claimsContract.connect(signer).claimWinnings(marketId);
                await claimTx.wait();
                console.log(`✅ ${account.name} claimed winnings successfully!`);
                
                const finalBalance = await ethers.provider.getBalance(account.address);
                console.log(`📝 ${account.name} final balance:`, ethers.formatEther(finalBalance), "CELO");
                const actualWinnings = finalBalance - initialBalance;
                console.log(`📝 ${account.name} actual winnings:`, ethers.formatEther(actualWinnings), "CELO");
            } else {
                console.log(`\n📋 ${account.name} has no winnings to claim (lost the bet)`);
            }
        }
        
        // Check final core contract balance
        const finalCoreBalance = await ethers.provider.getBalance(coreAddress);
        console.log("\n📝 Final core contract balance:", ethers.formatEther(finalCoreBalance), "CELO");
        
        console.log("\n🎉 Complete flow test passed successfully!");
        
    } catch (error) {
        console.error("❌ Test failed:", error.message);
        console.error("❌ Full error:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

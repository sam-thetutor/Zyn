const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 Testing Proportional Winnings System");
    console.log("=====================================\n");

    // Get signers
    const [admin] = await ethers.getSigners();
    console.log(`👑 Admin: ${admin.address}`);
    console.log(`💰 Admin balance: ${ethers.formatEther(await admin.provider.getBalance(admin.address))} CELO\n`);

    // Create test users
    const user1 = ethers.Wallet.createRandom().connect(admin.provider);
    const user2 = ethers.Wallet.createRandom().connect(admin.provider);
    const user3 = ethers.Wallet.createRandom().connect(admin.provider);
    
    console.log(`👤 User 1: ${user1.address}`);
    console.log(`👤 User 2: ${user2.address}`);
    console.log(`👤 User 3: ${user3.address}\n`);

    // Fund test users
    const fundingAmount = ethers.parseEther("0.2");
    console.log(`💸 Funding users with ${ethers.formatEther(fundingAmount)} CELO each...`);
    
    await admin.sendTransaction({
        to: user1.address,
        value: fundingAmount
    });
    
    await admin.sendTransaction({
        to: user2.address,
        value: fundingAmount
    });
    
    await admin.sendTransaction({
        to: user3.address,
        value: fundingAmount
    });
    
    console.log("✅ Users funded successfully\n");

    // Deploy contract
    console.log("📦 Deploying PredictionMarket contract...");
    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    const predictionMarket = await PredictionMarket.deploy();
    await predictionMarket.waitForDeployment();
    
    const contractAddress = await predictionMarket.getAddress();
    console.log(`✅ Contract deployed to: ${contractAddress}\n`);

    // Create a market
    console.log("🏪 Creating a test market...");
    const creationFee = await predictionMarket.marketCreationFee();
    const endTime = Math.floor(Date.now() / 1000) + 60; // 1 minute from now
    
    const createTx = await predictionMarket.connect(admin).createMarket(
        "Will Bitcoin reach $100k by end of year?",
        "A prediction market on Bitcoin's price trajectory",
        "Cryptocurrency",
        "https://example.com/bitcoin.jpg",
        endTime,
        { value: creationFee }
    );
    
    await createTx.wait();
    console.log("✅ Market created successfully");
    console.log(`📅 End time: ${new Date(endTime * 1000).toLocaleString()}\n`);

    // Users buy shares with different amounts
    console.log("🛒 Users buying shares...");
    
    // User 1 buys 0.1 CELO worth of YES shares
    const user1Amount = ethers.parseEther("0.1");
    const user1Tx = await predictionMarket.connect(user1).buyShares(1, true, { value: user1Amount });
    await user1Tx.wait();
    console.log(`✅ User 1 bought ${ethers.formatEther(user1Amount)} CELO worth of YES shares`);
    
    // User 2 buys 0.05 CELO worth of NO shares
    const user2Amount = ethers.parseEther("0.05");
    const user2Tx = await predictionMarket.connect(user2).buyShares(1, false, { value: user2Amount });
    await user2Tx.wait();
    console.log(`✅ User 2 bought ${ethers.formatEther(user2Amount)} CELO worth of NO shares`);
    
    // User 3 buys 0.15 CELO worth of NO shares
    const user3Amount = ethers.parseEther("0.15");
    const user3Tx = await predictionMarket.connect(user3).buyShares(1, false, { value: user3Amount });
    await user3Tx.wait();
    console.log(`✅ User 3 bought ${ethers.formatEther(user3Amount)} CELO worth of NO shares\n`);

    // Wait for market to end
    console.log("⏳ Waiting for market to end...");
    const waitTimeMs = 65000; // 65 seconds (market ends in 60 seconds + 5 second buffer)
    await new Promise(resolve => setTimeout(resolve, waitTimeMs));
    console.log("✅ Market has ended\n");

    // Admin resolves market as NO (so NO shares win)
    console.log("🔍 Admin resolving market as NO...");
    const resolveTx = await predictionMarket.connect(admin).resolveMarket(1, false);
    await resolveTx.wait();
    console.log("✅ Market resolved as NO\n");

    // Wait a bit for blockchain state to update
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check market details
    console.log("📊 Market Details:");
    const market = await predictionMarket.markets(1);
    console.log(`   Status: ${market.status}`);
    console.log(`   Outcome: ${market.outcome}`);
    console.log(`   Total Pool: ${ethers.formatEther(market.totalPool)} CELO`);
    console.log(`   Winner Count: ${market.winnerCount}`);
    console.log(`   Total Winning Shares: ${ethers.formatEther(market.totalWinningShares)} CELO\n`);

    // Get winners
    const winners = await predictionMarket.getMarketWinners(1);
    console.log("🏆 Winners:");
    for (let i = 0; i < winners.length; i++) {
        const winner = winners[i];
        const shares = await predictionMarket.getUserShares(1, winner, false); // false = NO shares
        const winnings = await predictionMarket.calculateUserWinnings(1, winner);
        console.log(`   ${i + 1}. ${winner}: ${ethers.formatEther(shares)} shares → ${ethers.formatEther(winnings)} CELO`);
    }
    console.log();

    // Calculate expected distribution
    const totalPool = market.totalPool;
    const totalWinnerAmount = (totalPool * 70n) / 100n;      // 70% to winners
    const adminAmount = (totalPool * 15n) / 100n;            // 15% to admin
    const publicPoolAmount = (totalPool * 15n) / 100n;       // 15% to public pool
    
    console.log("💰 Expected Distribution:");
    console.log(`   Total Pool: ${ethers.formatEther(totalPool)} CELO`);
    console.log(`   Winners (70%): ${ethers.formatEther(totalWinnerAmount)} CELO`);
    console.log(`   Admin (15%): ${ethers.formatEther(adminAmount)} CELO`);
    console.log(`   Public Pool (15%): ${ethers.formatEther(publicPoolAmount)} CELO\n`);

    // Test claiming
    console.log("🎯 Testing claim functionality...");
    
    // User 2 claims (winner with 0.05 CELO shares)
    console.log(`👤 User 2 claiming winnings...`);
    const user2ClaimTx = await predictionMarket.connect(user2).claimWinnings(1);
    await user2ClaimTx.wait();
    console.log("✅ User 2 claimed winnings successfully");
    
    // User 3 claims (winner with 0.15 CELO shares)
    console.log(`👤 User 3 claiming winnings...`);
    const user3ClaimTx = await predictionMarket.connect(user3).claimWinnings(1);
    await user3ClaimTx.wait();
    console.log("✅ User 3 claimed winnings successfully\n");

    // Check final balances
    console.log("💳 Final Balances:");
    const user2FinalBalance = await admin.provider.getBalance(user2.address);
    const user3FinalBalance = await admin.provider.getBalance(user3.address);
    
    console.log(`   User 2: ${ethers.formatEther(user2FinalBalance)} CELO`);
    console.log(`   User 3: ${ethers.formatEther(user3FinalBalance)} CELO`);
    
    // Check if User 1 can claim (should fail - not a winner)
    console.log("\n❌ Testing non-winner claim (should fail)...");
    try {
        await predictionMarket.connect(user1).claimWinnings(1);
        console.log("❌ User 1 was able to claim (this shouldn't happen)");
    } catch (error) {
        console.log("✅ User 1 correctly cannot claim (not a winner)");
    }

    console.log("\n🎉 Proportional winnings test completed successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    });

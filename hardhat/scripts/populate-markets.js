const { ethers } = require("hardhat");

async function main() {
    console.log("🏪 Populating Markets with Sample Data");
    console.log("=====================================\n");

    // Get signers
    const [admin] = await ethers.getSigners();
    console.log(`👑 Admin: ${admin.address}`);
    console.log(`💰 Admin balance: ${ethers.formatEther(await admin.provider.getBalance(admin.address))} CELO\n`);

    // Create test users
    const user1 = ethers.Wallet.createRandom().connect(admin.provider);
    const user2 = ethers.Wallet.createRandom().connect(admin.provider);
    const user3 = ethers.Wallet.createRandom().connect(admin.provider);
    const user4 = ethers.Wallet.createRandom().connect(admin.provider);
    const user5 = ethers.Wallet.createRandom().connect(admin.provider);
    
    console.log(`👤 User 1: ${user1.address}`);
    console.log(`👤 User 2: ${user2.address}`);
    console.log(`👤 User 3: ${user3.address}`);
    console.log(`👤 User 4: ${user4.address}`);
    console.log(`👤 User 5: ${user5.address}\n`);

    // Fund test users
    const fundingAmount = ethers.parseEther("0.2");
    console.log(`💸 Funding users with ${ethers.formatEther(fundingAmount)} CELO each...`);
    
    for (const user of [user1, user2, user3, user4, user5]) {
        await admin.sendTransaction({
            to: user.address,
            value: fundingAmount
        });
    }
    
    console.log("✅ Users funded successfully\n");

    // Connect to deployed contract
    const contractAddress = "0x0101e93BAe8dfA2F59ecd6E7A52B9bF38c9367A4";
    console.log(`🔗 Connecting to deployed contract: ${contractAddress}`);
    
    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    const predictionMarket = PredictionMarket.attach(contractAddress);
    console.log("✅ Connected to contract\n");

    // Get current blockchain timestamp
    const currentBlock = await admin.provider.getBlock("latest");
    const currentTimestamp = currentBlock.timestamp;
    console.log(`⏰ Current blockchain time: ${new Date(currentTimestamp * 1000).toLocaleString()}\n`);

    // Market data
    const markets = [
        {
            question: "Will Ethereum reach $5,000 by December 2024?",
            description: "Prediction on Ethereum's price performance",
            category: "Cryptocurrency",
            image: "https://example.com/ethereum.jpg",
            endTime: currentTimestamp + 600, // 10 minutes from blockchain time
            outcome: true, // YES will win
            userShares: [
                { user: user1, amount: "0.05", side: true },   // YES
                { user: user2, amount: "0.04", side: false }, // NO
                { user: user3, amount: "0.06", side: true },  // YES
            ]
        },
        {
            question: "Will Apple stock be above $200 on January 1st, 2025?",
            description: "Stock market prediction for Apple Inc.",
            category: "Stocks",
            image: "https://example.com/apple.jpg",
            endTime: currentTimestamp + 900, // 15 minutes from blockchain time
            outcome: false, // NO will win
            userShares: [
                { user: user2, amount: "0.08", side: false }, // NO
                { user: user4, amount: "0.05", side: true },   // YES
                { user: user5, amount: "0.1", side: false },  // NO
            ]
        },
        {
            question: "Will the Lakers win the NBA Championship in 2025?",
            description: "Sports prediction for NBA season",
            category: "Sports",
            image: "https://example.com/lakers.jpg",
            endTime: currentTimestamp + 1200, // 20 minutes from blockchain time
            outcome: true, // YES will win
            userShares: [
                { user: user1, amount: "0.09", side: true },  // YES
                { user: user3, amount: "0.11", side: false }, // NO
                { user: user4, amount: "0.08", side: true },  // YES
                { user: user5, amount: "0.07", side: false }, // NO
            ]
        },
        {
            question: "Will it rain in New York on Christmas Day 2024?",
            description: "Weather prediction for New York City",
            category: "Weather",
            image: "https://example.com/weather.jpg",
            endTime: currentTimestamp + 1500, // 25 minutes from blockchain time
            outcome: false, // NO will win
            userShares: [
                { user: user1, amount: "0.04", side: false }, // NO
                { user: user2, amount: "0.05", side: true },  // YES
                { user: user3, amount: "0.06", side: false }, // NO
            ]
        }
    ];

    // Create and populate markets
    for (let i = 0; i < markets.length; i++) {
        const market = markets[i];
        console.log(`🏪 Creating Market ${i + 1}: ${market.question}`);
        
        // Create market
        const creationFee = await predictionMarket.marketCreationFee();
        const createTx = await predictionMarket.connect(admin).createMarket(
            market.question,
            market.description,
            market.category,
            market.image,
            market.endTime,
            { value: creationFee }
        );
        
        await createTx.wait();
        const marketId = i + 1;
        console.log(`✅ Market ${marketId} created successfully`);
        console.log(`📅 End time: ${new Date(market.endTime * 1000).toLocaleString()}`);
        
        // Users buy shares
        console.log("🛒 Users buying shares...");
        for (const share of market.userShares) {
            const amount = ethers.parseEther(share.amount);
            const tx = await predictionMarket.connect(share.user).buyShares(
                marketId, 
                share.side, 
                { value: amount }
            );
            await tx.wait();
            console.log(`   ${share.user.address}: ${ethers.formatEther(amount)} CELO ${share.side ? 'YES' : 'NO'} shares`);
        }
        console.log();
    }

    // Wait for markets to end and resolve them
    console.log("⏳ Waiting for markets to end and resolving them...\n");
    
    for (let i = 0; i < markets.length; i++) {
        const market = markets[i];
        const marketId = i + 1;
        
        // Wait for market to end
        const currentTime = Math.floor(Date.now() / 1000);
        const timeToWait = Math.max(0, market.endTime - currentTime + 5); // 5 second buffer
        
        if (timeToWait > 0) {
            console.log(`⏳ Waiting ${timeToWait} seconds for Market ${marketId} to end...`);
            await new Promise(resolve => setTimeout(resolve, timeToWait * 1000));
        }
        
        // Resolve market
        console.log(`🔍 Resolving Market ${marketId} as ${market.outcome ? 'YES' : 'NO'}...`);
        const resolveTx = await predictionMarket.connect(admin).resolveMarket(marketId, market.outcome);
        await resolveTx.wait();
        console.log(`✅ Market ${marketId} resolved successfully\n`);
        
        // Wait a bit for blockchain state to update
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Display final market statuses
    console.log("📊 Final Market Statuses:");
    console.log("========================\n");
    
    for (let i = 0; i < markets.length; i++) {
        const marketId = i + 1;
        const market = markets[i];
        
        try {
            const marketData = await predictionMarket.markets(marketId);
            const winners = await predictionMarket.getMarketWinners(marketId);
            
            console.log(`🏪 Market ${marketId}: ${market.question}`);
            console.log(`   Status: ${marketData.status === 1 ? 'RESOLVED' : 'ACTIVE'}`);
            console.log(`   Outcome: ${marketData.outcome ? 'YES' : 'NO'}`);
            console.log(`   Total Pool: ${ethers.formatEther(marketData.totalPool)} CELO`);
            console.log(`   Winners: ${winners.length}`);
            console.log(`   Category: ${market.category}`);
            console.log();
        } catch (error) {
            console.log(`❌ Error getting Market ${marketId} data: ${error.message}\n`);
        }
    }

    // Test claiming for a few markets
    console.log("🎯 Testing claim functionality for some markets...\n");
    
    // Market 1 winners (YES shares)
    const market1Winners = await predictionMarket.getMarketWinners(1);
    for (const winner of market1Winners) {
        const winnings = await predictionMarket.calculateUserWinnings(1, winner);
        if (winnings > 0) {
            console.log(`👤 ${winner} claiming ${ethers.formatEther(winnings)} CELO from Market 1...`);
            try {
                const claimTx = await predictionMarket.connect(ethers.provider.getSigner(winner)).claimWinnings(1);
                await claimTx.wait();
                console.log("✅ Claimed successfully");
            } catch (error) {
                console.log(`❌ Claim failed: ${error.message}`);
            }
        }
    }
    
    // Market 2 winners (NO shares)
    const market2Winners = await predictionMarket.getMarketWinners(2);
    for (const winner of market2Winners) {
        const winnings = await predictionMarket.calculateUserWinnings(2, winner);
        if (winnings > 0) {
            console.log(`👤 ${winner} claiming ${ethers.formatEther(winnings)} CELO from Market 2...`);
            try {
                const claimTx = await predictionMarket.connect(ethers.provider.getSigner(winner)).claimWinnings(2);
                await claimTx.wait();
                console.log("✅ Claimed successfully");
            } catch (error) {
                console.log(`❌ Claim failed: ${error.message}`);
            }
        }
    }

    console.log("\n🎉 Market population completed successfully!");
    console.log("📱 You can now view these resolved markets on the frontend!");
    console.log(`🔗 Contract Address: ${contractAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

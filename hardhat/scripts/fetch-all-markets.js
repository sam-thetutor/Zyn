const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Fetching All Markets from Smart Contract");
  console.log("=============================================");

  try {
    // Get the signer
    const [signer] = await ethers.getSigners();
    console.log("👤 Signer address:", signer.address);
    console.log("💰 Signer balance:", ethers.formatEther(await signer.provider.getBalance(signer.address)), "ETH");

    // Contract address (use the deployed contract address)
    const contractAddress = "0x0C49604c65588858DC206AAC6EFEc0F8Afe2d1d6";
    console.log("📋 Contract address:", contractAddress);

    // Get contract instance
    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    const predictionMarket = PredictionMarket.attach(contractAddress);

    // Check if contract exists
    const code = await signer.provider.getCode(contractAddress);
    if (code === "0x") {
      console.log("❌ Contract does not exist at this address");
      return;
    }
    console.log("✅ Contract exists at address");

    // Get contract owner
    try {
      const owner = await predictionMarket.owner();
      console.log("👑 Contract owner:", owner);
    } catch (error) {
      console.log("⚠️  Could not get contract owner:", error.message);
    }

    // Get fee information
    try {
      const [creationFee, tradingFee] = await predictionMarket.getFeeInfo();
      console.log("💸 Market creation fee:", ethers.formatEther(creationFee), "ETH");
      console.log("💸 Trading fee:", ethers.formatEther(tradingFee), "ETH");
    } catch (error) {
      console.log("⚠️  Could not get fee info:", error.message);
    }

    // Get total markets count
    console.log("\n📊 Fetching Markets Data...");
    let totalMarkets;
    try {
      totalMarkets = await predictionMarket.getTotalMarkets();
      console.log("📈 Total markets created:", totalMarkets.toString());
    } catch (error) {
      console.log("❌ Error getting total markets:", error.message);
      return;
    }

    if (totalMarkets === 0n) {
      console.log("📭 No markets have been created yet");
      return;
    }

    // Fetch each market individually
    console.log("\n🔍 Fetching Individual Markets...");
    console.log("=====================================");

    for (let i = 1; i <= Number(totalMarkets); i++) {
      console.log(`\n📋 Market #${i}:`);
      console.log("----------------");
      
      try {
        const market = await predictionMarket.getMarket(BigInt(i));
        
        if (market) {
          console.log("🆔 ID:", market.id.toString());
          console.log("❓ Question:", market.question);
          console.log("📝 Description:", market.description);
          console.log("⏰ End Time:", new Date(Number(market.endTime) * 1000).toLocaleString());
          console.log("✅ Resolved:", market.resolved);
          console.log("🎯 Outcome:", market.outcome);
          console.log("🟢 Total Yes Shares:", ethers.formatEther(market.totalYes), "ETH");
          console.log("🔴 Total No Shares:", ethers.formatEther(market.totalNo), "ETH");
          
          // Calculate total volume
          const totalVolume = market.totalYes + market.totalNo;
          console.log("💰 Total Volume:", ethers.formatEther(totalVolume), "ETH");
          
          // Check if market is ended
          const now = Math.floor(Date.now() / 1000);
          const isEnded = Number(market.endTime) <= now;
          console.log("⏳ Market Status:", isEnded ? "Ended" : "Active");
          
          // Check if market is resolved
          if (market.resolved) {
            console.log("🏁 Market Result:", market.outcome ? "YES" : "NO");
          } else if (isEnded) {
            console.log("⏳ Market ended but not resolved");
          } else {
            console.log("🔄 Market is still active");
          }
        } else {
          console.log("❌ Market data is null");
        }
      } catch (error) {
        console.log(`❌ Error fetching market #${i}:`, error.message);
      }
    }

    // Try to get market from the markets array directly
    console.log("\n🔍 Checking Markets Array...");
    console.log("=============================");
    
    try {
      const marketFromArray = await predictionMarket.markets(0);
      console.log("📋 Market from array[0]:", marketFromArray);
    } catch (error) {
      console.log("❌ Error accessing markets array:", error.message);
    }

    // Check for any events
    console.log("\n📡 Checking Recent Events...");
    console.log("=============================");
    
    try {
      const currentBlock = await signer.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 1000); // Last 1000 blocks
      
      console.log(`🔍 Checking events from block ${fromBlock} to ${currentBlock}`);
      
      const marketCreatedEvents = await predictionMarket.queryFilter(
        predictionMarket.filters.MarketCreated(),
        fromBlock,
        currentBlock
      );
      
      console.log("🎉 MarketCreated events found:", marketCreatedEvents.length);
      
      if (marketCreatedEvents.length > 0) {
        marketCreatedEvents.forEach((event, index) => {
          console.log(`\n📅 Event ${index + 1}:`);
          console.log("  Block:", event.blockNumber);
          console.log("  Market ID:", event.args.marketId.toString());
          console.log("  Question:", event.args.question);
          console.log("  End Time:", new Date(Number(event.args.endTime) * 1000).toLocaleString());
        });
      }
      
      const sharesBoughtEvents = await predictionMarket.queryFilter(
        predictionMarket.filters.SharesBought(),
        fromBlock,
        currentBlock
      );
      
      console.log("🛒 SharesBought events found:", sharesBoughtEvents.length);
      
      if (sharesBoughtEvents.length > 0) {
        sharesBoughtEvents.forEach((event, index) => {
          console.log(`\n🛒 Event ${index + 1}:`);
          console.log("  Block:", event.blockNumber);
          console.log("  Market ID:", event.args.marketId.toString());
          console.log("  Buyer:", event.args.buyer);
          console.log("  Outcome:", event.args.outcome ? "YES" : "NO");
          console.log("  Amount:", ethers.formatEther(event.args.amount), "ETH");
        });
      }
      
    } catch (error) {
      console.log("❌ Error checking events:", error.message);
    }

    console.log("\n✅ Market fetch complete!");

  } catch (error) {
    console.error("❌ Script failed:", error);
    console.error("Stack trace:", error.stack);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

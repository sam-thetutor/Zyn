const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting Market Creation and Share Trading Script");
  
  // Check if private key is configured
  if (!process.env.PRIVATE_KEY) {
    throw new Error("❌ PRIVATE_KEY not found in environment variables");
  }
  
  // Create wallet from private key
  const privateKeyAccount = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
  console.log("✅ Private key account configured:", privateKeyAccount.address);
  
  // Check initial balance
  const initialBalance = await ethers.provider.getBalance(privateKeyAccount.address);
  console.log("💰 Initial balance:", ethers.formatEther(initialBalance), "ETH");
  
  if (initialBalance === 0n) {
    throw new Error("❌ Account has no balance to perform transactions");
  }
  
  // Calculate required amount for operations
  const requiredAmount = ethers.parseEther("0.00011"); // Market creation + shares + gas buffer
  
  if (initialBalance < requiredAmount) {
    console.log("⚠️  Warning: Balance might be insufficient for all operations");
    console.log("   Required: 0.00011 ETH (market creation + shares + gas)");
    console.log("   Available:", ethers.formatEther(initialBalance), "ETH");
    console.log("   Proceeding anyway...");
  }
  
  // Use the deployed contract address
  console.log("📋 Using deployed PredictionMarket contract...");
  const contractAddress = "0x0C49604c65588858DC206AAC6EFEc0F8Afe2d1d6";
  const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
  const predictionMarket = PredictionMarket.attach(contractAddress);
  console.log("✅ Contract attached at:", contractAddress);
  
  // Set market parameters
  const question = "Will the price of ETH reach $5000 by the end of 2024?";
  const description = "A prediction market for Ethereum price movement";
  const currentTime = Math.floor(Date.now() / 1000);
  const endTime = currentTime + 86400; // 24 hours from now
  
  // Get creation fee
  const creationFee = await predictionMarket.marketCreationFee();
  console.log("💸 Market creation fee:", ethers.formatEther(creationFee), "ETH");
  
  // Check balance before market creation
  const balanceBeforeCreation = await ethers.provider.getBalance(privateKeyAccount.address);
  console.log("💰 Balance before market creation:", ethers.formatEther(balanceBeforeCreation), "ETH");
  
  // Create market
  console.log("🏗️  Creating market...");
  const createMarketTx = await predictionMarket.connect(privateKeyAccount).createMarket(
    question,
    description,
    endTime,
    { value: creationFee }
  );
  
  console.log("⏳ Waiting for market creation transaction...");
  const createMarketReceipt = await createMarketTx.wait();
  
  // Get market ID from event
  const marketCreatedEvent = createMarketReceipt.logs.find(log => {
    try {
      const parsed = predictionMarket.interface.parseLog(log);
      return parsed.name === "MarketCreated";
    } catch {
      return false;
    }
  });
  
  let marketId;
  if (marketCreatedEvent) {
    const parsed = predictionMarket.interface.parseLog(marketCreatedEvent);
    marketId = parsed.args[0];
    console.log("✅ Market created with ID:", marketId.toString());
  } else {
    throw new Error("❌ Could not find MarketCreated event");
  }
  
  // Verify market details
  const market = await predictionMarket.getMarket(marketId);
  console.log("📊 Market details:");
  console.log("   Question:", market.question);
  console.log("   Description:", market.description);
  console.log("   End time:", new Date(Number(market.endTime) * 1000).toLocaleString());
  console.log("   Resolved:", market.resolved);
  
  // Check balance after market creation
  const balanceAfterCreation = await ethers.provider.getBalance(privateKeyAccount.address);
  console.log("💰 Balance after market creation:", ethers.formatEther(balanceAfterCreation), "ETH");
  
  // Buy Yes shares
  const yesShareAmount = ethers.parseEther("0.00003"); // 0.00003 ETH
  console.log("📈 Buying Yes shares for:", ethers.formatEther(yesShareAmount), "ETH");
  
  const buyYesTx = await predictionMarket.connect(privateKeyAccount).buyShares(
    marketId,
    true, // Yes shares
    { value: yesShareAmount }
  );
  
  console.log("⏳ Waiting for Yes shares transaction...");
  await buyYesTx.wait();
  
  // Buy No shares
  const noShareAmount = ethers.parseEther("0.00003"); // 0.00003 ETH
  console.log("📉 Buying No shares for:", ethers.formatEther(noShareAmount), "ETH");
  
  const buyNoTx = await predictionMarket.connect(privateKeyAccount).buyShares(
    marketId,
    false, // No shares
    { value: noShareAmount }
  );
  
  console.log("⏳ Waiting for No shares transaction...");
  await buyNoTx.wait();
  
  // Verify shares
  const yesShares = await predictionMarket.getUserShares(marketId, privateKeyAccount.address, true);
  const noShares = await predictionMarket.getUserShares(marketId, privateKeyAccount.address, false);
  
  console.log("📊 Share ownership verified:");
  console.log("   Yes shares:", ethers.formatEther(yesShares), "ETH");
  console.log("   No shares:", ethers.formatEther(noShares), "ETH");
  
  // Get updated market totals
  const updatedMarket = await predictionMarket.getMarket(marketId);
  console.log("📈 Market totals:");
  console.log("   Total Yes shares:", ethers.formatEther(updatedMarket.totalYes), "ETH");
  console.log("   Total No shares:", ethers.formatEther(updatedMarket.totalNo), "ETH");
  
  // Final balance check
  const finalBalance = await ethers.provider.getBalance(privateKeyAccount.address);
  console.log("💰 Final balance:", ethers.formatEther(finalBalance), "ETH");
  
  const totalSpent = initialBalance - finalBalance;
  console.log("💸 Total spent (including gas):", ethers.formatEther(totalSpent), "ETH");
  
  console.log("🎉 Script completed successfully!");
  console.log("📋 Market ID:", marketId);
  console.log("🔗 Contract address:", contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

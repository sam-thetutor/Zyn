const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking Market Status on Base Mainnet");
  
  // Check if private key is configured
  if (!process.env.PRIVATE_KEY) {
    throw new Error("❌ PRIVATE_KEY not found in environment variables");
  }
  
  // Create wallet from private key
  const privateKeyAccount = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
  console.log("✅ Account address:", privateKeyAccount.address);
  
  // Contract address
  const contractAddress = "0x0C49604c65588858DC206AAC6EFEc0F8Afe2d1d6";
  
  // Get contract instance
  const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
  const predictionMarket = PredictionMarket.attach(contractAddress);
  
  console.log("📋 Contract address:", contractAddress);
  
  // Check total markets
  const totalMarkets = await predictionMarket.getTotalMarkets();
  console.log("📊 Total markets:", totalMarkets.toString());
  
  if (totalMarkets > 0) {
    // Get market details
    const market = await predictionMarket.getMarket(1);
    console.log("\n📋 Market #1 Details:");
    console.log("   Question:", market.question);
    console.log("   Description:", market.description);
    console.log("   End time:", new Date(Number(market.endTime) * 1000).toLocaleString());
    console.log("   Resolved:", market.resolved);
    console.log("   Total Yes shares:", ethers.formatEther(market.totalYes), "ETH");
    console.log("   Total No shares:", ethers.formatEther(market.totalNo), "ETH");
    
    // Check user shares
    const yesShares = await predictionMarket.getUserShares(1, privateKeyAccount.address, true);
    const noShares = await predictionMarket.getUserShares(1, privateKeyAccount.address, false);
    
    console.log("\n👤 Your Shares in Market #1:");
    console.log("   Yes shares:", ethers.formatEther(yesShares), "ETH");
    console.log("   No shares:", ethers.formatEther(noShares), "ETH");
    
    // Check current fees
    const [creationFee, tradingFee] = await predictionMarket.getFeeInfo();
    console.log("\n💸 Current Fees:");
    console.log("   Market Creation Fee:", ethers.formatEther(creationFee), "ETH");
    console.log("   Trading Fee:", ethers.formatEther(tradingFee), "ETH");
  }
  
  // Check account balance
  const balance = await ethers.provider.getBalance(privateKeyAccount.address);
  console.log("\n💰 Current Account Balance:", ethers.formatEther(balance), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

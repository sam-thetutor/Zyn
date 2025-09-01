const { ethers } = require("hardhat");

async function main() {
  console.log("📉 Buying No Shares for Market #1");
  
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
  
  // Check current balance
  const balanceBefore = await ethers.provider.getBalance(privateKeyAccount.address);
  console.log("💰 Balance before purchase:", ethers.formatEther(balanceBefore), "ETH");
  
  // Buy No shares
  const noShareAmount = ethers.parseEther("0.00003"); // 0.00003 ETH
  console.log("📉 Buying No shares for amount:", ethers.formatEther(noShareAmount), "ETH");
  
  try {
    const tx = await predictionMarket.connect(privateKeyAccount).buyShares(
      1, // Market ID 1
      false, // No shares
      { value: noShareAmount }
    );
    
    console.log("⏳ Waiting for transaction...");
    const receipt = await tx.wait();
    
    console.log("✅ No shares purchased successfully!");
    console.log("   Transaction hash:", tx.hash);
    console.log("   Gas used:", receipt.gasUsed.toString());
    
    // Verify the purchase
    const noShares = await predictionMarket.getUserShares(1, privateKeyAccount.address, false);
    console.log("📊 No shares owned:", ethers.formatEther(noShares), "ETH");
    
    // Check balance after purchase
    const balanceAfter = await ethers.provider.getBalance(privateKeyAccount.address);
    console.log("💰 Balance after purchase:", ethers.formatEther(balanceAfter), "ETH");
    
    // Get updated market totals
    const market = await predictionMarket.getMarket(1);
    console.log("📈 Market totals:");
    console.log("   Total Yes shares:", ethers.formatEther(market.totalYes), "ETH");
    console.log("   Total No shares:", ethers.formatEther(market.totalNo), "ETH");
    
  } catch (error) {
    console.error("❌ Failed to buy No shares:", error.message);
    
    if (error.message.includes("nonce too low")) {
      console.log("💡 This usually means the transaction was already processed or there's a nonce mismatch.");
      console.log("   Let's check the current market status...");
      
      // Check current shares
      const noShares = await predictionMarket.getUserShares(1, privateKeyAccount.address, false);
      console.log("📊 Current No shares:", ethers.formatEther(noShares), "ETH");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

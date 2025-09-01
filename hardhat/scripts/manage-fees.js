const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 PredictionMarket Fee Management Script");
  
  // Check if private key is configured
  if (!process.env.PRIVATE_KEY) {
    throw new Error("❌ PRIVATE_KEY not found in environment variables");
  }
  
  // Create wallet from private key
  const privateKeyAccount = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
  console.log("✅ Account address:", privateKeyAccount.address);
  
  // Check if this account is the owner (you'll need to deploy the contract first)
  console.log("📋 Note: This script assumes you have deployed the PredictionMarket contract");
  console.log("   and this account is the owner. If not, update the contract address below.");
  
  // Contract address - Updated with your deployed contract address
  const contractAddress = "0x0C49604c65588858DC206AAC6EFEc0F8Afe2d1d6";
  
  if (contractAddress === "YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE") {
    console.log("❌ Please update the contract address in this script first!");
    process.exit(1);
  }
  
  // Get contract instance
  const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
  const predictionMarket = PredictionMarket.attach(contractAddress);
  
  // Check current fees
  console.log("\n📊 Current Fee Information:");
  const [creationFee, tradingFee] = await predictionMarket.getFeeInfo();
  console.log("   Market Creation Fee:", ethers.formatEther(creationFee), "ETH");
  console.log("   Trading Fee:", ethers.formatEther(tradingFee), "ETH");
  
  // Check if this account is the owner
  const owner = await predictionMarket.owner();
  console.log("   Contract Owner:", owner);
  console.log("   Is this account owner?", owner === privateKeyAccount.address ? "✅ Yes" : "❌ No");
  
  if (owner !== privateKeyAccount.address) {
    console.log("❌ Only the contract owner can modify fees!");
    process.exit(1);
  }
  
  // Example fee updates (uncomment and modify as needed)
  console.log("\n🔧 Available Fee Management Functions:");
  console.log("1. setMarketCreationFee(newFee) - Update creation fee only");
  console.log("2. setTradingFee(newFee) - Update trading fee only");
  console.log("3. setFees(newCreationFee, newTradingFee) - Update both fees at once");
  
  // Example: Update to production fees
  console.log("\n💡 Example: Update to production fees");
  console.log("   Current (testing): Creation: 0.00005 ETH, Trading: 0.00001 ETH");
  console.log("   Production: Creation: 0.001 ETH, Trading: 0.005 ETH");
  
  // Uncomment the lines below to actually update fees
  /*
  console.log("\n🚀 Updating to production fees...");
  
  const newCreationFee = ethers.parseEther("0.001"); // 0.001 ETH
  const newTradingFee = ethers.parseEther("0.005"); // 0.005 ETH
  
  const updateTx = await predictionMarket.connect(privateKeyAccount).setFees(
    newCreationFee,
    newTradingFee
  );
  
  console.log("⏳ Waiting for fee update transaction...");
  const receipt = await updateTx.wait();
  
  console.log("✅ Fees updated successfully!");
  console.log("   Transaction hash:", updateTx.hash);
  console.log("   Gas used:", receipt.gasUsed.toString());
  
  // Verify the update
  const [updatedCreationFee, updatedTradingFee] = await predictionMarket.getFeeInfo();
  console.log("\n📊 Updated Fee Information:");
  console.log("   Market Creation Fee:", ethers.formatEther(updatedCreationFee), "ETH");
  console.log("   Trading Fee:", ethers.formatEther(updatedTradingFee), "ETH");
  */
  
  console.log("\n✨ Fee management script completed!");
  console.log("💡 To update fees, uncomment the code above and modify the values as needed.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

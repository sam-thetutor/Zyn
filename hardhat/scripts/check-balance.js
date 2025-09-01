const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking Account Balance on Base Mainnet");
  
  // Check if private key is configured
  if (!process.env.PRIVATE_KEY) {
    throw new Error("❌ PRIVATE_KEY not found in environment variables");
  }
  
  // Create wallet from private key
  const privateKeyAccount = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
  console.log("✅ Account address:", privateKeyAccount.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(privateKeyAccount.address);
  const balanceInEth = ethers.formatEther(balance);
  
  console.log("💰 Balance:", balanceInEth, "ETH");
  console.log("💰 Balance in Wei:", balance.toString());
  
  // Check if balance is sufficient for our operations
  const requiredAmount = ethers.parseEther("0.00011"); // Market creation + shares + gas
  
  if (balance >= requiredAmount) {
    console.log("✅ Sufficient balance for market creation and trading!");
  } else {
    console.log("❌ Insufficient balance. Need at least 0.02 ETH for operations.");
    console.log("💡 You can fund this account using:");
    console.log("   - Base Bridge: https://bridge.base.org/");
    console.log("   - DEX on Base (Uniswap, etc.)");
    console.log("   - Transfer from another Base account");
  }
  
  // Also check the provider to confirm we're on Base mainnet
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network ID:", network.chainId);
  console.log("🌐 Network Name:", network.chainId === 8453 ? "Base Mainnet" : "Unknown Network");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

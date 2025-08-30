const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking Market Count on Deployed Contracts");
  console.log("=============================================");

  // Contract addresses from verification
  const coreContractAddress = "0x0Abd4d2B35313CD75953A3f2B1491Bc99764d3a8";
  const claimsContractAddress = "0xbf3053088bC49ABe441BF60a30a945C22Ec8c93b";

  try {
    // Get the signer
    const [deployer] = await ethers.getSigners();
    console.log("👤 Using account:", deployer.address);

    // Check core contract
    console.log("\n📋 Checking Core Contract...");
    const coreContract = await ethers.getContractAt("PredictionMarketCore", coreContractAddress);
    
    try {
      const marketCount = await coreContract.getMarketCount();
      console.log("✅ Market count:", marketCount.toString());
      
      if (marketCount > 0) {
        console.log("📊 Markets exist, checking first market...");
        try {
          const market = await coreContract.getMarket(1);
          console.log("✅ First market retrieved successfully");
          console.log("   Question:", market.question);
          console.log("   Status:", market.status);
        } catch (marketError) {
          console.log("❌ Error getting first market:", marketError.message);
        }
      }
    } catch (countError) {
      console.log("❌ Error getting market count:", countError.message);
    }

    // Check claims contract
    console.log("\n📋 Checking Claims Contract...");
    const claimsContract = await ethers.getContractAt("PredictionMarketClaims", claimsContractAddress);
    
    try {
      const coreRef = await claimsContract.coreContract();
      console.log("✅ Core contract reference:", coreRef);
      
      if (coreRef === coreContractAddress) {
        console.log("✅ Core contract reference matches!");
      } else {
        console.log("❌ Core contract reference mismatch!");
        console.log("   Expected:", coreContractAddress);
        console.log("   Got:", coreRef);
      }
    } catch (refError) {
      console.log("❌ Error getting core contract reference:", refError.message);
    }

  } catch (error) {
    console.error("❌ Script failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

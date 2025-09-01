const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Testing getMarket Function");
  console.log("=============================");

  // Contract addresses from deployment
  const coreContractAddress = "0x0Abd4d2B35313CD75953A3f2B1491Bc99764d3a8";
  const claimsContractAddress = "0xbf3053088bC49ABe441BF60a30a945C22Ec8c93b";

  try {
    const [deployer] = await ethers.getSigners();
    console.log("👤 Using account:", deployer.address);

    console.log("\n📋 Testing Core Contract getMarket...");
    const coreContract = await ethers.getContractAt("PredictionMarketCore", coreContractAddress);

    try {
      // Get market count
      const marketCount = await coreContract.getMarketCount();
      console.log("✅ Market count:", marketCount.toString());

      if (marketCount > 0) {
        console.log("📊 Markets exist, testing getMarket(1)...");
        try {
          const market = await coreContract.getMarket(1);
          console.log("✅ getMarket(1) successful!");
          console.log("   Question:", market.question);
          console.log("   Category:", market.category);
          console.log("   Image:", market.image);
          console.log("   End Time:", market.endTime.toString());
          console.log("   Status:", market.status.toString());
          console.log("   Outcome:", market.outcome);
          console.log("   Total Yes:", market.totalYes.toString());
          console.log("   Total No:", market.totalNo.toString());
          console.log("   Total Pool:", market.totalPool.toString());
          
          // Verify no description field exists
          if (market.description !== undefined) {
            console.log("❌ Description field still exists:", market.description);
          } else {
            console.log("✅ Description field correctly removed");
          }
        } catch (marketError) {
          console.log("❌ Error getting market 1:", marketError.message);
        }
      } else {
        console.log("📝 No markets exist yet. Create a market first to test getMarket.");
      }
    } catch (countError) {
      console.log("❌ Error getting market count:", countError.message);
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

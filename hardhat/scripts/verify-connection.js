const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Verifying contract connection...");
    
    // Contract addresses from deployment
    const coreAddress = "0x0Abd4d2B35313CD75953A3f2B1491Bc99764d3a8";
    const claimsAddress = "0xbf3053088bC49ABe441BF60a30a945C22Ec8c93b";
    
    // Get contract instances
    const coreContract = await ethers.getContractAt("PredictionMarketCore", coreAddress);
    const claimsContract = await ethers.getContractAt("PredictionMarketClaims", claimsAddress);
    
    console.log("📋 Checking contract references...");
    
    try {
        const coreClaimsAddress = await coreContract.claimsContract();
        console.log("Core Contract's claimsContract address:", coreClaimsAddress);
        
        const claimsCoreAddress = await claimsContract.coreContract();
        console.log("Claims Contract's coreContract address:", claimsCoreAddress);
        
        console.log("\n📋 Expected addresses:");
        console.log("Expected claimsContract in Core:", claimsAddress);
        console.log("Expected coreContract in Claims:", coreAddress);
        
        console.log("\n📋 Comparison:");
        console.log("Core -> Claims match:", coreClaimsAddress === claimsAddress);
        console.log("Claims -> Core match:", claimsCoreAddress === coreAddress);
        
        if (coreClaimsAddress === claimsAddress && claimsCoreAddress === coreAddress) {
            console.log("✅ Contract connection verified successfully!");
        } else {
            console.log("❌ Contract connection verification failed");
        }
        
    } catch (error) {
        console.error("❌ Error during verification:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Verification failed:", error);
        process.exit(1);
    });

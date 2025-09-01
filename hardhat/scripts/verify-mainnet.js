const { run } = require("hardhat");

async function main() {
    console.log("🔍 Starting contract verification on Celoscan...");
    
    // Read deployment info
    const fs = require('fs');
    let deploymentInfo;
    
    try {
        deploymentInfo = JSON.parse(fs.readFileSync('deployment-mainnet.json', 'utf8'));
        console.log("📋 Loaded deployment info from deployment-mainnet.json");
    } catch (error) {
        console.error("❌ Could not read deployment-mainnet.json. Please run deployment first.");
        process.exit(1);
    }
    
    const { coreContract, claimsContract } = deploymentInfo;
    
    console.log("📋 Contract addresses:");
    console.log("   Core Contract:", coreContract);
    console.log("   Claims Contract:", claimsContract);
    
    // Verify Core Contract
    console.log("\n🔍 Verifying Core Contract...");
    try {
        await run("verify:verify", {
            address: coreContract,
            constructorArguments: [],
            contract: "contracts/PredictionMarketCore.sol:PredictionMarketCore"
        });
        console.log("✅ Core Contract verified successfully!");
    } catch (error) {
        if (error.message.includes("Already Verified")) {
            console.log("ℹ️  Core Contract already verified");
        } else {
            console.error("❌ Failed to verify Core Contract:", error.message);
        }
    }
    
    // Verify Claims Contract
    console.log("\n🔍 Verifying Claims Contract...");
    try {
        await run("verify:verify", {
            address: claimsContract,
            constructorArguments: [coreContract],
            contract: "contracts/PredictionMarketClaims.sol:PredictionMarketClaims"
        });
        console.log("✅ Claims Contract verified successfully!");
    } catch (error) {
        if (error.message.includes("Already Verified")) {
            console.log("ℹ️  Claims Contract already verified");
        } else {
            console.error("❌ Failed to verify Claims Contract:", error.message);
        }
    }
    
    console.log("\n🎉 Verification process completed!");
    console.log("📋 Verified contracts on Celoscan:");
    console.log("   Core: https://celoscan.io/address/" + coreContract);
    console.log("   Claims: https://celoscan.io/address/" + claimsContract);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Verification failed:", error);
        process.exit(1);
    });

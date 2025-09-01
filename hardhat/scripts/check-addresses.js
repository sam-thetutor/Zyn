import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    console.log("🔍 Checking Contract Addresses...");
    
    // Contract addresses
    const coreContractAddress = "0x0C49604c65588858DC206AAC6EFEc0F8Afe2d1d6";
    const expectedClaimsAddress = "0xfFA05a77182e2CECA2667Eeec5367F8F1683478C";
    
    try {
        // Get the core contract instance
        const coreContract = await ethers.getContractAt("PredictionMarketCore", coreContractAddress);
        
        // Check what claims contract address is stored in the core contract
        console.log("📋 Core Contract Address:", coreContractAddress);
        const actualClaimsAddress = await coreContract.claimsContract();
        console.log("📋 Claims Contract Address (stored in core):", actualClaimsAddress);
        console.log("📋 Expected Claims Contract Address:", expectedClaimsAddress);
        
        // Check if they match
        if (actualClaimsAddress.toLowerCase() === expectedClaimsAddress.toLowerCase()) {
            console.log("✅ Core contract points to the correct claims contract!");
        } else {
            console.log("❌ MISMATCH! Core contract points to a different claims contract!");
            console.log("   This is why you're getting the 'only claims contract' error!");
        }
        
        // Check the claims contract
        console.log("\n📋 Checking Claims Contract...");
        const claimsContract = await ethers.getContractAt("PredictionMarketClaims", expectedClaimsAddress);
        const coreAddressFromClaims = await claimsContract.coreContract();
        console.log("📋 Core Address (from claims contract):", coreAddressFromClaims);
        
        if (coreAddressFromClaims.toLowerCase() === coreContractAddress.toLowerCase()) {
            console.log("✅ Claims contract points to the correct core contract!");
        } else {
            console.log("❌ Claims contract points to a different core contract!");
        }
        
        // Check frontend constants
        console.log("\n📋 Frontend Constants:");
        console.log("   CELO_MAINNET Core:", "0x0C49604c65588858DC206AAC6EFEc0F8Afe2d1d6");
        console.log("   CELO_MAINNET Claims:", "0xfFA05a77182e2CECA2667Eeec5367F8F1683478C");
        
        // Summary
        console.log("\n📋 SUMMARY:");
        console.log("   Core Contract:", coreContractAddress);
        console.log("   Claims in Core:", actualClaimsAddress);
        console.log("   Expected Claims:", expectedClaimsAddress);
        console.log("   Core in Claims:", coreAddressFromClaims);
        
        if (actualClaimsAddress.toLowerCase() === expectedClaimsAddress.toLowerCase() && 
            coreAddressFromClaims.toLowerCase() === coreContractAddress.toLowerCase()) {
            console.log("\n✅ All addresses match correctly!");
            console.log("   The issue might be:");
            console.log("   1. Browser cache - try hard refresh (Ctrl+F5)");
            console.log("   2. Wrong network - make sure you're on Celo Mainnet");
            console.log("   3. Frontend calling wrong function");
        } else {
            console.log("\n❌ Address mismatch detected!");
            console.log("   This explains the 'only claims contract' error.");
        }
        
    } catch (error) {
        console.error("❌ Error checking addresses:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

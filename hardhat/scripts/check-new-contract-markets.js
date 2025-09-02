import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    console.log("🔍 Checking market count in NEW contracts...");
    
    // New contract addresses
    const newCoreContractAddress = "0x4B8aCfD15bABb444b490c8Cb18B2257aFaa976c9";
    const newClaimsContractAddress = "0xAE47B7dfA1f6840E2Ec2B0453d54893dB55C8325";
    
    // Old contract addresses for comparison
    const oldCoreContractAddress = "0x0C49604c65588858DC206AAC6EFEc0F8Afe2d1d6";
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Using account:", deployer.address);
    
    try {
        // Check NEW contract
        console.log("\n🆕 NEW CONTRACT:");
        const PredictionMarketCore = await ethers.getContractFactory("PredictionMarketCore");
        const newCoreContract = PredictionMarketCore.attach(newCoreContractAddress);
        
        const newMarketCount = await newCoreContract.getMarketCount();
        const newCreatorFeePercentage = await newCoreContract.creatorFeePercentage();
        
        console.log("   Address:", newCoreContractAddress);
        console.log("   Market Count:", newMarketCount.toString());
        console.log("   Creator Fee Percentage:", newCreatorFeePercentage.toString() + "%");
        
        // Check OLD contract for comparison
        console.log("\n🔄 OLD CONTRACT (for comparison):");
        const oldCoreContract = PredictionMarketCore.attach(oldCoreContractAddress);
        
        const oldMarketCount = await oldCoreContract.getMarketCount();
        console.log("   Address:", oldCoreContractAddress);
        console.log("   Market Count:", oldMarketCount.toString());
        
        console.log("\n📊 SUMMARY:");
        console.log("   Old contract has", oldMarketCount.toString(), "markets");
        console.log("   New contract has", newMarketCount.toString(), "markets");
        
        if (newMarketCount == 0) {
            console.log("\n✅ This is expected! The new contract is fresh with no markets.");
            console.log("   Users will need to create new markets in the new contract.");
            console.log("   The old markets and their data are not migrated.");
        }
        
    } catch (error) {
        console.error("❌ Error checking contracts:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

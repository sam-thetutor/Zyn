import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    console.log("🔍 Checking Contract State...");
    
    // Contract addresses
    const coreContractAddress = "0x0C49604c65588858DC206AAC6EFEc0F8Afe2d1d6";
    const newClaimsContractAddress = "0xfFA05a77182e2CECA2667Eeec5367F8F1683478C";
    
    try {
        // Get the core contract instance
        const coreContract = await ethers.getContractAt("PredictionMarketCore", coreContractAddress);
        
        // Check current claims contract address
        console.log("📋 Checking core contract's claims contract address...");
        const currentClaimsAddress = await coreContract.claimsContract();
        console.log("   Current claims contract in core:", currentClaimsAddress);
        console.log("   Expected new claims contract:", newClaimsContractAddress);
        
        // Check if they match
        if (currentClaimsAddress.toLowerCase() === newClaimsContractAddress.toLowerCase()) {
            console.log("✅ Core contract points to the correct claims contract");
        } else {
            console.log("❌ Core contract does NOT point to the new claims contract");
            console.log("   This is why you're getting the 'only claims contract' error!");
        }
        
        // Check the claims contract's core address
        console.log("\n📋 Checking claims contract's core address...");
        const claimsContract = await ethers.getContractAt("PredictionMarketClaims", newClaimsContractAddress);
        const coreAddressFromClaims = await claimsContract.coreContract();
        console.log("   Core address from claims contract:", coreAddressFromClaims);
        console.log("   Expected core address:", coreContractAddress);
        
        if (coreAddressFromClaims.toLowerCase() === coreContractAddress.toLowerCase()) {
            console.log("✅ Claims contract points to the correct core contract");
        } else {
            console.log("❌ Claims contract does NOT point to the correct core contract");
        }
        
        // Check who owns the core contract
        console.log("\n📋 Checking core contract owner...");
        const owner = await coreContract.owner();
        console.log("   Core contract owner:", owner);
        
        // Get deployer account
        const signers = await ethers.getSigners();
        const deployer = signers[0];
        console.log("   Current deployer account:", deployer.address);
        
        if (owner.toLowerCase() === deployer.address.toLowerCase()) {
            console.log("✅ You are the owner of the core contract");
        } else {
            console.log("❌ You are NOT the owner of the core contract");
            console.log("   You need to use the owner account to update the claims contract address");
        }
        
    } catch (error) {
        console.error("❌ Error checking contract state:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

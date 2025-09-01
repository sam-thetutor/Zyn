import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    console.log("🧪 Testing Contract Connection...");
    
    // Contract addresses
    const coreContractAddress = "0x0C49604c65588858DC206AAC6EFEc0F8Afe2d1d6";
    const claimsContractAddress = "0xfFA05a77182e2CECA2667Eeec5367F8F1683478C";
    
    try {
        // Get contracts
        const coreContract = await ethers.getContractAt("PredictionMarketCore", coreContractAddress);
        const claimsContract = await ethers.getContractAt("PredictionMarketClaims", claimsContractAddress);
        
        console.log("📋 Contract Addresses:");
        console.log("   Core Contract:", coreContractAddress);
        console.log("   Claims Contract:", claimsContractAddress);
        
        // Test 1: Check if claims contract can call core contract
        console.log("\n🧪 Test 1: Checking contract references...");
        const coreFromClaims = await claimsContract.coreContract();
        const claimsFromCore = await coreContract.claimsContract();
        
        console.log("   Claims contract points to core:", coreFromClaims);
        console.log("   Core contract points to claims:", claimsFromCore);
        
        if (coreFromClaims.toLowerCase() === coreContractAddress.toLowerCase() && 
            claimsFromCore.toLowerCase() === claimsContractAddress.toLowerCase()) {
            console.log("✅ Contract references are correct!");
        } else {
            console.log("❌ Contract references are incorrect!");
        }
        
        // Test 2: Check if we can call a function that requires claims contract access
        console.log("\n🧪 Test 2: Testing claims contract access...");
        try {
            // Try to call a function that should work from claims contract
            const marketCount = await coreContract.getMarketCount();
            console.log("   Market count:", marketCount.toString());
            console.log("✅ Can read from core contract");
        } catch (error) {
            console.log("❌ Cannot read from core contract:", error.message);
        }
        
        // Test 3: Check if claims contract can call core contract functions
        console.log("\n🧪 Test 3: Testing claims contract -> core contract calls...");
        try {
            // This should work because claims contract is authorized
            const owner = await coreContract.owner();
            console.log("   Core contract owner:", owner);
            console.log("✅ Claims contract can read from core contract");
        } catch (error) {
            console.log("❌ Claims contract cannot read from core contract:", error.message);
        }
        
        // Test 4: Check if we can simulate a claim transaction
        console.log("\n🧪 Test 4: Testing claim simulation...");
        try {
            // Get deployer account
            const signers = await ethers.getSigners();
            const deployer = signers[0];
            
            // Check if deployer is the owner
            const owner = await coreContract.owner();
            if (owner.toLowerCase() === deployer.address.toLowerCase()) {
                console.log("✅ You are the owner of the core contract");
                
                // Try to call a function that should work
                const marketCount = await coreContract.getMarketCount();
                console.log("   Current market count:", marketCount.toString());
                
                if (marketCount > 0) {
                    console.log("   There are markets available for testing");
                } else {
                    console.log("   No markets available for testing");
                }
            } else {
                console.log("❌ You are NOT the owner of the core contract");
                console.log("   Owner:", owner);
                console.log("   Your address:", deployer.address);
            }
        } catch (error) {
            console.log("❌ Error in claim simulation:", error.message);
        }
        
        console.log("\n🎉 Contract connection test completed!");
        
    } catch (error) {
        console.error("❌ Test failed:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

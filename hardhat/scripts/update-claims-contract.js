import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    console.log("🔄 Updating Core Contract to use new Claims Contract...");
    
    // Get deployer account
    const signers = await ethers.getSigners();
    const deployer = signers[0];
    console.log("📝 Updating with account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "CELO");
    
    // Contract addresses
    const coreContractAddress = "0x0C49604c65588858DC206AAC6EFEc0F8Afe2d1d6";
    const newClaimsContractAddress = "0xfFA05a77182e2CECA2667Eeec5367F8F1683478C";
    
    console.log("📋 Core Contract:", coreContractAddress);
    console.log("📋 New Claims Contract:", newClaimsContractAddress);
    
    try {
        // Get the core contract instance
        const coreContract = await ethers.getContractAt("PredictionMarketCore", coreContractAddress);
        
        // Check current claims contract address
        console.log("\n📋 Step 1: Checking current claims contract address...");
        const currentClaimsAddress = await coreContract.claimsContract();
        console.log("   Current claims contract:", currentClaimsAddress);
        
        if (currentClaimsAddress.toLowerCase() === newClaimsContractAddress.toLowerCase()) {
            console.log("✅ Core contract already points to the new claims contract!");
            return;
        }
        
        // Update the claims contract address
        console.log("\n📋 Step 2: Updating claims contract address...");
        const tx = await coreContract.setClaimsContract(newClaimsContractAddress);
        console.log("   Transaction hash:", tx.hash);
        
        console.log("   Waiting for transaction confirmation...");
        await tx.wait();
        console.log("✅ Claims contract address updated successfully!");
        
        // Verify the update
        console.log("\n📋 Step 3: Verifying the update...");
        const updatedClaimsAddress = await coreContract.claimsContract();
        
        if (updatedClaimsAddress.toLowerCase() === newClaimsContractAddress.toLowerCase()) {
            console.log("✅ Verification successful!");
            console.log("   New claims contract address:", updatedClaimsAddress);
        } else {
            console.error("❌ Verification failed!");
            console.log("   Expected:", newClaimsContractAddress);
            console.log("   Actual:", updatedClaimsAddress);
        }
        
        // Test the connection by calling a function on the claims contract
        console.log("\n📋 Step 4: Testing contract connection...");
        try {
            const claimsContract = await ethers.getContractAt("PredictionMarketClaims", newClaimsContractAddress);
            const coreAddressFromClaims = await claimsContract.coreContract();
            
            if (coreAddressFromClaims.toLowerCase() === coreContractAddress.toLowerCase()) {
                console.log("✅ Contract connection verified successfully!");
                console.log("   Claims contract points to core:", coreAddressFromClaims);
            } else {
                console.error("❌ Contract connection verification failed!");
                console.log("   Expected core address:", coreContractAddress);
                console.log("   Actual core address:", coreAddressFromClaims);
            }
        } catch (error) {
            console.error("❌ Failed to verify claims contract connection:", error.message);
        }
        
        console.log("\n🎉 CORE CONTRACT UPDATE completed successfully!");
        console.log("=" * 60);
        console.log("📋 Updated Contract Addresses:");
        console.log("   Core Contract:", coreContractAddress);
        console.log("   Claims Contract:", newClaimsContractAddress);
        console.log("   Deployer:", deployer.address);
        console.log("=" * 60);
        console.log("\n💡 The core contract now points to the new claims contract with the fixed winnings calculation!");
        
    } catch (error) {
        console.error("❌ Failed to update core contract:", error);
        
        if (error.message.includes("Only owner can call this")) {
            console.log("\n💡 This error means you're not the owner of the core contract.");
            console.log("   You need to use the owner account to update the claims contract address.");
        } else if (error.message.includes("insufficient funds")) {
            console.log("\n💡 This error means you don't have enough CELO to pay for the transaction.");
            console.log("   Please add more CELO to your account and try again.");
        }
        
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

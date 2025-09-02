import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    console.log("💰 Updating Market Creation Fee");
    console.log("=" .repeat(50));
    
    // Contract addresses from the latest deployment
    const coreContractAddress = "0x2D6614fe45da6Aa7e60077434129a51631AC702A";
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Using account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "CELO");
    
    // Connect to the core contract
    const PredictionMarketCore = await ethers.getContractFactory("PredictionMarketCore");
    const coreContract = PredictionMarketCore.attach(coreContractAddress);
    
    try {
        // Check current market creation fee
        const currentFee = await coreContract.getMarketCreationFee();
        console.log("📊 Current market creation fee:", ethers.formatEther(currentFee), "CELO");
        
        // Set new fee to 0.01 CELO
        const newFee = ethers.parseEther("0.01");
        console.log("🔄 Updating market creation fee to:", ethers.formatEther(newFee), "CELO");
        
        // Update the fee
        const tx = await coreContract.updateMarketCreationFee(newFee);
        console.log("⏳ Transaction submitted:", tx.hash);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
        
        // Verify the update
        const updatedFee = await coreContract.getMarketCreationFee();
        console.log("📊 Updated market creation fee:", ethers.formatEther(updatedFee), "CELO");
        
        // Check if the fee was updated correctly
        if (updatedFee.toString() === newFee.toString()) {
            console.log("🎉 Market creation fee updated successfully!");
        } else {
            console.log("❌ Fee update verification failed!");
        }
        
        console.log("\n📋 Summary:");
        console.log("   Old Fee:", ethers.formatEther(currentFee), "CELO");
        console.log("   New Fee:", ethers.formatEther(updatedFee), "CELO");
        console.log("   Contract:", coreContractAddress);
        console.log("   Admin:", deployer.address);
        
    } catch (error) {
        console.error("❌ Failed to update market creation fee:", error.message);
        
        if (error.message.includes("Only admin can call this")) {
            console.log("💡 Make sure you're using the admin account");
        } else if (error.message.includes("Market creation fee cannot exceed")) {
            console.log("💡 The fee is too high. Maximum allowed is 50 CELO");
        } else if (error.message.includes("Market creation fee cannot be negative")) {
            console.log("💡 The fee cannot be negative");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

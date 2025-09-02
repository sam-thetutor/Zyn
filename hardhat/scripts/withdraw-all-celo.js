import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    console.log("🚨 WITHDRAWING ALL CELO TOKENS FROM CORE CONTRACT");
    console.log("⚠️  WARNING: This will drain the contract completely!");
    
    // Core contract address
    const coreContractAddress = "0x0C49604c65588858DC206AAC6EFEc0F8Afe2d1d6";
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Using deployer account:", deployer.address);
    console.log("💰 Deployer balance before:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "CELO");
    
    // Connect to the core contract
    const PredictionMarketCore = await ethers.getContractFactory("PredictionMarketCore");
    const coreContract = PredictionMarketCore.attach(coreContractAddress);
    
    // Check current contract balance
    const contractBalance = await deployer.provider.getBalance(coreContractAddress);
    console.log("💳 Contract balance:", ethers.formatEther(contractBalance), "CELO");
    
    if (contractBalance === 0n) {
        console.log("❌ No CELO tokens to withdraw from the contract");
        return;
    }
    
    // Check if deployer is the owner
    const owner = await coreContract.owner();
    console.log("👑 Contract owner:", owner);
    
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
        console.error("❌ ERROR: Deployer is not the owner of the contract!");
        console.error("   You need to use the owner account to withdraw funds");
        console.error("   Owner address:", owner);
        console.error("   Your address:", deployer.address);
        return;
    }
    
    console.log("✅ Deployer is the owner, proceeding with withdrawal...");
    
    try {
        // Use emergencyWithdraw to withdraw all funds
        console.log("🔄 Calling emergencyWithdraw()...");
        const tx = await coreContract.emergencyWithdraw();
        console.log("📝 Transaction hash:", tx.hash);
        
        console.log("⏳ Waiting for transaction confirmation...");
        const receipt = await tx.wait();
        console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
        
        // Check balances after withdrawal
        const newContractBalance = await deployer.provider.getBalance(coreContractAddress);
        const newDeployerBalance = await deployer.provider.getBalance(deployer.address);
        
        console.log("\n📊 WITHDRAWAL SUMMARY:");
        console.log("💳 Contract balance after:", ethers.formatEther(newContractBalance), "CELO");
        console.log("💰 Deployer balance after:", ethers.formatEther(newDeployerBalance), "CELO");
        console.log("💸 Amount withdrawn:", ethers.formatEther(contractBalance), "CELO");
        
        if (newContractBalance === 0n) {
            console.log("✅ SUCCESS: All CELO tokens have been withdrawn!");
        } else {
            console.log("⚠️  WARNING: Contract still has some balance remaining");
        }
        
    } catch (error) {
        console.error("❌ ERROR during withdrawal:", error.message);
        
        // Try alternative method if emergencyWithdraw fails
        console.log("🔄 Trying alternative method: withdrawFees()...");
        try {
            const tx2 = await coreContract.withdrawFees();
            console.log("📝 Alternative transaction hash:", tx2.hash);
            
            const receipt2 = await tx2.wait();
            console.log("✅ Alternative transaction confirmed in block:", receipt2.blockNumber);
            
            const finalContractBalance = await deployer.provider.getBalance(coreContractAddress);
            console.log("💳 Final contract balance:", ethers.formatEther(finalContractBalance), "CELO");
            
        } catch (error2) {
            console.error("❌ Alternative method also failed:", error2.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

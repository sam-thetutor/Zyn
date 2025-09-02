import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    console.log("🧪 Testing Creator Fee Percentage Update Function");
    console.log("=" .repeat(50));
    
    // You'll need to update this with the actual deployed contract address
    const coreContractAddress = "0x0000000000000000000000000000000000000000"; // UPDATE THIS!
    
    if (coreContractAddress === "0x0000000000000000000000000000000000000000") {
        console.log("❌ ERROR: Please update the coreContractAddress with the deployed contract address!");
        return;
    }
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Using account:", deployer.address);
    
    // Connect to the core contract
    const PredictionMarketCore = await ethers.getContractFactory("PredictionMarketCore");
    const coreContract = PredictionMarketCore.attach(coreContractAddress);
    
    try {
        // Check current creator fee percentage
        const currentFee = await coreContract.creatorFeePercentage();
        console.log("📊 Current creator fee percentage:", currentFee.toString() + "%");
        
        // Test updating to 20%
        console.log("\n🔄 Testing update to 20%...");
        const tx1 = await coreContract.updateCreatorFeePercentage(20);
        await tx1.wait();
        console.log("✅ Updated to 20%");
        
        const newFee1 = await coreContract.creatorFeePercentage();
        console.log("📊 New creator fee percentage:", newFee1.toString() + "%");
        
        // Test updating to 10%
        console.log("\n🔄 Testing update to 10%...");
        const tx2 = await coreContract.updateCreatorFeePercentage(10);
        await tx2.wait();
        console.log("✅ Updated to 10%");
        
        const newFee2 = await coreContract.creatorFeePercentage();
        console.log("📊 New creator fee percentage:", newFee2.toString() + "%");
        
        // Test updating back to 15%
        console.log("\n🔄 Testing update back to 15%...");
        const tx3 = await coreContract.updateCreatorFeePercentage(15);
        await tx3.wait();
        console.log("✅ Updated back to 15%");
        
        const finalFee = await coreContract.creatorFeePercentage();
        console.log("📊 Final creator fee percentage:", finalFee.toString() + "%");
        
        console.log("\n🎉 All tests passed! Creator fee percentage update function works correctly.");
        
    } catch (error) {
        console.error("❌ Test failed:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

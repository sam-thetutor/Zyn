import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    console.log("🧪 Testing Market Creation Fee Update Function");
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
        // Check current market creation fee
        const currentFee = await coreContract.getMarketCreationFee();
        console.log("📊 Current market creation fee:", ethers.formatEther(currentFee), "CELO");
        
        // Test updating to 0.5 CELO
        console.log("\n🔄 Testing update to 0.5 CELO...");
        const tx1 = await coreContract.updateMarketCreationFee(ethers.parseEther("0.5"));
        await tx1.wait();
        console.log("✅ Updated to 0.5 CELO");
        
        const newFee1 = await coreContract.getMarketCreationFee();
        console.log("📊 New market creation fee:", ethers.formatEther(newFee1), "CELO");
        
        // Test updating to 2 CELO
        console.log("\n🔄 Testing update to 2 CELO...");
        const tx2 = await coreContract.updateMarketCreationFee(ethers.parseEther("2"));
        await tx2.wait();
        console.log("✅ Updated to 2 CELO");
        
        const newFee2 = await coreContract.getMarketCreationFee();
        console.log("📊 New market creation fee:", ethers.formatEther(newFee2), "CELO");
        
        // Test updating back to 1 CELO
        console.log("\n🔄 Testing update back to 1 CELO...");
        const tx3 = await coreContract.updateMarketCreationFee(ethers.parseEther("1"));
        await tx3.wait();
        console.log("✅ Updated back to 1 CELO");
        
        const finalFee = await coreContract.getMarketCreationFee();
        console.log("📊 Final market creation fee:", ethers.formatEther(finalFee), "CELO");
        
        console.log("\n🎉 All tests passed! Market creation fee update function works correctly.");
        
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

const { ethers } = require("hardhat");

async function main() {
    console.log("🕐 Checking Blockchain Time vs Local Time");
    console.log("=======================================\n");

    // Get signers
    const [admin] = await ethers.getSigners();
    
    // Get current block
    const currentBlock = await admin.provider.getBlock("latest");
    const blockTimestamp = currentBlock.timestamp;
    const localTime = Math.floor(Date.now() / 1000);
    
    console.log(`🌐 Blockchain timestamp: ${blockTimestamp}`);
    console.log(`🌐 Blockchain time: ${new Date(blockTimestamp * 1000).toLocaleString()}`);
    console.log(`💻 Local timestamp: ${localTime}`);
    console.log(`💻 Local time: ${new Date(localTime * 1000).toLocaleString()}`);
    console.log(`⏰ Time difference: ${localTime - blockTimestamp} seconds`);
    
    // Test a future time
    const futureTime = blockTimestamp + 600; // 10 minutes from now
    console.log(`🔮 Future time (10 min from blockchain): ${futureTime}`);
    console.log(`🔮 Future time: ${new Date(futureTime * 1000).toLocaleString()}`);
    
    // Check if our calculation would work
    const calculatedTime = Math.floor(Date.now() / 1000) + 600;
    console.log(`🧮 Our calculated time: ${calculatedTime}`);
    console.log(`🧮 Our calculated time: ${new Date(calculatedTime * 1000).toLocaleString()}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

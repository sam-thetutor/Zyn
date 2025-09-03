import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    console.log("🕐 CHECKING MARKET END TIMES");
    console.log("=" .repeat(50));
    
    // Contract address
    const contractAddress = "0x2D6614fe45da6Aa7e60077434129a51631AC702A";
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Using account:", deployer.address);
    
    // Connect to contract
    const PredictionMarketCore = await ethers.getContractFactory("PredictionMarketCore");
    const contract = PredictionMarketCore.attach(contractAddress);
    
    console.log("🔗 Connected to contract:", contractAddress);
    
    // Get current time
    const currentTime = Math.floor(Date.now() / 1000);
    const currentDate = new Date(currentTime * 1000);
    console.log("⏰ Current time:", currentDate.toISOString());
    console.log("⏰ Current timestamp:", currentTime);
    
    try {
        // Check the last few markets (24, 25, 26)
        for (let i = 24; i <= 26; i++) {
            try {
                const market = await contract.getMarket(i);
                const endTime = Number(market.endTime);
                const endDate = new Date(endTime * 1000);
                const timeRemaining = endTime - currentTime;
                const isEnded = timeRemaining <= 0;
                
                console.log(`\n📊 Market ${i}:`);
                console.log(`   Question: ${market.question.substring(0, 50)}...`);
                console.log(`   End time: ${endDate.toISOString()}`);
                console.log(`   End timestamp: ${endTime}`);
                console.log(`   Time remaining: ${timeRemaining} seconds (${Math.floor(timeRemaining / 3600)} hours)`);
                console.log(`   Is ended: ${isEnded}`);
                console.log(`   Status: ${market.status}`);
            } catch (error) {
                console.log(`   ❌ Error fetching market ${i}:`, error.message);
            }
        }
        
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

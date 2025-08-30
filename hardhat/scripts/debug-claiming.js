const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Debugging claiming functionality...");
    
    // Contract addresses from deployment
    const coreAddress = "0x88Ea452D3a0075C31Dd59713d2985D6808C202Fb";
    const claimsAddress = "0x9425d81019595082F14b9FC6544c1E030e2ACAff";
    
    // Get contract instances
    const coreContract = await ethers.getContractAt("PredictionMarketCore", coreAddress);
    const claimsContract = await ethers.getContractAt("PredictionMarketClaims", claimsAddress);
    
    const [deployer] = await ethers.getSigners();
    console.log("📝 Testing with account:", deployer.address);
    
    try {
        // Check market 1 status
        console.log("\n📋 Checking market 1 status...");
        const market = await coreContract.getMarket(1);
        console.log("📝 Market status:", market.status.toString());
        console.log("📝 Market outcome:", market.outcome);
        console.log("📝 Market total pool:", ethers.formatEther(market.totalPool), "CELO");
        console.log("📝 Market total YES shares:", ethers.formatEther(market.totalYes), "CELO");
        console.log("📝 Market total NO shares:", ethers.formatEther(market.totalNo), "CELO");
        
        // Check user participation
        console.log("\n📋 Checking user participation...");
        const participation = await coreContract.getUserParticipation(1, deployer.address);
        console.log("📝 User participated:", participation[0]);
        console.log("📝 User side:", participation[1]);
        console.log("📝 User YES shares:", ethers.formatEther(participation[2]), "CELO");
        console.log("📝 User NO shares:", ethers.formatEther(participation[3]), "CELO");
        
        // Check if user is winner
        console.log("\n📋 Checking if user is winner...");
        const isWinner = await claimsContract.isWinner(1, deployer.address);
        console.log("📝 Is user winner:", isWinner);
        
        // Calculate user winnings
        console.log("\n📋 Calculating user winnings...");
        const userWinnings = await claimsContract.calculateUserWinnings(1, deployer.address);
        console.log("📝 User winnings:", ethers.formatEther(userWinnings), "CELO");
        
        // Check contract fees
        console.log("\n📋 Checking contract fees...");
        const contractFees = await claimsContract.getContractFees();
        console.log("📝 Contract fees:", ethers.formatEther(contractFees), "CELO");
        
        // Check claims contract balance
        console.log("\n📋 Checking claims contract balance...");
        const claimsContractBalance = await ethers.provider.getBalance(claimsAddress);
        console.log("📝 Claims contract balance:", ethers.formatEther(claimsContractBalance), "CELO");
        
        // Check if user has already claimed
        console.log("\n📋 Checking if user has already claimed...");
        const hasClaimed = await claimsContract.hasUserClaimed(1, deployer.address);
        console.log("📝 Has user claimed:", hasClaimed);
        
        // Try to claim winnings
        console.log("\n📋 Attempting to claim winnings...");
        const initialBalance = await ethers.provider.getBalance(deployer.address);
        console.log("📝 Initial balance:", ethers.formatEther(initialBalance), "CELO");
        
        const claimTx = await claimsContract.claimWinnings(1);
        await claimTx.wait();
        console.log("✅ Winnings claimed successfully!");
        
        const finalBalance = await ethers.provider.getBalance(deployer.address);
        console.log("📝 Final balance:", ethers.formatEther(finalBalance), "CELO");
        const actualWinnings = finalBalance - initialBalance;
        console.log("📝 Actual winnings:", ethers.formatEther(actualWinnings), "CELO");
        
    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error("❌ Full error:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

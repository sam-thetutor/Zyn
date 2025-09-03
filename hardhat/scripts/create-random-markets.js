import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
    console.log("🎲 CREATING THREE NEW RANDOM MARKETS");
    console.log("=" .repeat(50));
    
    // Contract address - using the new contract
    const contractAddress = "0x2D6614fe45da6Aa7e60077434129a51631AC702A";
    
    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("📝 Using account:", deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "CELO");
    
    // Connect to contract
    const PredictionMarketCore = await ethers.getContractFactory("PredictionMarketCore");
    const contract = PredictionMarketCore.attach(contractAddress);
    
    console.log("🔗 Connected to contract:", contractAddress);
    
    // Random market data
    const randomMarkets = [
        {
            question: "Will Bitcoin reach $100,000 by the end of 2024?",
            description: "A prediction on Bitcoin's price performance in the final months of 2024. This market tracks whether BTC will hit the psychological milestone of $100,000.",
            category: "Cryptocurrency",
            image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=300&fit=crop",
            source: "Crypto Market Analysis"
        },
        {
            question: "Will the 2024 US Presidential Election be decided by less than 1 million votes?",
            description: "This market predicts whether the margin of victory in the 2024 US Presidential Election will be under 1 million votes, indicating a very close race.",
            category: "Politics",
            image: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a78e?w=400&h=300&fit=crop",
            source: "Election Polling Data"
        },
        {
            question: "Will the Los Angeles Lakers make the NBA Playoffs in 2025?",
            description: "A sports prediction on whether the Lakers will qualify for the 2025 NBA Playoffs. This market tracks the team's performance throughout the regular season.",
            category: "Sports",
            image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=300&fit=crop",
            source: "NBA Season Analysis"
        }
    ];
    
    try {
        let createdCount = 0;
        let failedCount = 0;
        
        // Create each market
        for (let i = 0; i < randomMarkets.length; i++) {
            const market = randomMarkets[i];
            
            try {
                console.log(`\n🎲 Creating market ${i + 1}/${randomMarkets.length}...`);
                console.log(`   📝 Question: ${market.question}`);
                
                // Set random end time between 2 hours to 7 days from now
                const minHours = 2;
                const maxHours = 7 * 24; // 7 days
                const randomHours = Math.floor(Math.random() * (maxHours - minHours + 1)) + minHours;
                const newEndTime = Math.floor(Date.now() / 1000) + (randomHours * 60 * 60);
                const endTimeDate = new Date(newEndTime * 1000);
                
                console.log(`   📅 End time: ${endTimeDate.toLocaleString()} (${randomHours} hours from now)`);
                console.log(`   🏷️  Category: ${market.category}`);
                
                // Create market
                const tx = await contract.createMarket(
                    market.question,
                    market.description,
                    market.category,
                    market.image,
                    market.source,
                    newEndTime,
                    { value: ethers.parseEther("0.01") } // Market creation fee
                );
                
                console.log(`   📝 Transaction hash: ${tx.hash}`);
                const receipt = await tx.wait();
                console.log(`   ✅ Transaction confirmed in block: ${receipt.blockNumber}`);
                
                // Get the market ID from the event
                const marketCreatedEvent = receipt.logs.find(log => {
                    try {
                        const parsed = contract.interface.parseLog(log);
                        return parsed.name === 'MarketCreated';
                    } catch {
                        return false;
                    }
                });
                
                if (marketCreatedEvent) {
                    const parsed = contract.interface.parseLog(marketCreatedEvent);
                    const marketId = parsed.args.marketId.toString();
                    console.log(`   🆔 Market ID: ${marketId}`);
                }
                
                console.log(`   ✅ Successfully created: ${market.question.substring(0, 50)}...`);
                createdCount++;
                
                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 3000));
                
            } catch (error) {
                console.log(`   ❌ Failed to create market ${i + 1}:`, error.message);
                failedCount++;
            }
        }
        
        console.log("\n📊 CREATION SUMMARY:");
        console.log(`   ✅ Successfully created: ${createdCount} markets`);
        console.log(`   ❌ Failed to create: ${failedCount} markets`);
        console.log(`   📊 Total processed: ${createdCount + failedCount} markets`);
        
        if (createdCount > 0) {
            console.log("\n🎉 Random markets created successfully!");
            console.log("   Users can now participate in these new markets");
            console.log("   Each market has a random end time between 2 hours and 7 days");
            console.log(`   🔗 Contract Address: ${contractAddress}`);
        }
        
    } catch (error) {
        console.error("❌ Market creation failed:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });

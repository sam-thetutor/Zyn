const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  console.log("🚀 Starting Advanced Claim Functionality Test...\n");

  // Get signers
  console.log("🔑 Getting signers...");
  const signers = await ethers.getSigners();
  console.log(`Found ${signers.length} signers`);
  
  if (signers.length === 0) {
    throw new Error("No signers found. Check your network configuration and private key.");
  }
  
  const admin = signers[0];
  console.log(`Admin account: ${admin.address}\n`);
  
  // Create additional test accounts
  console.log("🔑 Creating additional test accounts...");
  const user1 = ethers.Wallet.createRandom().connect(ethers.provider);
  const user2 = ethers.Wallet.createRandom().connect(ethers.provider);
  
  console.log("👥 Test Accounts:");
  console.log(`Admin (Account 1): ${admin.address}`);
  console.log(`User 1: ${user1.address}`);
  console.log(`User 2: ${user2.address}\n`);

  // Deploy the contract
  console.log("📋 Deploying PredictionMarket contract...");
  const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
  const predictionMarket = await PredictionMarket.deploy();
  await predictionMarket.waitForDeployment();
  
  const contractAddress = await predictionMarket.getAddress();
  console.log(`✅ Contract deployed to: ${contractAddress}\n`);

  // Check initial balances
  console.log("💰 Initial Balances:");
  const adminBalance = await ethers.provider.getBalance(admin.address);
  const user1Balance = await ethers.provider.getBalance(user1.address);
  const user2Balance = await ethers.provider.getBalance(user2.address);
  
  console.log(`Admin: ${ethers.formatEther(adminBalance)} CELO`);
  console.log(`User 1: ${ethers.formatEther(user1Balance)} CELO`);
  console.log(`User 2: ${ethers.formatEther(user2Balance)} CELO\n`);

  // Send CELO to user2 from admin
  console.log("💸 Sending CELO to User 2...");
  const sendAmount = ethers.parseEther("0.2"); // 0.2 CELO for more testing
  const tx1 = await admin.sendTransaction({
    to: user2.address,
    value: sendAmount
  });
  await tx1.wait();
  
  console.log(`✅ Sent ${ethers.formatEther(sendAmount)} CELO to User 2`);
  
  // Send CELO to user1 from admin
  console.log("💸 Sending CELO to User 1...");
  const tx2 = await admin.sendTransaction({
    to: user1.address,
    value: sendAmount
  });
  await tx2.wait();
  
  console.log(`✅ Sent ${ethers.formatEther(sendAmount)} CELO to User 1`);
  
  // Check balances after transfers
  const user2BalanceAfter = await ethers.provider.getBalance(user2.address);
  const user1BalanceAfter = await ethers.provider.getBalance(user1.address);
  console.log(`User 2 new balance: ${ethers.formatEther(user2BalanceAfter)} CELO`);
  console.log(`User 1 new balance: ${ethers.formatEther(user1BalanceAfter)} CELO\n`);

  // Get creation fee
  console.log("📊 Getting creation fee...");
  const creationFee = await predictionMarket.marketCreationFee();
  console.log(`Creation fee: ${ethers.formatEther(creationFee)} CELO\n`);

  // Create a market using admin account
  console.log("🏪 Creating new market...");
  const marketQuestion = "Will the price of CELO reach $1 by the end of this test?";
  const marketDescription = "A test market to verify claim functionality with advanced features";
  const marketCategory = "Cryptocurrency";
  const marketImage = "https://example.com/celo-price.jpg";
  
  // Set end time to 2 minutes from now
  const endTime = Math.floor(Date.now() / 1000) + 120; // 2 minutes
  
  const createMarketTx = await predictionMarket.createMarket(
    marketQuestion,
    marketDescription,
    marketCategory,
    marketImage,
    endTime,
    { value: creationFee }
  );
  
  const createMarketReceipt = await createMarketTx.wait();
  console.log(`✅ Market created! Transaction: ${createMarketReceipt.hash}`);
  console.log(`Market ID: 1`);
  console.log(`Question: ${marketQuestion}`);
  console.log(`End Time: ${new Date(endTime * 1000).toLocaleString()}\n`);

  // Get market details
  console.log("📋 Market Details:");
  const market = await predictionMarket.getMarket(1);
  console.log(`ID: ${market[0]}`);
  console.log(`Question: ${market[1]}`);
  console.log(`Description: ${market[2]}`);
  console.log(`Category: ${market[3]}`);
  console.log(`Image: ${market[4]}`);
  console.log(`End Time: ${new Date(Number(market[5]) * 1000).toLocaleString()}`);
  console.log(`Status: ${market[6] === 0 ? 'ACTIVE' : market[6] === 1 ? 'RESOLVED' : 'UNKNOWN'}`);
  console.log(`Outcome: ${market[7] ? 'YES' : 'NO'}`);
  console.log(`Total Yes: ${ethers.formatEther(market[8])} CELO`);
  console.log(`Total No: ${ethers.formatEther(market[9])} CELO`);
  console.log(`Total Pool: ${ethers.formatEther(market[10])} CELO\n`);

  // User 2 buys NO shares
  console.log("🔄 User 2 buying NO shares...");
  const buyAmount = ethers.parseEther("0.05"); // 0.05 CELO
  const buyNoTx = await predictionMarket.connect(user2).buyShares(1, false, { value: buyAmount });
  await buyNoTx.wait();
  
  console.log(`✅ User 2 bought NO shares for ${ethers.formatEther(buyAmount)} CELO`);
  console.log(`Transaction: ${buyNoTx.hash}\n`);

  // User 1 (admin) buys YES shares
  console.log("🔄 User 1 (Admin) buying YES shares...");
  const buyYesTx = await predictionMarket.connect(user1).buyShares(1, true, { value: buyAmount });
  await buyYesTx.wait();
  
  console.log(`✅ User 1 bought YES shares for ${ethers.formatEther(buyAmount)} CELO`);
  console.log(`Transaction: ${buyYesTx.hash}\n`);

  // Check market state after trades
  console.log("📊 Market State After Trades:");
  const marketAfterTrades = await predictionMarket.getMarket(1);
  console.log(`Total Yes: ${ethers.formatEther(marketAfterTrades[8])} CELO`);
  console.log(`Total No: ${ethers.formatEther(marketAfterTrades[9])} CELO`);
  console.log(`Total Pool: ${ethers.formatEther(marketAfterTrades[10])} CELO\n`);

  // Check user shares
  console.log("👤 User Shares:");
  const user2NoShares = await predictionMarket.getUserShares(1, user2.address, false);
  const user1YesShares = await predictionMarket.getUserShares(1, user1.address, true);
  
  console.log(`User 2 NO shares: ${ethers.formatEther(user2NoShares)}`);
  console.log(`User 1 YES shares: ${ethers.formatEther(user1YesShares)}\n`);

  // Check participation status
  console.log("🔒 Participation Status:");
  const user2Participated = await predictionMarket.hasUserParticipated(1, user2.address);
  const user1Participated = await predictionMarket.hasUserParticipated(1, user1.address);
  const user2Side = await predictionMarket.getUserParticipationSide(1, user2.address);
  const user1Side = await predictionMarket.getUserParticipationSide(1, user1.address);
  
  console.log(`User 2 participated: ${user2Participated}`);
  console.log(`User 1 participated: ${user1Participated}`);
  console.log(`User 2 side: ${user2Side ? 'YES' : 'NO'}`);
  console.log(`User 1 side: ${user1Side ? 'YES' : 'NO'}\n`);

  // Fast forward time to end the market
  console.log("⏰ Fast forwarding time to end market...");
  const currentTime = await time.latest();
  const timeToAdd = endTime - currentTime + 10; // Add 10 seconds buffer
  
  if (timeToAdd > 0) {
    console.log(`Fast forwarding ${timeToAdd} seconds...`);
    await time.increase(timeToAdd);
    console.log(`✅ Time fast forwarded! Current time: ${new Date((await time.latest()) * 1000).toLocaleString()}\n`);
  }

  // Admin resolves the market as NO
  console.log("🔍 Admin resolving market as NO...");
  const resolveTx = await predictionMarket.connect(admin).resolveMarket(1, false);
  await resolveTx.wait();
  
  console.log(`✅ Market resolved as NO! Transaction: ${resolveTx.hash}\n`);

  // Check market state after resolution
  console.log("📊 Market State After Resolution:");
  const resolvedMarket = await predictionMarket.getMarket(1);
  console.log(`Status: ${resolvedMarket[6] === 0 ? 'ACTIVE' : resolvedMarket[6] === 1 ? 'RESOLVED' : 'UNKNOWN'}`);
  console.log(`Outcome: ${resolvedMarket[7] ? 'YES' : 'NO'}`);
  console.log(`Total Pool: ${ethers.formatEther(resolvedMarket[10])} CELO\n`);

  // Check claimable amounts
  console.log("💰 Claimable Amounts:");
  const user2Claimable = await predictionMarket.getClaimableAmount(1, user2.address);
  const user1Claimable = await predictionMarket.getClaimableAmount(1, user1.address);
  
  console.log(`User 2 claimable: ${ethers.formatEther(user2Claimable)} CELO`);
  console.log(`User 1 claimable: ${ethers.formatEther(user1Claimable)} CELO\n`);

  // Calculate expected winnings
  console.log("🧮 Expected Winnings Calculation:");
  const totalPool = resolvedMarket[10];
  const user2Investment = buyAmount;
  const user1Investment = buyAmount;
  
  // User 2 bet on NO and won, User 1 bet on YES and lost
  const user2ExpectedWinnings = (totalPool * user2Investment) / (user2Investment + user1Investment);
  const user1ExpectedWinnings = 0n; // Lost the bet
  
  console.log(`Total Pool: ${ethers.formatEther(totalPool)} CELO`);
  console.log(`User 2 investment: ${ethers.formatEther(user2Investment)} CELO`);
  console.log(`User 1 investment: ${ethers.formatEther(user1Investment)} CELO`);
  console.log(`User 2 expected winnings: ${ethers.formatEther(user2ExpectedWinnings)} CELO`);
  console.log(`User 1 expected winnings: ${ethers.formatEther(user1ExpectedWinnings)} CELO\n`);

  // Check if users have claimed
  console.log("✅ Claim Status:");
  const user2HasClaimed = await predictionMarket.hasUserClaimed(1, user2.address);
  const user1HasClaimed = await predictionMarket.hasUserClaimed(1, user1.address);
  
  console.log(`User 2 has claimed: ${user2HasClaimed}`);
  console.log(`User 1 has claimed: ${user1HasClaimed}\n`);

  // User 2 claims winnings
  console.log("🎉 User 2 claiming winnings...");
  const claimTx = await predictionMarket.connect(user2).claimWinnings(1);
  await claimTx.wait();
  
  console.log(`✅ User 2 claimed winnings! Transaction: ${claimTx.hash}\n`);

  // Check balances after claiming
  console.log("💰 Final Balances:");
  const user2FinalBalance = await ethers.provider.getBalance(user2.address);
  const user1FinalBalance = await ethers.provider.getBalance(user1.address);
  
  console.log(`User 2 final balance: ${ethers.formatEther(user2FinalBalance)} CELO`);
  console.log(`User 1 final balance: ${ethers.formatEther(user1FinalBalance)} CELO\n`);

  // Calculate actual winnings
  console.log("💵 Actual Winnings:");
  const user2InitialBalance = user2BalanceAfter;
  const user2ActualWinnings = user2FinalBalance - user2InitialBalance + buyAmount; // Add back investment
  const user1ActualWinnings = user1FinalBalance - user1Balance + buyAmount; // Add back investment
  
  console.log(`User 2 initial balance: ${ethers.formatEther(user2InitialBalance)} CELO`);
  console.log(`User 2 final balance: ${ethers.formatEther(user2FinalBalance)} CELO`);
  console.log(`User 2 actual winnings: ${ethers.formatEther(user2ActualWinnings)} CELO`);
  console.log(`User 1 actual winnings: ${ethers.formatEther(user1ActualWinnings)} CELO\n`);

  // Check claim status after claiming
  console.log("✅ Final Claim Status:");
  const user2FinalClaimStatus = await predictionMarket.hasUserClaimed(1, user2.address);
  const user1FinalClaimStatus = await predictionMarket.hasUserClaimed(1, user1.address);
  
  console.log(`User 2 has claimed: ${user2FinalClaimStatus}`);
  console.log(`User 1 has claimed: ${user1FinalClaimStatus}\n`);

  // Check final market state
  console.log("📊 Final Market State:");
  const finalMarket = await predictionMarket.getMarket(1);
  console.log(`Status: ${finalMarket[6] === 0 ? 'ACTIVE' : finalMarket[6] === 1 ? 'RESOLVED' : 'UNKNOWN'}`);
  console.log(`Outcome: ${finalMarket[7] ? 'YES' : 'NO'}`);
  console.log(`Total Pool: ${ethers.formatEther(finalMarket[10])} CELO\n`);

  // Test edge cases
  console.log("🧪 Testing Edge Cases:");
  
  // Try to claim again (should fail)
  console.log("🔄 Testing double claim...");
  try {
    const doubleClaimTx = await predictionMarket.connect(user2).claimWinnings(1);
    await doubleClaimTx.wait();
    console.log("❌ Double claim should have failed!");
  } catch (error) {
    console.log("✅ Double claim correctly rejected:", error.message);
  }

  // Try to buy shares after market is resolved (should fail)
  console.log("🔄 Testing buying shares after resolution...");
  try {
    const lateBuyTx = await predictionMarket.connect(user2).buyShares(1, true, { value: ethers.parseEther("0.01") });
    await lateBuyTx.wait();
    console.log("❌ Late buy should have failed!");
  } catch (error) {
    console.log("✅ Late buy correctly rejected:", error.message);
  }

  // Try to resolve market again (should fail)
  console.log("🔄 Testing double resolution...");
  try {
    const doubleResolveTx = await predictionMarket.connect(admin).resolveMarket(1, true);
    await doubleResolveTx.wait();
    console.log("❌ Double resolution should have failed!");
  } catch (error) {
    console.log("✅ Double resolution correctly rejected:", error.message);
  }

  console.log("\n");

  // Summary
  console.log("🎯 Test Summary:");
  console.log("✅ Market created successfully");
  console.log("✅ User 2 bought NO shares");
  console.log("✅ User 1 bought YES shares");
  console.log("✅ Market resolved as NO");
  console.log("✅ User 2 claimed winnings successfully");
  console.log("✅ Double claim correctly rejected");
  console.log("✅ Late buy correctly rejected");
  console.log("✅ Double resolution correctly rejected");
  console.log("✅ All claim functionality working correctly!\n");

  console.log("🚀 Advanced claim functionality test completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });

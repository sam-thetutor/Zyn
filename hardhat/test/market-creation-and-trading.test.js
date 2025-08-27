const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Market Creation and Trading with Private Key Account", function () {
  let predictionMarket;
  let owner;
  let privateKeyAccount;
  let currentTime;
  let futureTime;

  before(async function () {
    // Check if private key is configured
    if (!process.env.PRIVATE_KEY) {
      throw new Error("PRIVATE_KEY not found in environment variables");
    }
    
    // Create wallet from private key
    privateKeyAccount = new ethers.Wallet(process.env.PRIVATE_KEY, ethers.provider);
    
    // Get signers
    [owner] = await ethers.getSigners();
    
    // Deploy contract
    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    predictionMarket = await PredictionMarket.deploy();
    await predictionMarket.waitForDeployment();
    
    // Set consistent timestamps for testing
    const blockNum = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNum);
    currentTime = block.timestamp;
    futureTime = currentTime + 86400; // 24 hours from current block time
  });

  describe("Account Setup and Balance Check", function () {
    it("Should have the private key account configured", async function () {
      expect(privateKeyAccount.address).to.be.a("string");
      expect(privateKeyAccount.address).to.have.length(42);
      console.log("Private key account address:", privateKeyAccount.address);
    });

    it("Should check the balance of the private key account", async function () {
      const balance = await ethers.provider.getBalance(privateKeyAccount.address);
      const balanceInEth = ethers.formatEther(balance);
      
      console.log("Account balance:", balanceInEth, "ETH");
      console.log("Account balance in Wei:", balance.toString());
      
      // Ensure account has some balance for testing
      expect(balance).to.be.gt(0);
    });
  });

  describe("Market Creation with Private Key Account", function () {
    const question = "Will the price of ETH reach $5000 by the end of 2024?";
    const description = "A prediction market for Ethereum price movement";
    let marketId;
    let creationFee;

    it("Should create a market using the private key account", async function () {
      creationFee = await predictionMarket.marketCreationFee();
      console.log("Market creation fee:", ethers.formatEther(creationFee), "ETH");
      
      // Check balance before market creation
      const balanceBefore = await ethers.provider.getBalance(privateKeyAccount.address);
      console.log("Balance before market creation:", ethers.formatEther(balanceBefore), "ETH");
      
      // Create market
      const tx = await predictionMarket.connect(privateKeyAccount).createMarket(
        question,
        description,
        futureTime,
        { value: creationFee }
      );
      
      const receipt = await tx.wait();
      console.log("Market creation transaction hash:", tx.hash);
      console.log("Gas used:", receipt.gasUsed.toString());
      
      // Get market ID from event
      const event = receipt.logs.find(log => {
        try {
          const parsed = predictionMarket.interface.parseLog(log);
          return parsed.name === "MarketCreated";
        } catch {
          return false;
        }
      });
      
      if (event) {
        const parsed = predictionMarket.interface.parseLog(event);
        marketId = parsed.args[0];
        console.log("Market created with ID:", marketId.toString());
      }
      
      expect(marketId).to.be.gt(0);
      expect(await predictionMarket.getTotalMarkets()).to.equal(1);
      
      // Verify market details
      const market = await predictionMarket.getMarket(marketId);
      expect(market.question).to.equal(question);
      expect(market.description).to.equal(description);
      expect(market.endTime).to.equal(futureTime);
      expect(market.resolved).to.equal(false);
      
      // Check balance after market creation
      const balanceAfter = await ethers.provider.getBalance(privateKeyAccount.address);
      console.log("Balance after market creation:", ethers.formatEther(balanceAfter), "ETH");
      
      // Balance should be reduced by creation fee + gas
      expect(balanceAfter).to.be.lt(balanceBefore);
    });
  });

  describe("Buying Shares with Private Key Account", function () {
    let marketId = 1; // From previous test
    let balanceBeforeShares;

    it("Should buy Yes shares using the private key account", async function () {
      const shareAmount = ethers.parseEther("0.00003"); // 0.00003 ETH
      
      // Check balance before buying shares
      balanceBeforeShares = await ethers.provider.getBalance(privateKeyAccount.address);
      console.log("Balance before buying shares:", ethers.formatEther(balanceBeforeShares), "ETH");
      console.log("Buying Yes shares for amount:", ethers.formatEther(shareAmount), "ETH");
      
      // Buy Yes shares
      const tx = await predictionMarket.connect(privateKeyAccount).buyShares(
        marketId,
        true, // Yes shares
        { value: shareAmount }
      );
      
      const receipt = await tx.wait();
      console.log("Buy shares transaction hash:", tx.hash);
      console.log("Gas used:", receipt.gasUsed.toString());
      
      // Verify shares were bought
      const shares = await predictionMarket.getUserShares(marketId, privateKeyAccount.address, true);
      expect(shares).to.equal(shareAmount);
      console.log("Yes shares owned:", ethers.formatEther(shares), "ETH");
      
      // Check balance after buying shares
      const balanceAfterShares = await ethers.provider.getBalance(privateKeyAccount.address);
      console.log("Balance after buying shares:", ethers.formatEther(balanceAfterShares), "ETH");
      
      // Balance should be reduced by share amount + gas
      expect(balanceAfterShares).to.be.lt(balanceBeforeShares);
    });

    it("Should buy No shares using the private key account", async function () {
      const shareAmount = ethers.parseEther("0.00003"); // 0.00003 ETH
      
      // Check balance before buying No shares
      const balanceBeforeNoShares = await ethers.provider.getBalance(privateKeyAccount.address);
      console.log("Balance before buying No shares:", ethers.formatEther(balanceBeforeNoShares), "ETH");
      console.log("Buying No shares for amount:", ethers.formatEther(shareAmount), "ETH");
      
      // Buy No shares
      const tx = await predictionMarket.connect(privateKeyAccount).buyShares(
        marketId,
        false, // No shares
        { value: shareAmount }
      );
      
      const receipt = await tx.wait();
      console.log("Buy No shares transaction hash:", tx.hash);
      console.log("Gas used:", receipt.gasUsed.toString());
      
      // Verify No shares were bought
      const noShares = await predictionMarket.getUserShares(marketId, privateKeyAccount.address, false);
      expect(noShares).to.equal(shareAmount);
      console.log("No shares owned:", ethers.formatEther(noShares), "ETH");
      
      // Check balance after buying No shares
      const balanceAfterNoShares = await ethers.provider.getBalance(privateKeyAccount.address);
      console.log("Balance after buying No shares:", ethers.formatEther(balanceAfterNoShares), "ETH");
      
      // Balance should be reduced by share amount + gas
      expect(balanceAfterNoShares).to.be.lt(balanceBeforeNoShares);
    });

    it("Should verify total shares in the market", async function () {
      const market = await predictionMarket.getMarket(marketId);
      console.log("Market total Yes shares:", ethers.formatEther(market.totalYes), "ETH");
      console.log("Market total No shares:", ethers.formatEther(market.totalNo), "ETH");
      
      // Should have both Yes and No shares from our purchases
      expect(market.totalYes).to.be.gt(0);
      expect(market.totalNo).to.be.gt(0);
    });
  });

  describe("Final Balance Check", function () {
    it("Should show final account balance", async function () {
      const finalBalance = await ethers.provider.getBalance(privateKeyAccount.address);
      console.log("Final account balance:", ethers.formatEther(finalBalance), "ETH");
      
      // Account should still have some balance
      expect(finalBalance).to.be.gt(0);
    });
  });
});

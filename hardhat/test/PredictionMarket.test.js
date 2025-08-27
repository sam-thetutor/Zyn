const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PredictionMarket", function () {
  let predictionMarket;
  let owner;
  let user1;
  let user2;
  let user3;
  let currentTime;
  let futureTime;

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, user3] = await ethers.getSigners();
    
    // Deploy contract
    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    predictionMarket = await PredictionMarket.deploy();
    await predictionMarket.waitForDeployment();
    
    // Set consistent timestamps for testing using Hardhat's time manipulation
    const blockNum = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNum);
    currentTime = block.timestamp;
    futureTime = currentTime + 86400; // 24 hours from current block time
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await predictionMarket.owner()).to.equal(owner.address);
    });

    it("Should set correct initial fees", async function () {
      expect(await predictionMarket.marketCreationFee()).to.equal(ethers.parseEther("0.001"));
      expect(await predictionMarket.tradingFee()).to.equal(ethers.parseEther("0.005"));
    });

    it("Should start with 0 markets", async function () {
      expect(await predictionMarket.getTotalMarkets()).to.equal(0);
    });
  });

  describe("Market Creation", function () {
    const question = "Will Bitcoin reach $100k by end of 2024?";
    const description = "A simple prediction market for Bitcoin price";

    it("Should create a market with correct parameters", async function () {
      const creationFee = await predictionMarket.marketCreationFee();
      
      await expect(predictionMarket.connect(user1).createMarket(
        question,
        description,
        futureTime,
        { value: creationFee }
      )).to.emit(predictionMarket, "MarketCreated")
        .withArgs(1, question, futureTime);

      expect(await predictionMarket.getTotalMarkets()).to.equal(1);
      
      const market = await predictionMarket.getMarket(1);
      expect(market.question).to.equal(question);
      expect(market.description).to.equal(description);
      expect(market.endTime).to.equal(futureTime);
      expect(market.resolved).to.equal(false);
    });

    it("Should fail to create market without sufficient fee", async function () {
      const insufficientFee = ethers.parseEther("0.0005");
      
      await expect(predictionMarket.connect(user1).createMarket(
        question,
        description,
        futureTime,
        { value: insufficientFee }
      )).to.be.revertedWith("Insufficient creation fee");
    });

    it("Should fail to create market with past end time", async function () {
      const pastTime = currentTime - 3600; // 1 hour ago
      const creationFee = await predictionMarket.marketCreationFee();
      
      await expect(predictionMarket.connect(user1).createMarket(
        question,
        description,
        pastTime,
        { value: creationFee }
      )).to.be.revertedWith("End time must be in the future");
    });
  });

  describe("Trading", function () {
    let marketId;
    const question = "Will Ethereum 2.0 launch in 2024?";
    const description = "Ethereum 2.0 launch prediction";

    beforeEach(async function () {
      const creationFee = await predictionMarket.marketCreationFee();
      await predictionMarket.connect(user1).createMarket(
        question,
        description,
        futureTime,
        { value: creationFee }
      );
      marketId = 1;
    });

    it("Should allow buying Yes shares", async function () {
      const amount = ethers.parseEther("0.1");
      
      await expect(predictionMarket.connect(user2).buyShares(
        marketId,
        true,
        { value: amount }
      )).to.emit(predictionMarket, "SharesBought")
        .withArgs(marketId, user2.address, true, amount);

      const shares = await predictionMarket.getUserShares(marketId, user2.address, true);
      expect(shares).to.equal(amount);
    });

    it("Should allow buying No shares", async function () {
      const amount = ethers.parseEther("0.05");
      
      await expect(predictionMarket.connect(user3).buyShares(
        marketId,
        false,
        { value: amount }
      )).to.emit(predictionMarket, "SharesBought")
        .withArgs(marketId, user3.address, false, amount);

      const shares = await predictionMarket.getUserShares(marketId, user3.address, false);
      expect(shares).to.equal(amount);
    });

    it("Should fail to buy shares in non-existent market", async function () {
      const amount = ethers.parseEther("0.1");
      
      await expect(predictionMarket.connect(user2).buyShares(
        999,
        true,
        { value: amount }
      )).to.be.revertedWith("Market does not exist");
    });
  });

  describe("Market Resolution", function () {
    let marketId;
    const question = "Will Solana have 100% uptime in 2024?";
    const description = "Solana uptime prediction";

    beforeEach(async function () {
      const creationFee = await predictionMarket.marketCreationFee();
      await predictionMarket.connect(user1).createMarket(
        question,
        description,
        futureTime,
        { value: creationFee }
      );
      marketId = 1;
    });

    it("Should allow owner to resolve market", async function () {
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine");
      
      await expect(predictionMarket.connect(owner).resolveMarket(marketId, true))
        .to.emit(predictionMarket, "MarketResolved")
        .withArgs(marketId, true);

      const market = await predictionMarket.getMarket(marketId);
      expect(market.resolved).to.equal(true);
      expect(market.outcome).to.equal(true);
    });

    it("Should fail if non-owner tries to resolve", async function () {
      // Fast forward time first
      await ethers.provider.send("evm_increaseTime", [86400]);
      await ethers.provider.send("evm_mine");
      
      await expect(predictionMarket.connect(user1).resolveMarket(marketId, true))
        .to.be.revertedWithCustomError(predictionMarket, "OwnableUnauthorizedAccount")
        .withArgs(user1.address);
    });

    it("Should fail to resolve before end time", async function () {
      await expect(predictionMarket.connect(owner).resolveMarket(marketId, true))
        .to.be.revertedWith("Market has not ended yet");
    });
  });

  describe("Fee Management", function () {
    it("Should allow owner to update creation fee", async function () {
      const newFee = ethers.parseEther("0.002");
      
      await predictionMarket.connect(owner).setMarketCreationFee(newFee);
      expect(await predictionMarket.marketCreationFee()).to.equal(newFee);
    });

    it("Should allow owner to update trading fee", async function () {
      const newFee = 10; // 1% (10 basis points)
      
      await predictionMarket.connect(owner).setTradingFee(newFee);
      expect(await predictionMarket.tradingFee()).to.equal(newFee);
    });

    it("Should fail to set trading fee above 5%", async function () {
      const highFee = 60; // 6% (60 basis points)
      
      await expect(predictionMarket.connect(owner).setTradingFee(highFee))
        .to.be.revertedWith("Fee cannot exceed 5%");
    });

    it("Should fail if non-owner tries to update fees", async function () {
      const newFee = ethers.parseEther("0.002");
      
      // Use a more flexible error check for Ownable
      await expect(predictionMarket.connect(user1).setMarketCreationFee(newFee))
        .to.be.reverted;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle empty question creation", async function () {
      const creationFee = await predictionMarket.marketCreationFee();
      
      await expect(predictionMarket.connect(user1).createMarket(
        "",
        "Description",
        futureTime,
        { value: creationFee }
      )).to.be.revertedWith("Question cannot be empty");
    });

    it("Should handle buying shares with 0 value", async function () {
      const creationFee = await predictionMarket.marketCreationFee();
      
      await predictionMarket.connect(user1).createMarket(
        "Test Question",
        "Test Description",
        futureTime,
        { value: creationFee }
      );
      
      await expect(predictionMarket.connect(user2).buyShares(
        1,
        true,
        { value: 0 }
      )).to.be.revertedWith("Must send ETH to buy shares");
    });
  });
});

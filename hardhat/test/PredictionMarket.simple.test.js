const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PredictionMarket - Simple Tests", function () {
  let predictionMarket;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
    predictionMarket = await PredictionMarket.deploy();
    await predictionMarket.waitForDeployment();
  });

  describe("Basic Functionality", function () {
    it("Should deploy with correct owner", async function () {
      expect(await predictionMarket.owner()).to.equal(owner.address);
    });

    it("Should have correct initial fees", async function () {
      expect(await predictionMarket.marketCreationFee()).to.equal(ethers.parseEther("0.001"));
      expect(await predictionMarket.tradingFee()).to.equal(ethers.parseEther("0.005"));
    });

    it("Should start with 0 markets", async function () {
      expect(await predictionMarket.getTotalMarkets()).to.equal(0);
    });
  });

  describe("Market Creation", function () {
    it("Should create a market successfully", async function () {
      const question = "Will Bitcoin reach $100k?";
      const description = "Bitcoin price prediction";
      const endTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const creationFee = await predictionMarket.marketCreationFee();
      
      const tx = await predictionMarket.connect(user1).createMarket(
        question,
        description,
        endTime,
        { value: creationFee }
      );
      
      await expect(tx).to.emit(predictionMarket, "MarketCreated");
      
      expect(await predictionMarket.getTotalMarkets()).to.equal(1);
      
      const market = await predictionMarket.getMarket(1);
      expect(market.question).to.equal(question);
      expect(market.description).to.equal(description);
      expect(market.endTime).to.equal(endTime);
      expect(market.resolved).to.equal(false);
    });

    it("Should fail with insufficient fee", async function () {
      const question = "Test question";
      const description = "Test description";
      const endTime = Math.floor(Date.now() / 1000) + 3600;
      const insufficientFee = ethers.parseEther("0.0005");
      
      await expect(
        predictionMarket.connect(user1).createMarket(
          question,
          description,
          endTime,
          { value: insufficientFee }
        )
      ).to.be.revertedWith("Insufficient creation fee");
    });
  });

  describe("Trading", function () {
    let marketId;
    
    beforeEach(async function () {
      const question = "Will ETH 2.0 launch?";
      const description = "ETH 2.0 launch prediction";
      const endTime = Math.floor(Date.now() / 1000) + 3600;
      const creationFee = await predictionMarket.marketCreationFee();
      
      await predictionMarket.connect(user1).createMarket(
        question,
        description,
        endTime,
        { value: creationFee }
      );
      marketId = 1;
    });

    it("Should allow buying Yes shares", async function () {
      const amount = ethers.parseEther("0.1");
      
      await expect(
        predictionMarket.connect(user2).buyShares(marketId, true, { value: amount })
      ).to.emit(predictionMarket, "SharesBought");
      
      const shares = await predictionMarket.getUserShares(marketId, user2.address, true);
      expect(shares).to.equal(amount);
    });

    it("Should allow buying No shares", async function () {
      const amount = ethers.parseEther("0.05");
      
      await expect(
        predictionMarket.connect(user2).buyShares(marketId, false, { value: amount })
      ).to.emit(predictionMarket, "SharesBought");
      
      const shares = await predictionMarket.getUserShares(marketId, user2.address, false);
      expect(shares).to.equal(amount);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update creation fee", async function () {
      const newFee = ethers.parseEther("0.002");
      
      await predictionMarket.connect(owner).setMarketCreationFee(newFee);
      expect(await predictionMarket.marketCreationFee()).to.equal(newFee);
    });

    it("Should allow owner to update trading fee", async function () {
      const newFee = 20; // 2% in basis points (20/1000 = 2%)
      
      await predictionMarket.connect(owner).setTradingFee(newFee);
      expect(await predictionMarket.tradingFee()).to.equal(newFee);
    });

    it("Should prevent non-owner from updating fees", async function () {
      const newFee = ethers.parseEther("0.002");
      
      await expect(
        predictionMarket.connect(user1).setMarketCreationFee(newFee)
      ).to.be.reverted;
    });
  });
});

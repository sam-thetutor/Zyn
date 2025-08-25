// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PredictionMarket
 * @dev A simple prediction market contract for Base blockchain
 */
contract PredictionMarket is ReentrancyGuard, Ownable {
    uint256 private _marketIds = 0;
    
    struct Market {
        uint256 id;
        string question;
        string description;
        uint256 endTime;
        bool resolved;
        bool outcome;
        uint256 totalYes;
        uint256 totalNo;
        mapping(address => uint256) yesShares;
        mapping(address => uint256) noShares;
        mapping(address => bool) hasVoted;
    }
    
    mapping(uint256 => Market) public markets;
    
    uint256 public marketCreationFee = 0.001 ether;
    uint256 public tradingFee = 0.005 ether; // 0.5%
    
    event MarketCreated(uint256 indexed marketId, string question, uint256 endTime);
    event MarketResolved(uint256 indexed marketId, bool outcome);
    event SharesBought(uint256 indexed marketId, address indexed buyer, bool outcome, uint256 amount);
    event SharesSold(uint256 indexed marketId, address indexed seller, bool outcome, uint256 amount);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Create a new prediction market
     * @param question The prediction question
     * @param description Additional description
     * @param endTime When the market closes (timestamp)
     */
    function createMarket(
        string memory question,
        string memory description,
        uint256 endTime
    ) external payable returns (uint256) {
        require(msg.value >= marketCreationFee, "Insufficient creation fee");
        require(endTime > block.timestamp, "End time must be in the future");
        require(bytes(question).length > 0, "Question cannot be empty");
        
        _marketIds++;
        uint256 marketId = _marketIds;
        
        Market storage market = markets[marketId];
        market.id = marketId;
        market.question = question;
        market.description = description;
        market.endTime = endTime;
        market.resolved = false;
        
        emit MarketCreated(marketId, question, endTime);
        
        return marketId;
    }
    
    /**
     * @dev Buy shares for a specific outcome
     * @param marketId The market ID
     * @param outcome True for Yes, False for No
     */
    function buyShares(uint256 marketId, bool outcome) external payable nonReentrant {
        Market storage market = markets[marketId];
        require(market.id != 0, "Market does not exist");
        require(!market.resolved, "Market already resolved");
        require(block.timestamp < market.endTime, "Market has ended");
        require(msg.value > 0, "Must send ETH to buy shares");
        
        if (outcome) {
            market.yesShares[msg.sender] += msg.value;
            market.totalYes += msg.value;
        } else {
            market.noShares[msg.sender] += msg.value;
            market.totalNo += msg.value;
        }
        
        emit SharesBought(marketId, msg.sender, outcome, msg.value);
    }
    
    /**
     * @dev Sell shares for a specific outcome
     * @param marketId The market ID
     * @param outcome True for Yes, False for No
     * @param amount Amount of shares to sell
     */
    function sellShares(uint256 marketId, bool outcome, uint256 amount) external nonReentrant {
        Market storage market = markets[marketId];
        require(market.id != 0, "Market does not exist");
        require(!market.resolved, "Market already resolved");
        require(block.timestamp < market.endTime, "Market has ended");
        
        uint256 userShares = outcome ? market.yesShares[msg.sender] : market.noShares[msg.sender];
        require(userShares >= amount, "Insufficient shares to sell");
        
        uint256 payout = amount - (amount * tradingFee / 1000);
        
        if (outcome) {
            market.yesShares[msg.sender] -= amount;
            market.totalYes -= amount;
        } else {
            market.noShares[msg.sender] -= amount;
            market.totalNo -= amount;
        }
        
        payable(msg.sender).transfer(payout);
        emit SharesSold(marketId, msg.sender, outcome, amount);
    }
    
    /**
     * @dev Resolve a market (only owner)
     * @param marketId The market ID
     * @param outcome The actual outcome
     */
    function resolveMarket(uint256 marketId, bool outcome) external onlyOwner {
        Market storage market = markets[marketId];
        require(market.id != 0, "Market does not exist");
        require(!market.resolved, "Market already resolved");
        require(block.timestamp >= market.endTime, "Market has not ended yet");
        
        market.resolved = true;
        market.outcome = outcome;
        
        emit MarketResolved(marketId, outcome);
    }
    
    /**
     * @dev Claim winnings after market resolution
     * @param marketId The market ID
     */
    function claimWinnings(uint256 marketId) external nonReentrant {
        Market storage market = markets[marketId];
        require(market.id != 0, "Market does not exist");
        require(market.resolved, "Market not yet resolved");
        
        uint256 winnings = 0;
        
        if (market.outcome) {
            winnings = market.yesShares[msg.sender];
            market.yesShares[msg.sender] = 0;
        } else {
            winnings = market.noShares[msg.sender];
            market.noShares[msg.sender] = 0;
        }
        
        require(winnings > 0, "No winnings to claim");
        
        payable(msg.sender).transfer(winnings);
    }
    
    /**
     * @dev Get user shares for a specific market and outcome
     * @param marketId The market ID
     * @param user The user address
     * @param outcome True for Yes, False for No
     */
    function getUserShares(uint256 marketId, address user, bool outcome) external view returns (uint256) {
        Market storage market = markets[marketId];
        require(market.id != 0, "Market does not exist");
        
        return outcome ? market.yesShares[user] : market.noShares[user];
    }
    
    /**
     * @dev Get market details
     * @param marketId The market ID
     */
    function getMarket(uint256 marketId) external view returns (
        uint256 id,
        string memory question,
        string memory description,
        uint256 endTime,
        bool resolved,
        bool outcome,
        uint256 totalYes,
        uint256 totalNo
    ) {
        Market storage market = markets[marketId];
        require(market.id != 0, "Market does not exist");
        
        return (
            market.id,
            market.question,
            market.description,
            market.endTime,
            market.resolved,
            market.outcome,
            market.totalYes,
            market.totalNo
        );
    }
    
    /**
     * @dev Get total number of markets
     */
    function getTotalMarkets() external view returns (uint256) {
        return _marketIds;
    }
    
    /**
     * @dev Update market creation fee (only owner)
     * @param newFee New fee amount
     */
    function setMarketCreationFee(uint256 newFee) external onlyOwner {
        marketCreationFee = newFee;
    }
    
    /**
     * @dev Update trading fee (only owner)
     * @param newFee New fee percentage (basis points)
     */
    function setTradingFee(uint256 newFee) external onlyOwner {
        require(newFee <= 50, "Fee cannot exceed 5%");
        tradingFee = newFee;
    }
    
    /**
     * @dev Withdraw accumulated fees (only owner)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Emergency function to pause contract (only owner)
     */
    function emergencyPause() external onlyOwner {
        // This would require implementing Pausable from OpenZeppelin
        // For simplicity, this is a placeholder
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PredictionMarket
 * @dev A prediction market contract for Base blockchain with admin functionality, claim system, and enhanced user tracking
 */
contract PredictionMarket is ReentrancyGuard, Ownable {
    uint256 private _marketIds = 0;
    
    // Admin address - can resolve markets
    address public admin = 0x21D654daaB0fe1be0e584980ca7C1a382850939f;
    
    // Market status enum
    enum MarketStatus { ACTIVE, RESOLVED, CANCELLED }
    
    struct Market {
        uint256 id;
        string question;
        string description;
        string category;
        string image;
        uint256 endTime;
        MarketStatus status;
        bool outcome;
        uint256 totalYes;
        uint256 totalNo;
        uint256 totalPool;
        mapping(address => uint256) yesShares;
        mapping(address => uint256) noShares;
        mapping(address => bool) hasParticipated;
        mapping(address => bool) participationSide; // true=Yes, false=No
        mapping(address => uint256) claimableAmount; // Amount user can claim
        mapping(address => bool) hasClaimed; // Whether user has claimed
    }
    
    mapping(uint256 => Market) public markets;
    
    uint256 public marketCreationFee = 0.00005 ether;
    uint256 public tradingFee = 0.00001 ether;
    
    // Enhanced events with user tracking
    event MarketCreated(
        uint256 indexed marketId, 
        address indexed creator, 
        string question, 
        string category, 
        uint256 endTime
    );
    event SharesBought(
        uint256 indexed marketId, 
        address indexed buyer, 
        bool isYesShares, 
        uint256 amount
    );
    event MarketResolved(
        uint256 indexed marketId, 
        address indexed resolver, 
        bool outcome
    );
    event WinningsClaimed(
        uint256 indexed marketId, 
        address indexed claimant, 
        uint256 amount
    );
    event FeesUpdated(uint256 newCreationFee, uint256 newTradingFee);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);
    
    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Create a new prediction market
     */
    function createMarket(
        string memory question,
        string memory description,
        string memory category,
        string memory image,
        uint256 endTime
    ) external payable returns (uint256) {
        require(msg.value >= marketCreationFee, "Insufficient creation fee");
        require(endTime > block.timestamp, "End time must be in the future");
        require(bytes(question).length > 0, "Question cannot be empty");
        require(bytes(category).length > 0, "Category cannot be empty");
        
        _marketIds++;
        uint256 marketId = _marketIds;
        
        Market storage market = markets[marketId];
        market.id = marketId;
        market.question = question;
        market.description = description;
        market.category = category;
        market.image = image;
        market.endTime = endTime;
        market.status = MarketStatus.ACTIVE;
        market.totalPool = 0;
        
        emit MarketCreated(marketId, msg.sender, question, category, endTime);
        
        return marketId;
    }
    
    /**
     * @dev Buy shares for a specific outcome
     */
    function buyShares(uint256 marketId, bool outcome) external payable nonReentrant {
        Market storage market = markets[marketId];
        require(market.id != 0, "Market does not exist");
        require(market.status == MarketStatus.ACTIVE, "Market is not active");
        require(block.timestamp < market.endTime, "Market has ended");
        require(msg.value > 0, "Must send ETH to buy shares");
        
        // Check if user has already participated in this market
        require(!market.hasParticipated[msg.sender], "Already participated in this market");
        
        // Mark user as participated and set their side
        market.hasParticipated[msg.sender] = true;
        market.participationSide[msg.sender] = outcome;
        
        if (outcome) {
            market.yesShares[msg.sender] += msg.value;
            market.totalYes += msg.value;
        } else {
            market.noShares[msg.sender] += msg.value;
            market.totalNo += msg.value;
        }
        
        market.totalPool += msg.value;
        
        emit SharesBought(marketId, msg.sender, outcome, msg.value);
    }
    
    /**
     * @dev Resolve a market (only admin)
     */
    function resolveMarket(uint256 marketId, bool outcome) external onlyAdmin {
        Market storage market = markets[marketId];
        require(market.id != 0, "Market does not exist");
        require(market.status == MarketStatus.ACTIVE, "Market is not active");
        require(block.timestamp >= market.endTime, "Market has not ended yet");
        
        market.status = MarketStatus.RESOLVED;
        market.outcome = outcome;
        
        // Calculate claimable amounts for all participants
        _calculateClaimableAmounts(marketId, outcome);
        
        emit MarketResolved(marketId, msg.sender, outcome);
    }
    
    /**
     * @dev Calculate claimable amounts for all participants
     */
    function _calculateClaimableAmounts(uint256 marketId, bool /* outcome */) private view {
        // For each participant, calculate their potential winnings
        // This is a simplified calculation - in a real implementation,
        // you might want to iterate through participants more efficiently
        
        // Note: This is a placeholder for the calculation logic
        // In practice, you'd need to track participants and calculate individually
        // For now, users will calculate their claimable amount when they call claimWinnings
    }
    
    /**
     * @dev Claim winnings after market resolution
     */
    function claimWinnings(uint256 marketId) external nonReentrant {
        Market storage market = markets[marketId];
        require(market.id != 0, "Market does not exist");
        require(market.status == MarketStatus.RESOLVED, "Market not yet resolved");
        require(!market.hasClaimed[msg.sender], "Already claimed winnings");
        
        uint256 claimableAmount = _calculateUserClaimableAmount(marketId, msg.sender);
        require(claimableAmount > 0, "No winnings to claim");
        
        // Mark as claimed
        market.hasClaimed[msg.sender] = true;
        
        // Transfer winnings
        payable(msg.sender).transfer(claimableAmount);
        
        emit WinningsClaimed(marketId, msg.sender, claimableAmount);
    }
    
    /**
     * @dev Calculate how much a user can claim for a specific market
     */
    function _calculateUserClaimableAmount(uint256 marketId, address user) private view returns (uint256) {
        Market storage market = markets[marketId];
        
        if (market.outcome) {
            // Outcome is Yes - Yes shares win, No shares lose
            if (market.yesShares[user] > 0) {
                // Calculate winnings based on total pool and user's share percentage
                uint256 userSharePercentage = (market.yesShares[user] * 1e18) / market.totalYes;
                uint256 winningPool = market.totalPool;
                return (winningPool * userSharePercentage) / 1e18;
            }
        } else {
            // Outcome is No - No shares win, Yes shares lose
            if (market.noShares[user] > 0) {
                // Calculate winnings based on total pool and user's share percentage
                uint256 userSharePercentage = (market.noShares[user] * 1e18) / market.totalNo;
                uint256 winningPool = market.totalPool;
                return (winningPool * userSharePercentage) / 1e18;
            }
        }
        
        return 0;
    }
    
    /**
     * @dev Get claimable amount for a user (view function)
     */
    function getClaimableAmount(uint256 marketId, address user) external view returns (uint256) {
        Market storage market = markets[marketId];
        require(market.id != 0, "Market does not exist");
        require(market.status == MarketStatus.RESOLVED, "Market not yet resolved");
        
        return _calculateUserClaimableAmount(marketId, user);
    }
    
    /**
     * @dev Check if user has claimed winnings for a market
     */
    function hasUserClaimed(uint256 marketId, address user) external view returns (bool) {
        Market storage market = markets[marketId];
        require(market.id != 0, "Market does not exist");
        return market.hasClaimed[user];
    }
    
    /**
     * @dev Get user shares for a specific market and outcome
     */
    function getUserShares(uint256 marketId, address user, bool outcome) external view returns (uint256) {
        Market storage market = markets[marketId];
        require(market.id != 0, "Market does not exist");
        
        return outcome ? market.yesShares[user] : market.noShares[user];
    }
    
    /**
     * @dev Check if user has participated in a market
     */
    function hasUserParticipated(uint256 marketId, address user) external view returns (bool) {
        Market storage market = markets[marketId];
        require(market.id != 0, "Market does not exist");
        return market.hasParticipated[user];
    }
    
    /**
     * @dev Get user's participation side
     */
    function getUserParticipationSide(uint256 marketId, address user) external view returns (bool) {
        Market storage market = markets[marketId];
        require(market.id != 0, "Market does not exist");
        require(market.hasParticipated[user], "User has not participated");
        return market.participationSide[user];
    }
    
    /**
     * @dev Get market details
     */
    function getMarket(uint256 marketId) external view returns (
        uint256 id,
        string memory question,
        string memory description,
        string memory category,
        string memory image,
        uint256 endTime,
        MarketStatus status,
        bool outcome,
        uint256 totalYes,
        uint256 totalNo,
        uint256 totalPool
    ) {
        Market storage market = markets[marketId];
        require(market.id != 0, "Market does not exist");
        
        return (
            market.id,
            market.question,
            market.description,
            market.category,
            market.image,
            market.endTime,
            market.status,
            market.outcome,
            market.totalYes,
            market.totalNo,
            market.totalPool
        );
    }
    
    /**
     * @dev Get total number of markets
     */
    function getTotalMarkets() external view returns (uint256) {
        return _marketIds;
    }
    
    /**
     * @dev Get current fee information
     */
    function getFeeInfo() external view returns (uint256 creationFee, uint256 tradingFees) {
        return (marketCreationFee, tradingFee);
    }
    
    /**
     * @dev Change admin address (only current admin)
     */
    function changeAdmin(address newAdmin) external {
        require(msg.sender == admin, "Only admin can change admin");
        require(newAdmin != address(0), "New admin cannot be zero address");
        
        address oldAdmin = admin;
        admin = newAdmin;
        
        emit AdminChanged(oldAdmin, newAdmin);
    }
    
    /**
     * @dev Update market creation fee (only owner)
     */
    function setMarketCreationFee(uint256 newFee) external onlyOwner {
        marketCreationFee = newFee;
    }
    
    /**
     * @dev Update trading fee (only owner)
     */
    function setTradingFee(uint256 newFee) external onlyOwner {
        require(newFee <= 0.01 ether, "Fee cannot exceed 0.01 ETH");
        tradingFee = newFee;
    }
    
    /**
     * @dev Update both fees at once (only owner)
     */
    function setFees(uint256 newCreationFee, uint256 newTradingFee) external onlyOwner {
        require(newCreationFee > 0, "Creation fee must be greater than 0");
        require(newTradingFee <= 0.01 ether, "Trading fee cannot exceed 0.01 ETH");
        
        marketCreationFee = newCreationFee;
        tradingFee = newTradingFee;
        
        emit FeesUpdated(newCreationFee, newTradingFee);
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

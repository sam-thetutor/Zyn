// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PredictionMarketMinimalClaim
 * @dev A minimal prediction market contract with basic claiming functionality
 */
contract PredictionMarketMinimalClaim is Ownable {
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
        mapping(address => bool) participationSide;
    }
    
    mapping(uint256 => Market) public markets;
    
    // Username management
    mapping(address => string) public usernames;
    mapping(string => bool) public usernameTaken;
    uint256 public usernameChangeFee = 0.00001 ether;
    
    uint256 public marketCreationFee = 0.00005 ether;
    
    // Simple winner tracking
    mapping(uint256 => address[]) public marketWinners;
    mapping(uint256 => uint256) public totalWinningShares;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    uint256 public contractFees;
    
    // Events
    event MarketCreated(uint256 indexed marketId, address indexed creator, string question, uint256 endTime);
    event SharesBought(uint256 indexed marketId, address indexed buyer, bool isYesShares, uint256 amount);
    event MarketResolved(uint256 indexed marketId, address indexed resolver, bool outcome);
    event UsernameSet(address indexed user, string username);
    event UsernameChanged(address indexed user, string oldUsername, string newUsername);
    event WinningsClaimed(uint256 indexed marketId, address indexed claimant, uint256 amount);
    
    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Set username for the first time (free)
     */
    function setUsername(string memory username) external {
        require(bytes(username).length >= 3 && bytes(username).length <= 20, "Username must be 3-20 characters");
        require(!usernameTaken[username], "Username already taken");
        require(bytes(usernames[msg.sender]).length == 0, "Username already set");
        
        usernames[msg.sender] = username;
        usernameTaken[username] = true;
        
        emit UsernameSet(msg.sender, username);
    }
    
    /**
     * @dev Change username (requires fee payment)
     */
    function changeUsername(string memory newUsername) external payable {
        require(msg.value >= usernameChangeFee, "Insufficient fee for username change");
        require(bytes(newUsername).length >= 3 && bytes(newUsername).length <= 20, "Username must be 3-20 characters");
        require(!usernameTaken[newUsername], "Username already taken");
        require(bytes(usernames[msg.sender]).length > 0, "No username to change");
        
        string memory oldUsername = usernames[msg.sender];
        usernameTaken[oldUsername] = false;
        usernames[msg.sender] = newUsername;
        usernameTaken[newUsername] = true;
        
        emit UsernameChanged(msg.sender, oldUsername, newUsername);
    }
    
    /**
     * @dev Get username for an address
     */
    function getUsername(address user) external view returns (string memory) {
        return usernames[user];
    }
    
    /**
     * @dev Check if username is available
     */
    function isUsernameAvailable(string memory username) external view returns (bool) {
        return !usernameTaken[username];
    }
    
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
        
        emit MarketCreated(marketId, msg.sender, question, endTime);
        
        return marketId;
    }
    
    /**
     * @dev Buy shares in a market
     */
    function buyShares(uint256 marketId, bool outcome) external payable {
        Market storage market = markets[marketId];
        require(market.id != 0, "Market does not exist");
        require(market.status == MarketStatus.ACTIVE, "Market is not active");
        require(block.timestamp < market.endTime, "Market has ended");
        require(msg.value > 0, "Must send ETH to buy shares");
        require(!market.hasParticipated[msg.sender], "Already participated in this market");
        
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
        
        // Simple winner calculation - anyone who bought winning shares
        address[] memory winners = new address[](0);
        uint256 totalShares = 0;
        
        // For simplicity, we'll handle winner tracking in the claim function
        // This keeps the contract size minimal
        
        emit MarketResolved(marketId, msg.sender, outcome);
    }
    
    /**
     * @dev Claim winnings for a specific market
     */
    function claimWinnings(uint256 marketId) external {
        Market storage market = markets[marketId];
        require(market.id != 0, "Market does not exist");
        require(market.status == MarketStatus.RESOLVED, "Market not yet resolved");
        require(!hasClaimed[marketId][msg.sender], "Already claimed winnings");
        
        // Check if user is a winner (bought winning shares)
        uint256 userShares = 0;
        if (market.outcome) {
            userShares = market.yesShares[msg.sender];
        } else {
            userShares = market.noShares[msg.sender];
        }
        
        require(userShares > 0, "Not a winner in this market");
        
        // Calculate user's proportional winnings (70% of total pool)
        uint256 totalPool = market.totalPool;
        uint256 totalWinnerAmount = (totalPool * 70) / 100;  // 70% to winners
        
        // Calculate user's share percentage
        uint256 totalWinningShares = market.outcome ? market.totalYes : market.totalNo;
        uint256 userWinnings = (totalWinnerAmount * userShares) / totalWinningShares;
        
        require(userWinnings > 0, "No winnings to claim");
        
        // Mark as claimed
        hasClaimed[marketId][msg.sender] = true;
        
        // Transfer winnings
        payable(msg.sender).transfer(userWinnings);
        
        emit WinningsClaimed(marketId, msg.sender, userWinnings);
    }
    
    /**
     * @dev Get market count
     */
    function getMarketCount() public view returns (uint256) {
        return _marketIds;
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
     * @dev Check if user has claimed winnings for a market
     */
    function hasUserClaimed(uint256 marketId, address user) external view returns (bool) {
        return hasClaimed[marketId][user];
    }
    
    /**
     * @dev Update market creation fee (only owner)
     */
    function setMarketCreationFee(uint256 newFee) external onlyOwner {
        marketCreationFee = newFee;
    }
    
    /**
     * @dev Update username change fee (only owner)
     */
    function updateUsernameChangeFee(uint256 newFee) external onlyOwner {
        usernameChangeFee = newFee;
    }
    
    /**
     * @dev Withdraw accumulated fees (only owner)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        payable(owner()).transfer(balance);
    }
}

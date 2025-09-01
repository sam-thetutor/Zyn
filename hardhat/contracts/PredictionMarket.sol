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
    
    // Public getter for market count
    function getMarketCount() public view returns (uint256) {
        return _marketIds;
    }
    
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
        uint256 winnerCount;
        uint256 totalWinningShares;
        mapping(address => uint256) yesShares;
        mapping(address => uint256) noShares;
        mapping(address => bool) hasParticipated;
        mapping(address => bool) participationSide; // true=Yes, false=No
        mapping(address => uint256) claimableAmount; // Amount user can claim
        mapping(address => bool) hasClaimed; // Whether user has claimed
    }
    
    mapping(uint256 => Market) public markets;
    
    // Winner tracking per market
    mapping(uint256 => address[]) public marketWinners;
    mapping(uint256 => uint256) public winnerCount;
    mapping(uint256 => uint256) public totalWinningShares; // Total shares of winning outcome
    
    // Participant tracking
    mapping(uint256 => address[]) public marketParticipants;
    mapping(uint256 => mapping(address => bool)) public isParticipant;
    
    // Contract fee tracking
    uint256 public contractFees;
    
    // Username management
    mapping(address => string) public usernames;
    mapping(string => bool) public usernameTaken;
    uint256 public usernameChangeFee = 0.00001 ether;
    
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
        bool outcome,
        address[] winners,
        uint256 totalWinnerAmount
    );
    event WinningsClaimed(
        uint256 indexed marketId, 
        address indexed claimant, 
        uint256 amount
    );
    event FeesUpdated(uint256 newCreationFee, uint256 newTradingFee);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);
    event UsernameSet(address indexed user, string username);
    event UsernameChanged(address indexed user, string oldUsername, string newUsername);
    event UsernameChangeFeeUpdated(uint256 newFee);
    
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
        require(bytes(username).length > 0, "Username cannot be empty");
        require(!usernameTaken[username], "Username already taken");
        require(bytes(usernames[msg.sender]).length == 0, "Username already set");
        
        // Validate username format (alphanumeric and underscores only)
        for (uint256 i = 0; i < bytes(username).length; i++) {
            bytes1 char = bytes(username)[i];
            require(
                (char >= 0x30 && char <= 0x39) || // 0-9
                (char >= 0x41 && char <= 0x5A) || // A-Z
                (char >= 0x61 && char <= 0x7A) || // a-z
                char == 0x5F, // underscore
                "Username can only contain alphanumeric characters and underscores"
            );
        }
        
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
        require(bytes(newUsername).length > 0, "Username cannot be empty");
        require(!usernameTaken[newUsername], "Username already taken");
        require(bytes(usernames[msg.sender]).length > 0, "No username to change");
        
        // Validate username format (alphanumeric and underscores only)
        for (uint256 i = 0; i < bytes(newUsername).length; i++) {
            bytes1 char = bytes(newUsername)[i];
            require(
                (char >= 0x30 && char <= 0x39) || // 0-9
                (char >= 0x41 && char <= 0x5A) || // A-Z
                (char >= 0x61 && char <= 0x7A) || // a-z
                char == 0x5F, // underscore
                "Username can only contain alphanumeric characters and underscores"
            );
        }
        
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
     * @dev Update username change fee (admin only)
     */
    function updateUsernameChangeFee(uint256 newFee) external onlyOwner {
        usernameChangeFee = newFee;
        emit UsernameChangeFeeUpdated(newFee);
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
        
        // Add user to participants list
        if (!isParticipant[marketId][msg.sender]) {
            marketParticipants[marketId].push(msg.sender);
            isParticipant[marketId][msg.sender] = true;
        }
        
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
        
        // Calculate winners and total winning shares
        (address[] memory winners, uint256 totalWinningShares) = getWinnersAndTotalShares(marketId, outcome);
        uint256 winnerCount = winners.length;
        
        if (winnerCount > 0) {
            // Store winners for this market
            marketWinners[marketId] = winners;
            market.winnerCount = winnerCount;
            market.totalWinningShares = totalWinningShares;
            
            // Calculate distribution
            uint256 totalPool = market.totalPool;
            uint256 adminAmount = (totalPool * 15) / 100;            // 15% to admin (stays in contract)
            uint256 contractAmount = (totalPool * 15) / 100;         // 15% to contract fees
            
            // Add fees to contract (admin can withdraw later)
            contractFees += adminAmount + contractAmount;
            
            emit MarketResolved(marketId, msg.sender, outcome, winners, totalWinningShares);
        }
    }
    
    /**
     * @dev Calculate winners and total winning shares for a market
     */
    function getWinnersAndTotalShares(uint256 marketId, bool outcome) private view returns (address[] memory winners, uint256 totalShares) {
        Market storage market = markets[marketId];
        address[] memory participants = marketParticipants[marketId];
        address[] memory tempWinners = new address[](participants.length);
        uint256 winnerCount = 0;
        uint256 totalWinningShares = 0;
        
        for (uint256 i = 0; i < participants.length; i++) {
            address participant = participants[i];
            uint256 userShares = 0;
            
            if (outcome) {
                // Outcome is YES - Yes shares win
                userShares = market.yesShares[participant];
            } else {
                // Outcome is NO - No shares win
                userShares = market.noShares[participant];
            }
            
            if (userShares > 0) {
                tempWinners[winnerCount] = participant;
                winnerCount++;
                totalWinningShares += userShares;
            }
        }
        
        // Create final winners array
        winners = new address[](winnerCount);
        for (uint256 i = 0; i < winnerCount; i++) {
            winners[i] = tempWinners[i];
        }
        
        return (winners, totalWinningShares);
    }
    

    
    /**
     * @dev Claim winnings after market resolution
     */
    function claimWinnings(uint256 marketId) external nonReentrant {
        Market storage market = markets[marketId];
        require(market.id != 0, "Market does not exist");
        require(market.status == MarketStatus.RESOLVED, "Market not yet resolved");
        require(!market.hasClaimed[msg.sender], "Already claimed winnings");
        
        // Check if user is a winner
        require(isWinner(marketId, msg.sender), "Not a winner in this market");
        
        uint256 claimableAmount = calculateUserWinnings(marketId, msg.sender);
        require(claimableAmount > 0, "No winnings to claim");
        
        // Mark as claimed
        market.hasClaimed[msg.sender] = true;
        
        // Transfer proportional winnings
        payable(msg.sender).transfer(claimableAmount);
        
        emit WinningsClaimed(marketId, msg.sender, claimableAmount);
    }
    
    /**
     * @dev Check if user is a winner in a specific market
     */
    function isWinner(uint256 marketId, address user) public view returns (bool) {
        address[] memory winners = marketWinners[marketId];
        for (uint256 i = 0; i < winners.length; i++) {
            if (winners[i] == user) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Calculate proportional winnings for a user
     */
    function calculateUserWinnings(uint256 marketId, address user) public view returns (uint256) {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.RESOLVED, "Market not yet resolved");
        
        uint256 userShares = 0;
        if (market.outcome) {
            // Outcome is YES - Yes shares win
            userShares = market.yesShares[user];
        } else {
            // Outcome is NO - No shares win
            userShares = market.noShares[user];
        }
        
        if (userShares == 0) return 0;
        
        uint256 totalPool = market.totalPool;
        uint256 totalWinnerAmount = (totalPool * 70) / 100;  // 70% to winners
        uint256 totalWinningShares = market.totalWinningShares;
        
        // Calculate user's share percentage
        uint256 userSharePercentage = (userShares * 1e18) / totalWinningShares;
        
        // Calculate user's winnings
        uint256 userWinnings = (totalWinnerAmount * userSharePercentage) / 1e18;
        
        return userWinnings;
    }
    
    /**
     * @dev Calculate how much a user can claim for a specific market (legacy function)
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
     * @dev Get winners for a specific market
     */
    function getMarketWinners(uint256 marketId) external view returns (address[] memory) {
        require(markets[marketId].id != 0, "Market does not exist");
        return marketWinners[marketId];
    }
    
    /**
     * @dev Get total winning shares for a market
     */
    function getTotalWinningShares(uint256 marketId) external view returns (uint256) {
        require(markets[marketId].id != 0, "Market does not exist");
        return markets[marketId].totalWinningShares;
    }
    

    
    /**
     * @dev Get all participants for a market with their details
     */
    function getAllParticipants(uint256 marketId) external view returns (
        address[] memory addresses,
        string[] memory userUsernames,
        uint256[] memory yesShares,
        uint256[] memory noShares,
        uint256[] memory totalInvestments,
        bool[] memory participationSides
    ) {
        require(markets[marketId].id != 0, "Market does not exist");
        
        address[] memory participants = marketParticipants[marketId];
        uint256 participantCount = participants.length;
        
        addresses = new address[](participantCount);
        userUsernames = new string[](participantCount);
        yesShares = new uint256[](participantCount);
        noShares = new uint256[](participantCount);
        totalInvestments = new uint256[](participantCount);
        participationSides = new bool[](participantCount);
        
        for (uint256 i = 0; i < participantCount; i++) {
            address participant = participants[i];
            addresses[i] = participant;
            userUsernames[i] = usernames[participant];
            yesShares[i] = markets[marketId].yesShares[participant];
            noShares[i] = markets[marketId].noShares[participant];
            totalInvestments[i] = yesShares[i] + noShares[i];
            participationSides[i] = markets[marketId].participationSide[participant];
        }
        
        return (addresses, userUsernames, yesShares, noShares, totalInvestments, participationSides);
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
        uint256 amount = contractFees;
        require(amount > 0, "No fees to withdraw");
        
        contractFees = 0;
        payable(owner()).transfer(amount);
    }
    
    /**
     * @dev Get contract fee balance
     */
    function getContractFees() external view returns (uint256) {
        return contractFees;
    }
    
    /**
     * @dev Emergency function to pause contract (only owner)
     */
    function emergencyPause() external onlyOwner {
        // This would require implementing Pausable from OpenZeppelin
        // For simplicity, this is a placeholder
    }
}

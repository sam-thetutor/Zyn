// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PredictionMarketSimple is ReentrancyGuard, Ownable {
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
    }
    
    mapping(uint256 => Market) public markets;
    
    // Username management
    mapping(address => string) public usernames;
    mapping(string => bool) public usernameTaken;
    uint256 public usernameChangeFee = 0.00001 ether;
    
    uint256 public marketCreationFee = 0.00005 ether;
    
    // Winner tracking per market
    mapping(uint256 => address[]) public marketWinners;
    mapping(uint256 => uint256) public totalWinningShares;
    
    // Claim tracking
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    
    // Contract fee tracking
    uint256 public contractFees;
    
    // Participant tracking
    mapping(uint256 => address[]) public marketParticipants;
    
    // Events
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
    event UsernameSet(address indexed user, string username);
    event UsernameChanged(address indexed user, string oldUsername, string newUsername);
    event WinningsClaimed(uint256 indexed marketId, address indexed claimant, uint256 amount);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);
    
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
        require(endTime <= block.timestamp + 120, "End time cannot be more than 2 minutes in the future");
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
     * @dev Buy shares in a market
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
        marketParticipants[marketId].push(msg.sender);
        
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
        (address[] memory winners, uint256 totalShares) = getWinnersAndShares(marketId, outcome);
        
        if (winners.length > 0) {
            marketWinners[marketId] = winners;
            totalWinningShares[marketId] = totalShares;
            
            // Calculate distribution (70% winners, 15% admin, 15% contract)
            uint256 totalPool = market.totalPool;
            uint256 adminAmount = (totalPool * 15) / 100;      // 15% to admin
            uint256 contractAmount = (totalPool * 15) / 100;   // 15% to contract fees
            
            // Add fees to contract (admin can withdraw later)
            contractFees += adminAmount + contractAmount;
        }
        
        emit MarketResolved(marketId, msg.sender, outcome);
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
     * @dev Get winners and total winning shares for a market
     */
    function getWinnersAndShares(uint256 marketId, bool outcome) private view returns (address[] memory, uint256) {
        Market storage market = markets[marketId];
        require(market.id != 0, "Market does not exist");
        
        address[] memory participants = marketParticipants[marketId];
        uint256 participantCount = participants.length;
        
        // Count winners and calculate total shares
        uint256 winnerCount = 0;
        uint256 totalShares = 0;
        
        // First pass: count winners and total shares
        for (uint256 i = 0; i < participantCount; i++) {
            address participant = participants[i];
            if (market.participationSide[participant] == outcome) {
                winnerCount++;
                if (outcome) {
                    totalShares += market.yesShares[participant];
                } else {
                    totalShares += market.noShares[participant];
                }
            }
        }
        
        if (winnerCount == 0) {
            address[] memory emptyWinners = new address[](0);
            return (emptyWinners, 0);
        }
        
        // Second pass: create winners array
        address[] memory winners = new address[](winnerCount);
        uint256 winnerIndex = 0;
        
        for (uint256 i = 0; i < participantCount; i++) {
            address participant = participants[i];
            if (market.participationSide[participant] == outcome) {
                winners[winnerIndex] = participant;
                winnerIndex++;
            }
        }
        
        return (winners, totalShares);
    }
    
    /**
     * @dev Calculate user's winnings for a specific market
     */
    function calculateUserWinnings(uint256 marketId, address user) public view returns (uint256) {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.RESOLVED, "Market not yet resolved");
        
        // Check if user is a winner
        address[] memory winners = marketWinners[marketId];
        bool userIsWinner = false;
        for (uint256 i = 0; i < winners.length; i++) {
            if (winners[i] == user) {
                userIsWinner = true;
                break;
            }
        }
        
        if (!userIsWinner) return 0;
        
        // Calculate user's proportional winnings
        uint256 userShares = 0;
        if (market.outcome) {
            userShares = market.yesShares[user];
        } else {
            userShares = market.noShares[user];
        }
        
        if (userShares == 0) return 0;
        
        uint256 totalPool = market.totalPool;
        uint256 totalWinnerAmount = (totalPool * 70) / 100;  // 70% to winners
        uint256 marketTotalWinningShares = totalWinningShares[marketId];
        
        // Calculate user's share percentage
        uint256 userWinnings = (totalWinnerAmount * userShares) / marketTotalWinningShares;
        
        return userWinnings;
    }
    
    /**
     * @dev Claim winnings for a specific market
     */
    function claimWinnings(uint256 marketId) external nonReentrant {
        Market storage market = markets[marketId];
        require(market.id != 0, "Market does not exist");
        require(market.status == MarketStatus.RESOLVED, "Market not yet resolved");
        require(!hasClaimed[marketId][msg.sender], "Already claimed winnings");
        
        // Check if user is a winner
        address[] memory winners = marketWinners[marketId];
        bool userIsWinner = false;
        for (uint256 i = 0; i < winners.length; i++) {
            if (winners[i] == msg.sender) {
                userIsWinner = true;
                break;
            }
        }
        
        require(userIsWinner, "Not a winner in this market");
        
        // Calculate user's winnings
        uint256 userWinnings = calculateUserWinnings(marketId, msg.sender);
        require(userWinnings > 0, "No winnings to claim");
        
        // Mark as claimed
        hasClaimed[marketId][msg.sender] = true;
        
        // Transfer winnings
        payable(msg.sender).transfer(userWinnings);
        
        emit WinningsClaimed(marketId, msg.sender, userWinnings);
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
        return totalWinningShares[marketId];
    }
    
    /**
     * @dev Check if user has claimed winnings for a market
     */
    function hasUserClaimed(uint256 marketId, address user) external view returns (bool) {
        return hasClaimed[marketId][user];
    }
    
    /**
     * @dev Get contract fee balance
     */
    function getContractFees() external view returns (uint256) {
        return contractFees;
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
}

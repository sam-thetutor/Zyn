// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PredictionMarketClaims.sol";

contract PredictionMarketCore is Ownable {
    // Market structure
    struct Market {
        uint256 id;
        string question;
        string description;
        string category;
        string image;
        string source;
        uint256 endTime;
        uint256 totalPool;
        uint256 totalYes;
        uint256 totalNo;
        MarketStatus status;
        bool outcome;
        uint256 createdAt;
    }

    enum MarketStatus { ACTIVE, RESOLVED, CANCELLED }

    // State variables
    uint256 public nextMarketId = 1;
    mapping(uint256 => Market) public markets;
    mapping(address => string) public usernames;
    mapping(string => bool) public usernameTaken;
    mapping(uint256 => mapping(address => bool)) public hasParticipated;
    mapping(uint256 => mapping(address => bool)) public participationSide;
    mapping(uint256 => mapping(address => uint256)) public yesShares;
    mapping(uint256 => mapping(address => uint256)) public noShares;
    
    // Reference to Claims Contract
    address payable public claimsContract;
    
    // Constants
    uint256 public constant MINIMUM_END_TIME = 120; // 2 minutes
    uint256 public constant USERNAME_CHANGE_FEE = 0.00001 ether;
    uint256 public constant MARKET_CREATION_FEE = 1 ether; // Market creation fee (1 CELO)
    
    // Events
    event MarketCreated(uint256 indexed marketId, address indexed creator, string question, string description, string source, uint256 endTime, uint256 creationFee);
    event SharesBought(uint256 indexed marketId, address indexed buyer, bool side, uint256 amount);
    event MarketResolved(uint256 indexed marketId, address indexed resolver, bool outcome);
    event UsernameSet(address indexed user, string username);
    event UsernameChanged(address indexed user, string oldUsername, string newUsername);
    event ClaimsContractSet(address indexed oldContract, address indexed newContract);
    event RewardsDisbursed(uint256 indexed marketId, address indexed claimant, uint256 amount);
    
    // Modifiers
    modifier onlyClaimsContract() {
        require(msg.sender == claimsContract, "Only claims contract can call this");
        _;
    }
    
    modifier marketExists(uint256 marketId) {
        require(markets[marketId].id != 0, "Market does not exist");
        _;
    }
    
    modifier marketActive(uint256 marketId) {
        require(markets[marketId].status == MarketStatus.ACTIVE, "Market is not active");
        _;
    }
    
    modifier marketNotEnded(uint256 marketId) {
        require(block.timestamp < markets[marketId].endTime, "Market has ended");
        _;
    }
    
    modifier marketEnded(uint256 marketId) {
        require(block.timestamp >= markets[marketId].endTime, "Market has not ended yet");
        _;
    }
    
    modifier onlyAdmin() {
        require(msg.sender == owner(), "Only admin can call this");
        _;
    }
    
    // Constructor
    constructor() Ownable(msg.sender) {
        // Set deployer as owner
    }
    
    // Core market functions
    function createMarket(
        string memory question,
        string memory description,
        string memory category,
        string memory image,
        string memory source,
        uint256 endTime
    ) external payable returns (uint256) {
        require(bytes(question).length > 0, "Question cannot be empty");
        require(endTime > block.timestamp + MINIMUM_END_TIME, "End time too soon");
        require(msg.value == MARKET_CREATION_FEE, "Must pay exact market creation fee");
        
        uint256 marketId = nextMarketId++;
        
        markets[marketId] = Market({
            id: marketId,
            question: question,
            description: description,
            category: category,
            image: image,
            source: source,
            endTime: endTime,
            totalPool: 0, // Start with 0 pool - no initial liquidity
            totalYes: 0,
            totalNo: 0,
            status: MarketStatus.ACTIVE,
            outcome: false,
            createdAt: block.timestamp
        });
        
        // Debug: Verify what was actually stored
        require(markets[marketId].endTime == endTime, "End time storage mismatch");
        require(markets[marketId].id == marketId, "ID storage mismatch");
        
        // Market creation fee is collected but doesn't go to any side
        // Creator can now buy shares separately like any other participant
        
        emit MarketCreated(marketId, msg.sender, question, description, source, endTime, MARKET_CREATION_FEE);
        
        return marketId;
    }
    
    function buyShares(uint256 marketId, bool outcome) external payable marketExists(marketId) marketActive(marketId) marketNotEnded(marketId) {
        require(msg.value > 0, "Must provide amount");
        
        // Allow users to buy more shares (including creators)
        // Remove the restriction: require(!hasParticipated[marketId][msg.sender], "Already participated in this market");
        
        // If this is the first participation, mark them as a participant
        if (!hasParticipated[marketId][msg.sender]) {
            hasParticipated[marketId][msg.sender] = true;
            participationSide[marketId][msg.sender] = outcome;
        } else {
            // If they already participated, they can only buy more shares on the same side
            require(participationSide[marketId][msg.sender] == outcome, "Cannot buy shares on opposite side");
        }
        
        if (outcome) {
            yesShares[marketId][msg.sender] += msg.value;
            markets[marketId].totalYes += msg.value;
        } else {
            noShares[marketId][msg.sender] += msg.value;
            markets[marketId].totalNo += msg.value;
        }
        
        markets[marketId].totalPool += msg.value;
        
        emit SharesBought(marketId, msg.sender, outcome, msg.value);
    }
    
    function resolveMarket(uint256 marketId, bool outcome) external onlyAdmin marketExists(marketId) marketEnded(marketId) {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.ACTIVE, "Market already resolved");
        
        market.status = MarketStatus.RESOLVED;
        market.outcome = outcome;
        
        // Notify Claims Contract to calculate winners
        if (claimsContract != address(0)) {
            PredictionMarketClaims(claimsContract).calculateWinners(marketId);
        }
        
        emit MarketResolved(marketId, msg.sender, outcome);
    }
    
    // Function to disburse rewards to claimants (called by claims contract)
    function disburseRewards(uint256 marketId, address claimant, uint256 amount) external onlyClaimsContract {
        require(markets[marketId].status == MarketStatus.RESOLVED, "Market not resolved");
        require(amount > 0, "Amount must be positive");
        require(amount <= address(this).balance, "Insufficient contract balance");
        
        // Transfer the rewards to the claimant
        payable(claimant).transfer(amount);
        
        emit RewardsDisbursed(marketId, claimant, amount);
    }
    
    // Username management
    function setUsername(string memory username) external {
        require(bytes(username).length > 0, "Username cannot be empty");
        require(!usernameTaken[username], "Username already taken");
        require(bytes(usernames[msg.sender]).length == 0, "Username already set");
        
        usernames[msg.sender] = username;
        usernameTaken[username] = true;
        
        emit UsernameSet(msg.sender, username);
    }
    
    function changeUsername(string memory newUsername) external payable {
        require(bytes(newUsername).length > 0, "Username cannot be empty");
        require(!usernameTaken[newUsername], "Username already taken");
        require(bytes(usernames[msg.sender]).length > 0, "No username to change");
        require(msg.value == USERNAME_CHANGE_FEE, "Incorrect fee amount");
        
        string memory oldUsername = usernames[msg.sender];
        usernameTaken[oldUsername] = false;
        usernames[msg.sender] = newUsername;
        usernameTaken[newUsername] = true;
        
        emit UsernameChanged(msg.sender, oldUsername, newUsername);
    }
    
    // Claims Contract management
    function setClaimsContract(address _claimsContract) external onlyAdmin {
        require(_claimsContract != address(0), "Invalid claims contract address");
        address payable oldContract = claimsContract;
        claimsContract = payable(_claimsContract);
        emit ClaimsContractSet(oldContract, _claimsContract);
    }
    
    // View functions for Claims Contract
    function getMarketData(uint256 marketId) external view returns (Market memory) {
        return markets[marketId];
    }
    
    function getUserParticipation(uint256 marketId, address user) external view returns (bool, bool, uint256, uint256) {
        return (
            hasParticipated[marketId][user],
            participationSide[marketId][user],
            yesShares[marketId][user],
            noShares[marketId][user]
        );
    }
    
    function getMarketParticipants(uint256 marketId) external view returns (address[] memory) {
        // This is a simplified version - in practice you'd want to track participants more efficiently
        // For now, we'll return an empty array and let the Claims Contract handle participant tracking
        address[] memory participants = new address[](0);
        return participants;
    }
    
    // Public view functions
    function getMarket(uint256 marketId) external view returns (Market memory) {
        return markets[marketId];
    }
    
    // Get market creation fee
    function getMarketCreationFee() external pure returns (uint256) {
        return MARKET_CREATION_FEE;
    }
    
    // Debug function to check end time specifically
    function getMarketEndTime(uint256 marketId) external view returns (uint256) {
        require(markets[marketId].id != 0, "Market does not exist");
        return markets[marketId].endTime;
    }
    
    // Debug function to check if the issue is in struct return
    function getMarketBasic(uint256 marketId) external view returns (uint256 id, uint256 endTime, uint256 totalPool) {
        require(markets[marketId].id != 0, "Market does not exist");
        Market storage market = markets[marketId];
        return (market.id, market.endTime, market.totalPool);
    }
    
    function getUsername(address user) external view returns (string memory) {
        return usernames[user];
    }
    
    function isUsernameTaken(string memory username) external view returns (bool) {
        return usernameTaken[username];
    }
    
    function getMarketCount() external view returns (uint256) {
        return nextMarketId - 1;
    }
    
    // Admin functions
    function withdrawFees() external onlyAdmin {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        payable(owner()).transfer(balance);
    }
    
    function cancelMarket(uint256 marketId) external onlyAdmin marketExists(marketId) marketActive(marketId) {
        markets[marketId].status = MarketStatus.CANCELLED;
    }
    
    // Emergency functions
    function emergencyWithdraw() external onlyAdmin {
        payable(owner()).transfer(address(this).balance);
    }
}

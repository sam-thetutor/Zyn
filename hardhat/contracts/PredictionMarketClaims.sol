// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./PredictionMarketCore.sol";

contract PredictionMarketClaims is Ownable, ReentrancyGuard {
    // Reference to Core Contract
    PredictionMarketCore public coreContract;
    
    // Claiming state
    mapping(uint256 => address[]) public marketWinners;
    mapping(uint256 => uint256) public totalWinningShares;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    uint256 public contractFees;
    
    // Events
    event WinningsClaimed(uint256 indexed marketId, address indexed claimant, uint256 amount);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);
    event CoreContractSet(address indexed oldContract, address indexed newContract);
    
    // Modifiers
    modifier onlyCoreContract() {
        require(msg.sender == address(coreContract), "Only core contract can call this");
        _;
    }
    
    modifier onlyAdmin() {
        require(msg.sender == owner(), "Only admin can call this");
        _;
    }
    
    // Constructor
    constructor(address _coreContract) Ownable(msg.sender) {
        require(_coreContract != address(0), "Invalid core contract address");
        coreContract = PredictionMarketCore(_coreContract);
    }
    
    // Core Contract management
    function setCoreContract(address _coreContract) external onlyAdmin {
        require(_coreContract != address(0), "Invalid core contract address");
        address oldContract = address(coreContract);
        coreContract = PredictionMarketCore(_coreContract);
        emit CoreContractSet(oldContract, _coreContract);
    }
    
    // Winner calculation and tracking
    function calculateWinners(uint256 marketId) external onlyCoreContract {
        // This function is called by the core contract when resolving a market
        // We'll calculate winners based on the outcome
        PredictionMarketCore.Market memory market = coreContract.getMarketData(marketId);
        require(market.status == PredictionMarketCore.MarketStatus.RESOLVED, "Market not resolved");
        
        // Calculate total winning shares for this outcome
        uint256 winningShares = 0;
        if (market.outcome) {
            // Market resolved as YES, so count all YES shares
            winningShares = market.totalYes;
        } else {
            // Market resolved as NO, so count all NO shares
            winningShares = market.totalNo;
        }
        
        // Store the total winning shares for this market
        totalWinningShares[marketId] = winningShares;
        
        // Calculate distribution (70% winners, 15% admin, 15% contract)
        uint256 totalPool = market.totalPool;
        uint256 adminAmount = (totalPool * 15) / 100;      // 15% to admin
        uint256 contractAmount = (totalPool * 15) / 100;   // 15% to contract fees
        
        // Add fees to contract (admin can withdraw later)
        contractFees += adminAmount + contractAmount;
    }
    
    function _getWinnersAndShares(uint256 marketId, bool outcome) private view returns (address[] memory, uint256) {
        // Get market data to check if it's resolved
        PredictionMarketCore.Market memory market = coreContract.getMarketData(marketId);
        require(market.status == PredictionMarketCore.MarketStatus.RESOLVED, "Market not resolved");
        
        // We need to implement a proper participant tracking system
        // For now, let's implement a basic winner calculation that works with the current structure
        
        // Since we can't iterate through all addresses efficiently, we'll use a different approach:
        // We'll calculate winners on-demand when they try to claim, rather than pre-calculating
        
        // Return empty arrays for now - the actual calculation will happen in claimWinnings
        address[] memory winners = new address[](0);
        uint256 totalShares = 0;
        
        return (winners, totalShares);
    }
    
    // Claiming functions
    function calculateUserWinnings(uint256 marketId, address user) public view returns (uint256) {
        PredictionMarketCore.Market memory market = coreContract.getMarketData(marketId);
        require(market.status == PredictionMarketCore.MarketStatus.RESOLVED, "Market not yet resolved");
        
        // Get user participation data
        (bool participated, bool side, uint256 yesShares, uint256 noShares) = coreContract.getUserParticipation(marketId, user);
        if (!participated) return 0;
        
        // Determine user's shares based on the outcome they bet on
        uint256 userShares = 0;
        if (side == market.outcome) {
            // User bet on the correct outcome
            userShares = side ? yesShares : noShares;
        } else {
            // User bet on the wrong outcome
            return 0;
        }
        
        if (userShares == 0) return 0;
        
        // Calculate total winning shares for this outcome
        uint256 winningShares = 0;
        if (market.outcome) {
            // Market resolved as YES, so count all YES shares
            winningShares = market.totalYes;
        } else {
            // Market resolved as NO, so count all NO shares
            winningShares = market.totalNo;
        }
        
        if (winningShares == 0) return 0;
        
        // Calculate winnings: 70% of total pool goes to winners, distributed proportionally
        uint256 totalWinnerAmount = (market.totalPool * 70) / 100;
        uint256 userWinnings = (totalWinnerAmount * userShares) / winningShares;
        
        return userWinnings;
    }
    
    function claimWinnings(uint256 marketId) external nonReentrant {
        require(!hasClaimed[marketId][msg.sender], "Already claimed winnings");
        
        uint256 userWinnings = calculateUserWinnings(marketId, msg.sender);
        require(userWinnings > 0, "No winnings to claim");
        
        hasClaimed[marketId][msg.sender] = true;
        
        // Call the core contract to disburse the rewards
        // The core contract will handle the actual transfer
        coreContract.disburseRewards(marketId, msg.sender, userWinnings);
        
        emit WinningsClaimed(marketId, msg.sender, userWinnings);
    }
    
    // View functions
    function isWinner(uint256 marketId, address user) external view returns (bool) {
        // Check if user participated and bet on the correct outcome
        (bool participated, bool side, uint256 yesShares, uint256 noShares) = coreContract.getUserParticipation(marketId, user);
        if (!participated) return false;
        
        // Get market data to check the outcome
        PredictionMarketCore.Market memory market = coreContract.getMarketData(marketId);
        if (market.status != PredictionMarketCore.MarketStatus.RESOLVED) return false;
        
        // User is a winner if they bet on the correct outcome and have shares
        if (side == market.outcome) {
            uint256 userShares = side ? yesShares : noShares;
            return userShares > 0;
        }
        
        return false;
    }
    
    function getMarketWinners(uint256 marketId) external view returns (address[] memory) {
        return marketWinners[marketId];
    }
    
    function getTotalWinningShares(uint256 marketId) external view returns (uint256) {
        return totalWinningShares[marketId];
    }
    
    function hasUserClaimed(uint256 marketId, address user) external view returns (bool) {
        return hasClaimed[marketId][user];
    }
    
    function getContractFees() external view returns (uint256) {
        return contractFees;
    }
    
    // Admin functions
    function withdrawFees() external onlyAdmin {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        payable(owner()).transfer(balance);
    }
    
    function changeAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin address");
        address oldAdmin = owner();
        _transferOwnership(newAdmin);
        emit AdminChanged(oldAdmin, newAdmin);
    }
    
    // Emergency functions
    function emergencyWithdraw() external onlyAdmin {
        payable(owner()).transfer(address(this).balance);
    }
    
    // Receive function to accept ETH
    receive() external payable {}
}


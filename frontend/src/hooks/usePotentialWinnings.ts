import { useCallback, useMemo } from 'react';
import { formatEther, parseEther } from 'viem';
import { usePredictionMarket } from './usePredictionMarket';
import type { Market } from '../utils/contracts';

export interface WinningsBreakdown {
  userShares: bigint;
  totalWinningShares: bigint;
  totalLosingShares: bigint;
  userWinnings: bigint;
  creatorFee: bigint;
  platformFee: bigint;
  winnersFromLosers: bigint;
  hasLosingShares: boolean;
  returnPercentage: number;
}

export interface PotentialWinnings {
  investmentAmount: bigint;
  potentialShares: bigint;
  potentialWinnings: bigint;
  returnPercentage: number;
  breakdown: WinningsBreakdown;
}

export const usePotentialWinnings = () => {
  const { 
    getMarket, 
    getMarketMetadata, 
    calculateUserWinnings,
    getWinningsBreakdown: getContractWinningsBreakdown 
  } = usePredictionMarket();

  // Calculate potential winnings for active markets
  const calculatePotentialWinnings = useCallback(async (
    market: Market,
    investmentAmount: bigint,
    outcome: boolean
  ): Promise<PotentialWinnings | null> => {
    try {
      if (market.status !== 0) {
        throw new Error('Market must be active to calculate potential winnings');
      }

      if (investmentAmount <= 0n) {
        return {
          investmentAmount: 0n,
          potentialShares: 0n,
          potentialWinnings: 0n,
          returnPercentage: 0,
          breakdown: {
            userShares: 0n,
            totalWinningShares: 0n,
            totalLosingShares: 0n,
            userWinnings: 0n,
            creatorFee: 0n,
            platformFee: 0n,
            winnersFromLosers: 0n,
            hasLosingShares: false,
            returnPercentage: 0
          }
        };
      }

      // Get current pool state
      const totalPool = market.totalPool;
      const totalYes = market.totalYes;
      const totalNo = market.totalNo;

      // Calculate current price for the chosen outcome
      const currentWinningShares = outcome ? totalYes : totalNo;
      const currentLosingShares = outcome ? totalNo : totalYes;
      
      if (currentWinningShares === 0n) {
        // If no shares exist for this outcome, user gets 1:1 ratio
        const potentialShares = investmentAmount;
        const potentialWinnings = investmentAmount;
        
        return {
          investmentAmount,
          potentialShares,
          potentialWinnings,
          returnPercentage: 0,
          breakdown: {
            userShares: potentialShares,
            totalWinningShares: potentialShares,
            totalLosingShares: 0n,
            userWinnings: potentialWinnings,
            creatorFee: 0n,
            platformFee: 0n,
            winnersFromLosers: 0n,
            hasLosingShares: false,
            returnPercentage: 0
          }
        };
      }

      // Calculate shares user would get (1:1 ratio in prediction markets)
      const potentialShares = investmentAmount;

      // Calculate potential winnings if this outcome wins
      let potentialWinnings = investmentAmount;
      let creatorFee = 0n;
      let platformFee = 0n;
      let winnersFromLosers = 0n;

      if (currentLosingShares > 0n) {
        // Calculate fees (creator fee is dynamic, platform fee is 15%)
        const creatorFeePercentage = 15n; // This should be fetched from contract
        creatorFee = (currentLosingShares * creatorFeePercentage) / 100n;
        platformFee = (currentLosingShares * 15n) / 100n;
        winnersFromLosers = currentLosingShares - creatorFee - platformFee;
        
        // Calculate user's share of the winnings from losers
        const newTotalWinningShares = currentWinningShares + potentialShares;
        const userShareOfWinnings = (winnersFromLosers * potentialShares) / newTotalWinningShares;
        
        potentialWinnings = investmentAmount + userShareOfWinnings;
      }

      // Calculate return percentage
      const returnPercentage = Number(investmentAmount) > 0 
        ? Number((potentialWinnings - investmentAmount) * 10000n / investmentAmount) / 100
        : 0;

      const breakdown: WinningsBreakdown = {
        userShares: potentialShares,
        totalWinningShares: currentWinningShares + potentialShares,
        totalLosingShares: currentLosingShares,
        userWinnings: potentialWinnings,
        creatorFee,
        platformFee,
        winnersFromLosers,
        hasLosingShares: currentLosingShares > 0n,
        returnPercentage
      };

      return {
        investmentAmount,
        potentialShares,
        potentialWinnings,
        returnPercentage,
        breakdown
      };

    } catch (error) {
      console.error('Error calculating potential winnings:', error);
      return null;
    }
  }, []);

  // Get actual winnings for resolved markets
  const getActualWinnings = useCallback(async (
    marketId: bigint,
    userAddress: string
  ): Promise<WinningsBreakdown | null> => {
    try {
      if (!userAddress) {
        throw new Error('User address is required');
      }

      // Get winnings from contract
      const winnings = await calculateUserWinnings(marketId, userAddress);
      
      // Get detailed breakdown from contract
      const breakdown = await getContractWinningsBreakdown(marketId, userAddress);
      
      if (!breakdown) {
        return null;
      }

      // Calculate return percentage
      const returnPercentage = Number(breakdown.userShares) > 0 
        ? Number((breakdown.userWinnings - breakdown.userShares) * 10000n / breakdown.userShares) / 100
        : 0;

      return {
        userShares: breakdown.userShares,
        totalWinningShares: breakdown.totalWinningShares,
        totalLosingShares: breakdown.totalLosingShares,
        userWinnings: breakdown.userWinnings,
        creatorFee: 0n, // This would need to be calculated separately
        platformFee: 0n, // This would need to be calculated separately
        winnersFromLosers: breakdown.userWinnings - breakdown.userShares,
        hasLosingShares: breakdown.hasLosingShares,
        returnPercentage
      };

    } catch (error) {
      console.error('Error getting actual winnings:', error);
      return null;
    }
  }, [calculateUserWinnings, getContractWinningsBreakdown]);

  // Calculate winnings for different investment amounts (for display purposes)
  const calculateWinningsForAmounts = useCallback(async (
    market: Market,
    outcome: boolean,
    amounts: number[] = [0.01, 0.05, 0.1, 0.25, 0.5, 1.0]
  ): Promise<PotentialWinnings[]> => {
    const results: PotentialWinnings[] = [];

    for (const amount of amounts) {
      const investmentAmount = parseEther(amount.toString());
      const winnings = await calculatePotentialWinnings(market, investmentAmount, outcome);
      
      if (winnings) {
        results.push(winnings);
      }
    }

    return results;
  }, [calculatePotentialWinnings]);

  // Utility function to format winnings for display
  const formatWinnings = useCallback((winnings: bigint): string => {
    return formatEther(winnings);
  }, []);

  // Utility function to format return percentage
  const formatReturnPercentage = useCallback((percentage: number): string => {
    if (percentage > 0) {
      return `+${percentage.toFixed(2)}%`;
    } else if (percentage < 0) {
      return `${percentage.toFixed(2)}%`;
    } else {
      return '0%';
    }
  }, []);

  // Calculate risk/reward ratio
  const calculateRiskRewardRatio = useCallback((
    potentialWinnings: PotentialWinnings
  ): number => {
    if (potentialWinnings.investmentAmount === 0n) {
      return 0;
    }

    const potentialReturn = potentialWinnings.potentialWinnings - potentialWinnings.investmentAmount;
    return Number(potentialReturn * 10000n / potentialWinnings.investmentAmount) / 100;
  }, []);

  return {
    // Core calculation functions
    calculatePotentialWinnings,
    getActualWinnings,
    calculateWinningsForAmounts,
    
    // Utility functions
    formatWinnings,
    formatReturnPercentage,
    calculateRiskRewardRatio,
  };
};

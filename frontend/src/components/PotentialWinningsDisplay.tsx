import React, { useState, useEffect, useMemo } from 'react';
import { formatEther, parseEther } from 'viem';
import { usePotentialWinnings } from '../hooks/usePotentialWinnings';
import type { Market, PotentialWinnings, WinningsBreakdown } from '../hooks/usePotentialWinnings';

interface PotentialWinningsDisplayProps {
  market: Market;
  userAddress?: string;
  className?: string;
}

const CELO_PRICE_USD = 0.311331;

export const PotentialWinningsDisplay: React.FC<PotentialWinningsDisplayProps> = ({
  market,
  userAddress,
  className = ''
}) => {
  const [investmentAmount, setInvestmentAmount] = useState('0.01');
  const [selectedOutcome, setSelectedOutcome] = useState<boolean>(true);
  const [potentialWinnings, setPotentialWinnings] = useState<PotentialWinnings | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    calculatePotentialWinnings,
    formatWinnings,
    formatReturnPercentage,
    calculateRiskRewardRatio
  } = usePotentialWinnings();

  // Calculate potential winnings when inputs change
  useEffect(() => {
    const calculateWinnings = async () => {
      if (!investmentAmount || parseFloat(investmentAmount) <= 0) {
        setPotentialWinnings(null);
        return;
      }

      setLoading(true);
      try {
        const amount = parseEther(investmentAmount);
        const winnings = await calculatePotentialWinnings(market, amount, selectedOutcome);
        setPotentialWinnings(winnings);
      } catch (error) {
        console.error('Error calculating potential winnings:', error);
        setPotentialWinnings(null);
      } finally {
        setLoading(false);
      }
    };

    calculateWinnings();
  }, [investmentAmount, selectedOutcome, market, calculatePotentialWinnings]);

  // Calculate current market percentages
  const marketPercentages = useMemo(() => {
    const totalShares = Number(market.totalYes + market.totalNo);
    const yesPercentage = totalShares > 0 ? (Number(market.totalYes) / totalShares) * 100 : 50;
    const noPercentage = totalShares > 0 ? (Number(market.totalNo) / totalShares) * 100 : 50;
    
    return { yesPercentage, noPercentage };
  }, [market.totalYes, market.totalNo]);

  // Quick amount buttons
  const quickAmounts = [0.01, 0.05, 0.1, 0.25, 0.5, 1.0];

  if (market.status !== 0) {
    return null; // Only show for active markets
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Potential Winnings Calculator</h3>
        <div className="text-sm text-gray-500">
          CELO Price: ${CELO_PRICE_USD}
        </div>
      </div>

      {/* Outcome Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Choose Outcome
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedOutcome(true)}
            className={`p-3 rounded-lg border-2 transition-colors ${
              selectedOutcome
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="font-medium">YES</div>
              <div className="text-sm opacity-75">
                {marketPercentages.yesPercentage.toFixed(1)}%
              </div>
            </div>
          </button>
          <button
            onClick={() => setSelectedOutcome(false)}
            className={`p-3 rounded-lg border-2 transition-colors ${
              !selectedOutcome
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div className="font-medium">NO</div>
              <div className="text-sm opacity-75">
                {marketPercentages.noPercentage.toFixed(1)}%
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Investment Amount Input */}
      <div className="mb-6">
        <label htmlFor="investment-amount" className="block text-sm font-medium text-gray-700 mb-2">
          Investment Amount (CELO)
        </label>
        <input
          type="number"
          id="investment-amount"
          value={investmentAmount}
          onChange={(e) => setInvestmentAmount(e.target.value)}
          placeholder="0.01"
          min="0.001"
          step="0.001"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        
        {/* Quick Amount Buttons */}
        <div className="mt-3 flex flex-wrap gap-2">
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => setInvestmentAmount(amount.toString())}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                investmentAmount === amount.toString()
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {amount} CELO
            </button>
          ))}
        </div>
      </div>

      {/* Potential Winnings Display */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Calculating potential winnings...</p>
        </div>
      ) : potentialWinnings ? (
        <div className="space-y-4">
          {/* Main Winnings Display */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-200">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Potential Winnings</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {formatWinnings(potentialWinnings.potentialWinnings)} CELO
              </div>
              <div className="text-lg text-gray-600">
                ${(Number(formatWinnings(potentialWinnings.potentialWinnings)) * CELO_PRICE_USD).toFixed(2)}
              </div>
              <div className={`text-sm font-medium mt-2 ${
                potentialWinnings.returnPercentage > 0 ? 'text-green-600' : 'text-gray-600'
              }`}>
                {formatReturnPercentage(potentialWinnings.returnPercentage)} return
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Breakdown</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Your Investment:</span>
                <span className="font-medium">{formatWinnings(potentialWinnings.investmentAmount)} CELO</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Your Shares:</span>
                <span className="font-medium">{formatWinnings(potentialWinnings.potentialShares)} shares</span>
              </div>
              {potentialWinnings.breakdown.hasLosingShares && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">From Losing Side:</span>
                    <span className="font-medium text-green-600">
                      +{formatWinnings(potentialWinnings.breakdown.winnersFromLosers)} CELO
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Creator Fee:</span>
                    <span className="font-medium text-orange-600">
                      -{formatWinnings(potentialWinnings.breakdown.creatorFee)} CELO
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Fee:</span>
                    <span className="font-medium text-red-600">
                      -{formatWinnings(potentialWinnings.breakdown.platformFee)} CELO
                    </span>
                  </div>
                </>
              )}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between font-medium">
                  <span>Total Winnings:</span>
                  <span className="text-green-600">{formatWinnings(potentialWinnings.potentialWinnings)} CELO</span>
                </div>
              </div>
            </div>
          </div>

          {/* Risk/Reward Info */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="text-yellow-600 text-xl">⚠️</div>
              <div className="text-sm">
                <div className="font-medium text-yellow-800 mb-1">Important Notes:</div>
                <ul className="text-yellow-700 space-y-1">
                  <li>• Winnings are only paid if your chosen outcome is correct</li>
                  <li>• If you're wrong, you lose your entire investment</li>
                  <li>• Creator fee: 15% of losing shares</li>
                  <li>• Platform fee: 15% of losing shares</li>
                  <li>• Calculations are estimates based on current market state</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Enter an investment amount to see potential winnings
        </div>
      )}
    </div>
  );
};

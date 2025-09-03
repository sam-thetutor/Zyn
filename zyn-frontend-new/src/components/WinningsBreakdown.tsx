import React, { useState, useEffect } from 'react';
import { usePotentialWinnings } from '../hooks/usePotentialWinnings';
import type { WinningsBreakdown } from '../hooks/usePotentialWinnings';

interface WinningsBreakdownProps {
  marketId: bigint;
  userAddress: string;
  className?: string;
}

const CELO_PRICE_USD = 0.311331;

export const WinningsBreakdownComponent: React.FC<WinningsBreakdownProps> = ({
  marketId,
  userAddress,
  className = ''
}) => {
  const [breakdown, setBreakdown] = useState<WinningsBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getActualWinnings, formatWinnings, formatReturnPercentage } = usePotentialWinnings();

  useEffect(() => {
    const fetchBreakdown = async () => {
      if (!userAddress) {
        setError('User address is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const winningsBreakdown = await getActualWinnings(marketId, userAddress);
        setBreakdown(winningsBreakdown);
      } catch (err) {
        console.error('Error fetching winnings breakdown:', err);
        setError('Failed to load winnings breakdown');
      } finally {
        setLoading(false);
      }
    };

    fetchBreakdown();
  }, [marketId, userAddress, getActualWinnings]);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading winnings breakdown...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Error Loading Winnings</h4>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!breakdown || !breakdown.userShares || !breakdown.userWinnings) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">💰</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Winnings Available</h4>
          <p className="text-gray-600">You don't have any winnings for this market.</p>
        </div>
      </div>
    );
  }

  const totalInvestment = breakdown.userShares || 0n;
  const totalWinnings = breakdown.userWinnings || 0n;
  const profit = totalWinnings - totalInvestment;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Your Winnings Breakdown</h3>
        <div className="text-sm text-gray-500">
          CELO Price: ${CELO_PRICE_USD}
        </div>
      </div>

      {/* Main Winnings Display */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200 mb-6">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-1">Total Winnings</div>
          <div className="text-4xl font-bold text-gray-900 mb-1">
            {formatWinnings(totalWinnings)} CELO
          </div>
          <div className="text-xl text-gray-600 mb-2">
            ${(Number(formatWinnings(totalWinnings)) * CELO_PRICE_USD).toFixed(2)}
          </div>
          <div className="text-lg font-medium text-green-600">
            {formatReturnPercentage(breakdown.returnPercentage)} return
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Investment Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Your Investment:</span>
              <span className="font-medium">{formatWinnings(totalInvestment)} CELO</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Your Shares:</span>
              <span className="font-medium">{formatWinnings(breakdown.userShares)} shares</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Winning Shares:</span>
              <span className="font-medium">{formatWinnings(breakdown.totalWinningShares)} shares</span>
            </div>
          </div>
        </div>

        {breakdown.hasLosingShares && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Winnings Distribution</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Losing Shares:</span>
                <span className="font-medium">{formatWinnings(breakdown.totalLosingShares)} CELO</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Your Share of Winnings:</span>
                <span className="font-medium text-green-600">
                  +{formatWinnings(breakdown.winnersFromLosers)} CELO
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Creator Fee (15%):</span>
                <span className="font-medium text-orange-600">
                  -{formatWinnings(breakdown.creatorFee)} CELO
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Platform Fee (15%):</span>
                <span className="font-medium text-red-600">
                  -{formatWinnings(breakdown.platformFee)} CELO
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Profit/Loss Summary */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-3">Profit Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">Total Investment:</span>
              <span className="font-medium">{formatWinnings(totalInvestment)} CELO</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Total Winnings:</span>
              <span className="font-medium">{formatWinnings(totalWinnings)} CELO</span>
            </div>
            <div className="border-t border-green-200 pt-2 mt-2">
              <div className="flex justify-between font-medium">
                <span className="text-green-800">Net Profit:</span>
                <span className="text-green-600">
                  {profit >= 0 ? '+' : ''}{formatWinnings(profit)} CELO
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-green-700">USD Value:</span>
                <span className="font-medium text-green-600">
                  {profit >= 0 ? '+' : ''}${(Number(formatWinnings(profit)) * CELO_PRICE_USD).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Educational Content */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-blue-600 text-xl">ℹ️</div>
            <div className="text-sm">
              <div className="font-medium text-blue-800 mb-2">How Winnings Are Calculated:</div>
              <ul className="text-blue-700 space-y-1">
                <li>• You get back your original investment</li>
                <li>• Plus your share of the losing side's money</li>
                <li>• Minus creator fee (15% of losing shares)</li>
                <li>• Minus platform fee (15% of losing shares)</li>
                <li>• Your share = (your shares / total winning shares) × available winnings</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

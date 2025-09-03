import React, { useState, useEffect, useMemo } from 'react';
import { usePredictionMarketCore } from '../hooks/usePredictionMarketCore';
import { useMarketParticipants } from '../hooks/useMarketParticipants';
import { formatEther } from 'viem';
import type { MarketWithUserShares } from '../types/contracts';

interface UserSharesDisplayProps {
  market: MarketWithUserShares;
  userAddress: string;
  className?: string;
}

export const UserSharesDisplay: React.FC<UserSharesDisplayProps> = ({
  market,
  userAddress,
  className = ''
}) => {
  const { participants, loading: participantsLoading } = useMarketParticipants(market.id);

  // Calculate user shares from smart contract events (market participants data)
  const userShares = useMemo(() => {
    if (!userAddress || !participants) {
      return null;
    }

    // Find the current user in the participants list
    const userParticipant = participants.find(
      participant => participant.address.toLowerCase() === userAddress.toLowerCase()
    );

    if (userParticipant) {
      return {
        yesShares: userParticipant.totalYesShares,
        noShares: userParticipant.totalNoShares,
        totalInvestment: userParticipant.totalInvestment
      };
    }

    return null;
  }, [userAddress, participants]);

  const loading = participantsLoading;
  const error = null; // We'll handle errors from the participants hook

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your shares...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Error Loading Shares</h4>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!userShares || userShares.totalInvestment === 0n) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">📊</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Shares Yet</h4>
          <p className="text-gray-600">You haven't bought any shares in this market.</p>
        </div>
      </div>
    );
  }

  const yesPercentage = userShares.totalInvestment > 0n 
    ? (Number(userShares.yesShares) / Number(userShares.totalInvestment)) * 100 
    : 0;
  const noPercentage = userShares.totalInvestment > 0n 
    ? (Number(userShares.noShares) / Number(userShares.totalInvestment)) * 100 
    : 0;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Your Shares</h3>
        <div className="text-sm text-gray-500">
          Total Investment: {formatEther(userShares.totalInvestment)} CELO
        </div>
      </div>

      {/* Main Shares Display */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200 mb-6">
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-1">Total Investment</div>
          <div className="text-4xl font-bold text-gray-900 mb-1">
            {formatEther(userShares.totalInvestment)} CELO
          </div>
          <div className="text-lg text-gray-600">
            {userShares.yesShares > 0n && userShares.noShares > 0n 
              ? 'Mixed Position' 
              : userShares.yesShares > 0n 
                ? 'YES Position' 
                : 'NO Position'
            }
          </div>
        </div>
      </div>

      {/* Shares Breakdown */}
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Shares Breakdown</h4>
          <div className="space-y-3">
            {/* YES Shares */}
            {userShares.yesShares > 0n && (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                  <span className="font-medium text-green-800">YES Shares</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-900">
                    {formatEther(userShares.yesShares)} CELO
                  </div>
                  <div className="text-sm text-green-600">
                    {yesPercentage.toFixed(1)}% of your investment
                  </div>
                </div>
              </div>
            )}

            {/* NO Shares */}
            {userShares.noShares > 0n && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                  <span className="font-medium text-red-800">NO Shares</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-red-900">
                    {formatEther(userShares.noShares)} CELO
                  </div>
                  <div className="text-sm text-red-600">
                    {noPercentage.toFixed(1)}% of your investment
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Market Context */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-blue-600 text-xl">ℹ️</div>
            <div className="text-sm">
              <div className="font-medium text-blue-800 mb-2">Market Context:</div>
              <div className="text-blue-700 space-y-1">
                <div>• Total YES Pool: {formatEther(market.totalYes)} CELO</div>
                <div>• Total NO Pool: {formatEther(market.totalNo)} CELO</div>
                <div>• Your YES Share: {((Number(userShares.yesShares) / Number(market.totalYes)) * 100).toFixed(2)}% of YES pool</div>
                <div>• Your NO Share: {((Number(userShares.noShares) / Number(market.totalNo)) * 100).toFixed(2)}% of NO pool</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Market } from '../../utils/contracts';
import { formatEther } from 'viem';

interface MarketResolutionModalProps {
  market: Market;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (marketId: bigint, outcome: boolean) => void;
  loading: boolean;
}

const MarketResolutionModal: React.FC<MarketResolutionModalProps> = ({
  market,
  isOpen,
  onClose,
  onConfirm,
  loading,
}) => {
  const [selectedOutcome, setSelectedOutcome] = useState<boolean | null>(null);
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedOutcome === null) return;
    onConfirm(market.id, selectedOutcome);
  };

  const handleClose = () => {
    setSelectedOutcome(null);
    setConfirmText('');
    onClose();
  };

  const formatTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  const isConfirmDisabled = selectedOutcome === null || confirmText !== 'CONFIRM' || loading;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Resolve Market</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Market Info */}
        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Market #{market.id.toString()}</h3>
            <p className="text-gray-700 mb-2">{market.question}</p>
            <div className="text-sm text-gray-500 space-y-1">
              <p>Category: {market.category}</p>
              <p>End Time: {formatTime(market.endTime)}</p>
                      <p>Total Pool: {formatEther(market.totalPool)} CELO</p>
        <p>Yes Shares: {formatEther(market.totalYes)} CELO</p>
        <p>No Shares: {formatEther(market.totalNo)} CELO</p>
            </div>
          </div>
        </div>

        {/* Outcome Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select the actual outcome:
          </label>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="outcome"
                value="true"
                checked={selectedOutcome === true}
                onChange={() => setSelectedOutcome(true)}
                disabled={loading}
                className="mr-3"
              />
              <span className="text-lg font-medium text-green-600">Yes</span>
              <span className="ml-2 text-sm text-gray-500">
                ({formatEther(market.totalYes)} CELO)
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="outcome"
                value="false"
                checked={selectedOutcome === false}
                onChange={() => setSelectedOutcome(false)}
                disabled={loading}
                className="mr-3"
              />
              <span className="text-lg font-medium text-red-600">No</span>
              <span className="ml-2 text-sm text-gray-500">
                ({formatEther(market.totalNo)} CELO)
              </span>
            </label>
          </div>
        </div>

        {/* Confirmation */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type "CONFIRM" to proceed:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="CONFIRM"
            disabled={loading}
            className="form-input w-full"
          />
        </div>

        {/* Warning */}
        <div className="mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="text-sm text-yellow-700">
                <p className="font-medium">Warning:</p>
                <p>This action cannot be undone. Once resolved, the market outcome is permanent.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Resolving...
              </>
            ) : (
              'Resolve Market'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketResolutionModal;

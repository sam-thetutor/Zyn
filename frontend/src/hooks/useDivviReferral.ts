import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';

interface ReferralData {
  referrerAddress: string;
  refereeAddress: string;
  action: string;
  transactionHash: string;
  metadata?: Record<string, any>;
}

export const useDivviReferral = () => {
  const { address } = useAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Divvi consumer address
  const DIVVI_CONSUMER_ADDRESS = '0x21D654daaB0fe1be0e584980ca7C1a382850939f';

  // Submit referral to Divvi
  const submitReferral = useCallback(async (referralData: ReferralData): Promise<boolean> => {
    if (!address) {
      setError('Wallet not connected');
      return false;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare the referral payload
      const payload = {
        consumerAddress: DIVVI_CONSUMER_ADDRESS,
        referrerAddress: referralData.referrerAddress,
        refereeAddress: referralData.refereeAddress,
        action: referralData.action,
        transactionHash: referralData.transactionHash,
        metadata: {
          ...referralData.metadata,
          timestamp: Date.now(),
          platform: 'Zyn Protocol',
          userAddress: address,
        },
      };

      console.log('Submitting referral to Divvi:', payload);

      // TODO: Replace with actual Divvi API call
      // For now, simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Referral submitted successfully to Divvi');
      return true;

    } catch (err) {
      console.error('Error submitting referral to Divvi:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit referral');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [address]);

  // Track market creation referral
  const trackMarketCreation = useCallback(async (
    referrerAddress: string,
    transactionHash: string,
    marketId: string,
    question: string
  ): Promise<boolean> => {
    return submitReferral({
      referrerAddress,
      refereeAddress: address!,
      action: 'market_creation',
      transactionHash,
      metadata: {
        marketId,
        question,
        type: 'prediction_market',
      },
    });
  }, [address, submitReferral]);

  // Track share trading referral
  const trackShareTrading = useCallback(async (
    referrerAddress: string,
    transactionHash: string,
    marketId: string,
    outcome: boolean,
    amount: string
  ): Promise<boolean> => {
    return submitReferral({
      referrerAddress,
      refereeAddress: address!,
      action: 'share_trading',
      transactionHash,
      metadata: {
        marketId,
        outcome,
        amount,
        type: 'share_purchase',
      },
    });
  }, [address, submitReferral]);

  // Track winning claim referral
  const trackWinningClaim = useCallback(async (
    referrerAddress: string,
    transactionHash: string,
    marketId: string,
    winnings: string
  ): Promise<boolean> => {
    return submitReferral({
      referrerAddress,
      refereeAddress: address!,
      action: 'winning_claim',
      transactionHash,
      metadata: {
        marketId,
        winnings,
        type: 'winnings_claim',
      },
    });
  }, [address, submitReferral]);

  // Get referral link for current user
  const getReferralLink = useCallback((): string => {
    if (!address) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}?ref=${address}`;
  }, [address]);

  // Copy referral link to clipboard
  const copyReferralLink = useCallback(async (): Promise<boolean> => {
    try {
      const link = getReferralLink();
      if (!link) return false;
      
      await navigator.clipboard.writeText(link);
      return true;
    } catch (err) {
      console.error('Failed to copy referral link:', err);
      return false;
    }
  }, [getReferralLink]);

  return {
    // State
    isSubmitting,
    error,
    
    // Actions
    submitReferral,
    trackMarketCreation,
    trackShareTrading,
    trackWinningClaim,
    
    // Utilities
    getReferralLink,
    copyReferralLink,
    
    // Constants
    DIVVI_CONSUMER_ADDRESS,
  };
};

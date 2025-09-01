import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAccount } from 'wagmi';

interface ReferralContextType {
  referralCode: string | null;
  referralAddress: string | null;
  referralStats: ReferralStats;
  isLoading: boolean;
  error: string | null;
  setReferralCode: (code: string) => void;
  clearReferralCode: () => void;
  submitReferral: (action: ReferralAction, transactionHash: string) => Promise<void>;
  getReferralLink: () => string;
  copyReferralLink: () => Promise<boolean>;
}

interface ReferralStats {
  totalReferrals: number;
  totalRewards: number;
  successfulReferrals: number;
  pendingReferrals: number;
}

interface ReferralAction {
  type: 'market_creation' | 'share_trading' | 'winning_claim';
  marketId?: string;
  amount?: string;
  outcome?: boolean;
}

const ReferralContext = createContext<ReferralContextType | undefined>(undefined);

// Divvi consumer address
const DIVVI_CONSUMER_ADDRESS = '0x21D654daaB0fe1be0e584980ca7C1a382850939f';

export const ReferralProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { address } = useAccount();
  const [referralCode, setReferralCodeState] = useState<string | null>(null);
  const [referralAddress, setReferralAddress] = useState<string | null>(null);
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    totalReferrals: 0,
    totalRewards: 0,
    successfulReferrals: 0,
    pendingReferrals: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load referral code from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('ref');
    if (code) {
      setReferralCodeState(code);
      setReferralAddress(code);
      // Store in localStorage for persistence
      localStorage.setItem('zyn_referral_code', code);
    } else {
      // Check localStorage for existing referral code
      const storedCode = localStorage.getItem('zyn_referral_code');
      if (storedCode) {
        setReferralCodeState(storedCode);
        setReferralAddress(storedCode);
      }
    }
  }, []);

  // Clear referral code
  const clearReferralCode = () => {
    setReferralCodeState(null);
    setReferralAddress(null);
    localStorage.removeItem('zyn_referral_code');
  };

  // Submit referral to Divvi
  const submitReferral = async (action: ReferralAction, transactionHash: string) => {
    if (!referralCode || !address) return;

    setIsLoading(true);
    setError(null);

    try {
      // Prepare referral data
      const referralData = {
        consumerAddress: DIVVI_CONSUMER_ADDRESS,
        referrerAddress: referralAddress,
        refereeAddress: address,
        action: action.type,
        transactionHash,
        metadata: {
          marketId: action.marketId,
          amount: action.amount,
          outcome: action.outcome,
          timestamp: Date.now(),
          platform: 'Zyn Protocol',
        },
      };

      // Submit to Divvi (this would be the actual API call)
      console.log('Submitting referral to Divvi:', referralData);
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update stats
      setReferralStats(prev => ({
        ...prev,
        totalReferrals: prev.totalReferrals + 1,
        successfulReferrals: prev.successfulReferrals + 1,
      }));

      // Clear referral code after successful submission
      clearReferralCode();
      
    } catch (err) {
      console.error('Error submitting referral:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit referral');
      
      // Update stats
      setReferralStats(prev => ({
        ...prev,
        totalReferrals: prev.totalReferrals + 1,
        pendingReferrals: prev.pendingReferrals + 1,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Generate referral link for current user
  const getReferralLink = () => {
    if (!address) return '';
    const baseUrl = window.location.origin;
    return `${baseUrl}?ref=${address}`;
  };

  // Copy referral link to clipboard
  const copyReferralLink = async (): Promise<boolean> => {
    try {
      const link = getReferralLink();
      if (!link) return false;
      
      await navigator.clipboard.writeText(link);
      return true;
    } catch (err) {
      console.error('Failed to copy referral link:', err);
      return false;
    }
  };

  const value: ReferralContextType = {
    referralCode,
    referralAddress,
    referralStats,
    isLoading,
    error,
    setReferralCode: setReferralCodeState,
    clearReferralCode,
    submitReferral,
    getReferralLink,
    copyReferralLink,
  };

  return (
    <ReferralContext.Provider value={value}>
      {children}
    </ReferralContext.Provider>
  );
};

export const useReferral = (): ReferralContextType => {
  const context = useContext(ReferralContext);
  if (context === undefined) {
    throw new Error('useReferral must be used within a ReferralProvider');
  }
  return context;
};

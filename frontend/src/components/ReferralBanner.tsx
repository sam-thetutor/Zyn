import React from 'react';
import { useReferral } from '../contexts/ReferralContext';

const ReferralBanner: React.FC = () => {
  const { referralCode, referralAddress, clearReferralCode } = useReferral();

  if (!referralCode) return null;

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 mb-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg">🎉 You were referred!</h3>
            <p className="text-blue-100 text-sm">
              Welcome to Zyn Protocol! You were invited by{' '}
              <span className="font-mono bg-white bg-opacity-20 px-2 py-1 rounded">
                {referralAddress?.slice(0, 6)}...{referralAddress?.slice(-4)}
              </span>
            </p>
          </div>
        </div>
        <button
          onClick={clearReferralCode}
          className="text-white hover:text-blue-100 transition-colors"
          title="Dismiss referral banner"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ReferralBanner;

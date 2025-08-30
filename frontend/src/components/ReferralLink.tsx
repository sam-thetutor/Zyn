import React, { useState } from 'react';
import { useReferral } from '../contexts/ReferralContext';

const ReferralLink: React.FC = () => {
  const { getReferralLink, copyReferralLink, referralStats } = useReferral();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyReferralLink();
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const referralLink = getReferralLink();

  if (!referralLink) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
        <p className="text-gray-600">Connect your wallet to get your referral link</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Your Referral Link</h3>
          <p className="text-sm text-gray-600">Share this link to earn rewards when friends join!</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Referral Link */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Referral Link
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Referral Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{referralStats.totalReferrals}</div>
            <div className="text-sm text-gray-600">Total Referrals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{referralStats.successfulReferrals}</div>
            <div className="text-sm text-gray-600">Successful</div>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">How Referrals Work</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Share your referral link with friends</li>
            <li>• When they create markets or trade, you earn rewards</li>
            <li>• Rewards are automatically distributed via Divvi</li>
            <li>• Track your referral performance in real-time</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReferralLink;

import React from 'react';
import { useAccount, useBalance, useSwitchChain } from 'wagmi';
import { celoAlfajores } from 'wagmi/chains';
import { formatEther } from 'viem';
import { useUserActivity } from '../hooks/useUserActivity';
import UserActivityStats from '../components/profile/UserActivityStats';
import UserActivityFeed from '../components/profile/UserActivityFeed';
import UsernameManagement from '../components/profile/UsernameManagement';

const Profile: React.FC = () => {
  const { address, isConnected, chainId } = useAccount();
  const { data: balance, isLoading, error } = useBalance({
    address: address,
  });
  const { switchChain } = useSwitchChain();
  
  const {
    activities,
    loading: activitiesLoading,
    error: activitiesError,
    refetch: refetchActivities,
    stats: activityStats
  } = useUserActivity();

  const isOnCeloNetwork = chainId === celoAlfajores.id; // 44787

  if (!isConnected) {
    return (
      <div className="container">
        <div className="mt-8 mb-8">
          <h1 className="gradient-text text-4xl font-bold mb-4">Profile</h1>
          <p className="text-secondary text-lg">
            Please connect your wallet to view your profile.
          </p>
        </div>
      </div>
    );
  }

  if (!isOnCeloNetwork) {
    return (
      <div className="container">
        <div className="mt-8 mb-8">
          <h1 className="gradient-text text-4xl font-bold mb-6">Profile</h1>
        </div>
        
        {/* Network Warning Card */}
        <div className="card mb-6" style={{ backgroundColor: '#fffbeb', borderColor: '#f59e0b' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#92400e' }}>⚠️ Wrong Network</h2>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-secondary">Current Network:</span>
              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {chainId === 1 ? 'Ethereum Mainnet' : `Chain ID: ${chainId}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Required Network:</span>
                              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Celo Alfajores Testnet (Chain ID: 44787)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Wallet Address:</span>
              <span className="font-medium font-mono" style={{ color: 'var(--color-text-primary)' }}>{address}</span>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-secondary mb-4">
              Your wallet is connected to the wrong network. Please switch to Celo Alfajores testnet to view your profile and balance.
            </p>
            <button 
              onClick={() => switchChain({ chainId: celoAlfajores.id })}
              className="btn-primary"
            >
              Switch to Celo Alfajores Testnet
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="mt-8 mb-8">
        <h1 className="gradient-text text-4xl font-bold mb-4">Profile</h1>
        <p className="text-secondary text-lg">
          Manage your account, view trading history, and track your performance.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Wallet Information Card */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Wallet Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-secondary">Address:</span>
              <span className="font-medium font-mono" style={{ color: 'var(--color-text-primary)' }}>{address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Network:</span>
              <span className="font-medium" style={{ color: 'var(--color-accent)' }}>
                Celo Alfajores ✓
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Chain ID:</span>
              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{chainId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Balance Status:</span>
              <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {isLoading ? 'Loading...' : 
                 error ? 'Error loading balance' :
                 balance ? 'Balance loaded' : 
                 'No balance data'}
              </span>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Account Balance</h2>
          <div className="text-center">
            {isLoading ? (
              <div className="text-secondary">Loading balance...</div>
            ) : error ? (
              <div className="text-danger">Error loading balance</div>
            ) : balance ? (
              <div>
                <div className="text-3xl font-bold mb-2" style={{ color: 'var(--color-accent)' }}>
                  {Number(formatEther(balance.value)).toFixed(4)} CELO
                </div>
                <div className="text-sm text-secondary">
                  ≈ ${(Number(formatEther(balance.value)) * 2000).toFixed(2)} USD
                </div>
              </div>
            ) : (
              <div className="text-secondary">No balance data available</div>
            )}
          </div>
        </div>

        {/* Username Management Card */}
        <UsernameManagement />
      </div>

      {/* Activity Statistics */}
      <div className="mb-8">
        <UserActivityStats stats={activityStats} />
      </div>

      {/* Activity Feed */}
      <div className="mb-8">
        <UserActivityFeed
          activities={activities}
          loading={activitiesLoading}
          error={activitiesError}
          onRefresh={refetchActivities}
        />
      </div>
    </div>
  );
};

export default Profile;

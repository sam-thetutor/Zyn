import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useContractAddress } from '../../hooks/useContractAddress';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';

const UsernameManagement: React.FC = () => {
  const { address } = useAccount();
  const { contractAddress, contractABI } = useContractAddress();
  
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [newUsername, setNewUsername] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Username change fee from contract constant
  const USERNAME_CHANGE_FEE = parseEther('0.00001'); // 0.00001 CELO

  // Read current username
  const { data: usernameData, refetch: refetchUsername } = useReadContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getUsername',
    args: [address],
    query: {
      enabled: !!address && !!contractAddress,
    },
  });

  // Read username change fee
  // const { data: changeFeeData } = useReadContract({
  //   address: contractAddress,
  //   abi: contractABI,
  //   functionName: 'usernameChangeFee',
  //   query: {
  //     enabled: !!contractAddress,
  //   },
  // });

  // Write contract for setting username
  const { data: setUsernameHash, writeContract: setUsername } = useWriteContract();

  // Write contract for changing username
  const { data: changeUsernameHash, writeContract: changeUsername } = useWriteContract();

  // Wait for set username transaction
  const { isLoading: isSetUsernameLoading, isSuccess: isSetUsernameSuccess } = useWaitForTransactionReceipt({
    hash: setUsernameHash,
  });

  // Wait for change username transaction
  const { isLoading: isChangeUsernameLoading, isSuccess: isChangeUsernameSuccess } = useWaitForTransactionReceipt({
    hash: changeUsernameHash,
  });

  useEffect(() => {
    if (usernameData) {
      setCurrentUsername(usernameData);
    }
  }, [usernameData]);

  useEffect(() => {
    if (isSetUsernameSuccess) {
      setSuccess('Username set successfully!');
      setNewUsername('');
      setIsEditing(false);
      refetchUsername();
      setTimeout(() => setSuccess(''), 3000);
    }
  }, [isSetUsernameSuccess, refetchUsername]);

  useEffect(() => {
    if (isChangeUsernameSuccess) {
      setSuccess('Username changed successfully!');
      setNewUsername('');
      setIsEditing(false);
      refetchUsername();
      setTimeout(() => setSuccess(''), 3000);
    }
  }, [isChangeUsernameSuccess, refetchUsername]);

  const handleSetUsername = async () => {
    if (!newUsername.trim()) {
      setError('Username cannot be empty');
      return;
    }

    if (newUsername.length < 3 || newUsername.length > 20) {
      setError('Username must be between 3 and 20 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      setUsername({
        address: contractAddress,
        abi: contractABI,
        functionName: 'setUsername',
        args: [newUsername],
      });
    } catch (err) {
      setError('Failed to set username');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeUsername = async () => {
    if (!newUsername.trim()) {
      setError('Username cannot be empty');
      return;
    }

    if (newUsername.length < 3 || newUsername.length > 20) {
      setError('Username must be between 3 and 20 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      setError('Username can only contain letters, numbers, and underscores');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      changeUsername({
        address: contractAddress as `0x${string}`,
        abi: contractABI as any,
        functionName: 'changeUsername',
        args: [newUsername],
        value: USERNAME_CHANGE_FEE,
      });
    } catch (err) {
      setError('Failed to change username');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (currentUsername) {
      handleChangeUsername();
    } else {
      handleSetUsername();
    }
  };

  const isLoadingAny = isLoading || isSetUsernameLoading || isChangeUsernameLoading;

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>
        Username Management
      </h2>
      
      <div className="space-y-4">
        {/* Current Username Display */}
        <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
          <span className="text-secondary">Current Username:</span>
          <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {currentUsername ? currentUsername : 'Not set'}
          </span>
        </div>

        {/* Username Change Fee Info */}
        {currentUsername && USERNAME_CHANGE_FEE && (
          <div className="text-sm text-secondary p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            💰 Username change fee: {formatEther(USERNAME_CHANGE_FEE)} CELO
          </div>
        )}

        {/* Username Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {currentUsername ? 'New Username' : 'Set Username'}
          </label>
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder={currentUsername ? 'Enter new username' : 'Enter username (3-20 characters)'}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
              focusRingColor: 'var(--color-accent)',
            }}
            maxLength={20}
          />
          <div className="text-xs text-secondary">
            Username must be 3-20 characters, letters, numbers, and underscores only
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoadingAny || !newUsername.trim()}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingAny ? (
            'Processing...'
          ) : currentUsername ? (
            `Change Username (${USERNAME_CHANGE_FEE ? formatEther(USERNAME_CHANGE_FEE) : '...'} CELO)`
          ) : (
            'Set Username (Free)'
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
            ❌ {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            ✅ {success}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsernameManagement;

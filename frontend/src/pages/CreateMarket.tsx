import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { usePredictionMarket } from '../hooks/usePredictionMarket';
import { useContractAddress } from '../hooks/useContractAddress';

const CreateMarket: React.FC = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  
  // Get contract information and network status
  const { 
    coreContractAddress, 
    coreContractABI, 
    isSupportedNetwork,
    currentNetwork 
  } = useContractAddress();
  
  // Get market creation fee and create market function
  const { marketCreationFee, createMarket: createMarketFunction } = usePredictionMarket();

  // Helper function to get current local time in readable format
  const getCurrentLocalTime = () => {
    const now = new Date();
    return {
      local: now.toLocaleString(),
      utc: now.toISOString(),
      timestamp: Math.floor(now.getTime() / 1000)
    };
  };

  // Debug network detection
  useEffect(() => {
    console.log('🔍 Network Detection Debug:');
    console.log('  - isConnected:', isConnected);
    console.log('  - coreContractAddress:', coreContractAddress);
    console.log('  - coreContractABI:', coreContractABI);
    console.log('  - isSupportedNetwork:', isSupportedNetwork);
    console.log('  - currentNetwork:', currentNetwork);
  }, [isConnected, coreContractAddress, coreContractABI, isSupportedNetwork, currentNetwork]);

  const [formData, setFormData] = useState({
    question: '',
    description: '',
    category: '',
    image: '',
    source: '',
    endTime: ''
  });
  
  // Set default end time to 10 minutes from now when component mounts
  useEffect(() => {
    const now = new Date();
    const defaultEndTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now
    // Format as local datetime string for the input
    const localDateTime = defaultEndTime.toLocaleString('sv-SE').slice(0, 16); // Use Swedish locale for YYYY-MM-DDTHH:mm format
    setFormData(prev => ({ ...prev, endTime: localDateTime }));
  }, []);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { writeContract, data: hash, error: writeError, isError: isWriteError } = useWriteContract();
  const { isLoading: isPending, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.question.trim()) {
      newErrors.question = 'Question is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (formData.endTime) {
      // Convert local time input to UTC for validation
      const localDateTime = new Date(formData.endTime);
      const utcTime = Math.floor(localDateTime.getTime() / 1000);
      const now = Math.floor(Date.now() / 1000);
      const minEndTime = now + 300; // 5 minutes minimum (contract requires 2 minutes, add buffer)
      
      console.log('Validation - Local input time:', formData.endTime);
      console.log('Validation - Local DateTime object:', localDateTime);
      console.log('Validation - UTC timestamp:', utcTime, '(', new Date(utcTime * 1000).toISOString(), ')');
      console.log('Validation - Current time:', getCurrentLocalTime());
      console.log('Validation - Minimum required:', minEndTime, '(', new Date(minEndTime * 1000).toISOString(), ')');
      console.log('Validation - Time difference:', utcTime - now, 'seconds');
      
      if (utcTime <= now) {
        newErrors.endTime = 'End time must be in the future';
      } else if (utcTime < minEndTime) {
        const minutesRequired = Math.ceil((minEndTime - now) / 60);
        newErrors.endTime = `End time must be at least 5 minutes in the future (currently ${minutesRequired} minutes required)`;
      }
    } else {
      newErrors.endTime = 'End time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Create Market button clicked!');
    console.log('�� Form state:', formData);
    console.log('🔗 Wallet connected:', isConnected);
    console.log('🌐 Supported network:', isSupportedNetwork);
    console.log('📋 Contract address:', coreContractAddress);
    console.log('📋 Contract ABI:', coreContractABI);
    
    if (!isConnected) {
      console.log('❌ Wallet not connected');
      setErrors({ general: 'Please connect your wallet first' });
      return;
    }

    if (!isSupportedNetwork) {
      console.log('❌ Network not supported');
      setErrors({ general: `Please connect to a supported network (Celo Alfajores or Base Mainnet). Current network: ${currentNetwork || 'Unknown'}` });
      return;
    }

    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    if (!coreContractAddress || !coreContractABI) {
      console.log('❌ Contract not found');
      setErrors({ general: 'Contract not found on current network' });
      return;
    }

    try {
      console.log('✅ All checks passed, proceeding with market creation...');
      setIsSubmitting(true);
      
      // Convert local time input to UTC for blockchain
      const localDateTime = new Date(formData.endTime);
      const endTime = Math.floor(localDateTime.getTime() / 1000);
      
      // Debug logging with both local and UTC times
      console.log('Form end time input (local):', formData.endTime);
      console.log('Local DateTime object:', localDateTime);
      console.log('Calculated UTC Unix timestamp:', endTime);
      console.log('UTC time string:', new Date(endTime * 1000).toISOString());
      console.log('Current time:', getCurrentLocalTime());
      console.log('Time difference (seconds):', endTime - Math.floor(Date.now() / 1000));
      
      // Double-check validation using UTC time
      const now = Math.floor(Date.now() / 1000);
      if (endTime <= now) {
        setErrors({ general: 'End time must be in the future. Please refresh and try again.' });
        return;
      }
      
      if (endTime < now + 300) { // 5 minutes minimum
        setErrors({ general: 'End time must be at least 5 minutes in the future. Please refresh and try again.' });
        return;
      }
      
      console.log('✅ Time validation passed - End time is valid for blockchain');

      // Use market creation fee instead of initial liquidity
      const marketCreationFeeAmount = parseEther(marketCreationFee || '0.001');
      
      console.log('💰 Market creation fee amount:', formatEther(marketCreationFeeAmount), 'CELO');
      
      // Check if user has sufficient balance for market creation fee
      if (balance && balance.value < marketCreationFeeAmount) {
        setErrors({ general: `Insufficient balance. You need at least ${formatEther(marketCreationFeeAmount)} CELO for market creation fee.` });
        return;
      }

      console.log('📝 Calling writeContract with:', {
        address: coreContractAddress,
        functionName: 'createMarket',
        args: [formData.question, formData.description, formData.category, formData.image, formData.source, BigInt(endTime)],
        value: marketCreationFeeAmount
      });

      writeContract({
        address: coreContractAddress,
        abi: coreContractABI,
        functionName: 'createMarket',
        args: [formData.question, formData.description, formData.category, formData.image, formData.source, BigInt(endTime)],
        value: marketCreationFeeAmount // Use the market creation fee
      });
      
      console.log('✅ writeContract called successfully');
    } catch (error) {
      console.error('Error creating market:', error);
      setErrors({ general: 'Failed to create market. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle successful transaction
  useEffect(() => {
    if (isSuccess) {
      // Redirect to markets page after successful creation
      setTimeout(() => {
        navigate('/markets');
      }, 2000);
    }
  }, [isSuccess, navigate]);

  // Monitor writeContract errors
  useEffect(() => {
    if (isWriteError && writeError) {
      console.error('❌ WriteContract error:', writeError);
      setErrors({ general: `Transaction failed: ${writeError.message || 'Unknown error'}` });
    }
  }, [isWriteError, writeError]);

  if (!isConnected) {
    return (
      <div className="container">
        <div className="text-center py-12">
          <h1 className="gradient-text mb-4">Create Prediction Market</h1>
          <p className="text-secondary mb-6">Please connect your wallet to create a new prediction market.</p>
          <button 
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header with proper spacing */}
      <div className="mt-8 mb-8">
        <h1 className="gradient-text text-4xl font-bold mb-4 slide-up">
          Create New Prediction Market
        </h1>
        <p className="text-secondary text-lg slide-up" style={{ animationDelay: '0.1s' }}>
          Start a new prediction market and let the community trade on the outcome
        </p>
      </div>

      {/* Network Warning */}
      {!isConnected && (
        <div className="card mb-6" style={{ backgroundColor: '#fffbeb', borderColor: '#f59e0b' }}>
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5" style={{ color: '#f59e0b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium" style={{ color: '#92400e' }}>Wallet Not Connected</h3>
              <p className="text-sm mt-1" style={{ color: '#92400e' }}>
                Please connect your wallet to create a new prediction market.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Network Status */}
      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Network Status</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span style={{ color: 'var(--color-text-secondary)' }}>Wallet Connected:</span>
            <span style={{ color: isConnected ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {isConnected ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--color-text-secondary)' }}>Network:</span>
            <span style={{ color: currentNetwork ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {currentNetwork || '❌ Not Supported'}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--color-text-secondary)' }}>Contract Address:</span>
            <span style={{ color: coreContractAddress ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {coreContractAddress ? `${coreContractAddress.slice(0, 6)}...${coreContractAddress.slice(-4)}` : '❌ Not Found'}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--color-text-secondary)' }}>ABI Available:</span>
            <span style={{ color: coreContractABI ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {coreContractABI ? '✅ Yes' : '❌ No'}
            </span>
          </div>
        </div>
      </div>

      {/* Balance and Fee Information */}
      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Your Balance</h3>
            <div className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
                              {balance ? `${Number(formatEther(balance.value)).toFixed(4)} CELO` : 'Loading...'}
            </div>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Market Creation Fee</h3>
            <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
              {marketCreationFee ? `${marketCreationFee} CELO` : 'Loading...'}
            </div>
            <div className="text-sm text-secondary mt-1">
              Fee to create a new prediction market. After creation, you can buy shares on any side.
            </div>
          </div>
        </div>
      )}

      {/* Creation Form */}
      {isConnected && (
        <form onSubmit={handleSubmit} className="space-y-6 mb-8">
          {/* Question Input */}
          <div className="card">
            <label htmlFor="question" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Question *
            </label>
            <input
              type="text"
              id="question"
              name="question"
              value={formData.question}
              onChange={handleInputChange}
              placeholder="What will happen?"
              className="input-field"
              style={{ 
                borderColor: errors.question ? 'var(--color-danger)' : 'var(--color-border-light)',
                backgroundColor: errors.question ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-bg-secondary)'
              }}
              maxLength={200}
            />
            {errors.question && (
              <p className="mt-1 text-sm" style={{ color: 'var(--color-danger)' }}>{errors.question}</p>
            )}
          </div>

          {/* Description Input */}
          <div className="card">
            <label htmlFor="description" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Provide more details about the prediction..."
              rows={3}
              className="input-field"
              style={{ 
                borderColor: errors.description ? 'var(--color-danger)' : 'var(--color-border-light)',
                backgroundColor: errors.description ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-bg-secondary)'
              }}
              maxLength={500}
            />
            {errors.description && (
              <p className="mt-1 text-sm" style={{ color: 'var(--color-danger)' }}>{errors.description}</p>
            )}
            <div className="text-xs text-secondary mt-1">
              {formData.description.length}/500 characters
            </div>
          </div>

          {/* Category and Image Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Input */}
            <div className="card mt-4">
              <label htmlFor="category" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="input-field"
                style={{ 
                  borderColor: errors.category ? 'var(--color-danger)' : 'var(--color-border-light)',
                  backgroundColor: errors.category ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-bg-secondary)'
                }}
              >
                <option value="">Select a category</option>
                <option value="politics">Politics</option>
                <option value="sports">Sports</option>
                <option value="entertainment">Entertainment</option>
                <option value="technology">Technology</option>
                <option value="business">Business</option>
                <option value="crypto">Cryptocurrency</option>
                <option value="other">Other</option>
              </select>
              {errors.category && (
                <p className="mt-1 text-sm" style={{ color: 'var(--color-danger)' }}>{errors.category}</p>
              )}
            </div>

            {/* Image URL Input */}
            <div className="card">
              <label htmlFor="image" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Image URL (Optional)
              </label>
              <input
                type="url"
                id="image"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
                className="input-field"
                style={{ 
                  borderColor: errors.image ? 'var(--color-danger)' : 'var(--color-border-light)',
                  backgroundColor: errors.image ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-bg-secondary)'
                }}
              />
              {errors.image && (
                <p className="mt-1 text-sm" style={{ color: 'var(--color-danger)' }}>{errors.image}</p>
              )}
            </div>
          </div>

          {/* Source Input */}
          <div className="card">
            <label htmlFor="source" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Source (Optional)
            </label>
            <input
              type="text"
              id="source"
              name="source"
              value={formData.source}
              onChange={handleInputChange}
              placeholder="e.g., Reuters, CNN, Official Statement..."
              className="input-field"
              style={{ 
                borderColor: errors.source ? 'var(--color-danger)' : 'var(--color-border-light)',
                backgroundColor: errors.source ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-bg-secondary)'
              }}
              maxLength={100}
            />
            {errors.source && (
              <p className="mt-1 text-sm" style={{ color: 'var(--color-danger)' }}>{errors.source}</p>
            )}
            <div className="text-xs text-secondary mt-1">
              Where did this information come from?
            </div>
          </div>

          {/* End Time Input */}
          <div className="card mt-4">
            <label htmlFor="endTime" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Market End Time *
            </label>
            
            {/* Current time display */}
            <div className="mb-2 p-2 rounded text-xs" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
              <div style={{ color: 'var(--color-text-secondary)' }}>
                🕐 <strong>Current time:</strong> {getCurrentLocalTime().local} (Local) / {getCurrentLocalTime().utc} (UTC)
              </div>
            </div>
            
            <input
              type="datetime-local"
              id="endTime"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              min={(() => {
                const now = new Date();
                const minTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now
                // Format as local datetime string for the input
                return minTime.toLocaleString('sv-SE').slice(0, 16);
              })()}
              className="input-field"
              style={{ 
                borderColor: errors.endTime ? 'var(--color-danger)' : 'var(--color-border-light)',
                backgroundColor: errors.endTime ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-bg-secondary)'
              }}
            />
            {errors.endTime && (
              <p className="mt-1 text-sm" style={{ color: 'var(--color-danger)' }}>{errors.endTime}</p>
            )}
           
          </div>

          

          {/* Error Display */}
          {errors.general && (
            <div className="card" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--color-danger)' }}>
              <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{errors.general}</p>
            </div>
          )}

          {/* WriteContract Error Display */}
          {isWriteError && writeError && (
            <div className="card" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--color-danger)' }}>
              <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
                <strong>Transaction Error:</strong> {writeError.message || 'Unknown error occurred'}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end mb-8 mt-4">
            <button
              type="submit"
              disabled={isSubmitting || isPending}
              className="btn-primary text-lg px-8 py-3"
              style={{ 
                opacity: (isSubmitting || isPending) ? 0.6 : 1,
                cursor: (isSubmitting || isPending) ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting || isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isSubmitting ? 'Creating Market...' : 'Transaction Pending...'}
                </>
              ) : (
                'Create Market'
              )}
            </button>
          </div>
        </form>
      )}

      {/* Success Message */}
      {isSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card max-w-md mx-4 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Market Created Successfully!</h2>
            <p className="text-secondary mb-6">
              Your prediction market has been created and is now live for trading.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/markets')}
                className="btn-primary flex-1"
              >
                View All Markets
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn-secondary flex-1"
              >
                Create Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateMarket;

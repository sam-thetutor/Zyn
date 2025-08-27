import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { usePredictionMarket } from '../hooks/usePredictionMarket';
import { CONTRACTS } from '../utils/constants';

const CreateMarket: React.FC = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const { creationFee, tradingFee } = usePredictionMarket();

  const [formData, setFormData] = useState({
    question: '',
    description: '',
    category: '',
    image: '',
    endTime: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isPending, isSuccess, isError } = useWaitForTransactionReceipt({ hash });

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
    }
    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }
    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    } else {
      const selectedTime = new Date(formData.endTime).getTime();
      const now = Date.now();
      if (selectedTime <= now) {
        newErrors.endTime = 'End time must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      setErrors({ general: 'Please connect your wallet first' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (!creationFee) {
      setErrors({ general: 'Unable to get creation fee' });
      return;
    }

    // Check if user has sufficient balance
    if (balance && creationFee) {
      let feeValue: bigint;
      
      try {
        if (typeof creationFee === 'string') {
          // Convert decimal string to wei
          if (creationFee.includes('.')) {
            const [whole, decimal] = creationFee.split('.');
            const paddedDecimal = decimal.padEnd(18, '0');
            feeValue = BigInt(whole + paddedDecimal);
          } else {
            feeValue = BigInt(creationFee);
          }
        } else {
          feeValue = creationFee;
        }
        
        if (balance.value < feeValue) {
          setErrors({ general: 'Insufficient balance for creation fee' });
          return;
        }
      } catch (error) {
        console.error('Error processing creation fee:', error);
        setErrors({ general: 'Error processing creation fee' });
        return;
      }
    }

    try {
      setIsSubmitting(true);
      
      const endTime = Math.floor(new Date(formData.endTime).getTime() / 1000);
      
      // Convert creation fee to wei for the transaction
      let feeValue: bigint;
      try {
        if (typeof creationFee === 'string') {
          if (creationFee.includes('.')) {
            const [whole, decimal] = creationFee.split('.');
            const paddedDecimal = decimal.padEnd(18, '0');
            feeValue = BigInt(whole + paddedDecimal);
          } else {
            feeValue = BigInt(creationFee);
          }
        } else {
          feeValue = creationFee;
        }
      } catch (error) {
        console.error('Error converting creation fee to wei:', error);
        setErrors({ general: 'Error processing creation fee' });
        return;
      }

      writeContract({
        address: CONTRACTS.PREDICTION_MARKET.address,
        abi: CONTRACTS.PREDICTION_MARKET.abi,
        functionName: 'createMarket',
        args: [formData.question, formData.description, formData.category, formData.image, BigInt(endTime)],
        value: feeValue
      });
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

  // Format fees for display
  const formatFee = (fee: bigint | string | undefined) => {
    if (!fee) return '0';
    
    try {
      let feeValue: bigint;
      
      if (typeof fee === 'string') {
        // If it's a decimal string like "0.00005", convert it properly
        if (fee.includes('.')) {
          const [whole, decimal] = fee.split('.');
          const paddedDecimal = decimal.padEnd(18, '0');
          feeValue = BigInt(whole + paddedDecimal);
        } else {
          feeValue = BigInt(fee);
        }
      } else {
        feeValue = fee;
      }
      
      return (Number(feeValue) / 1e18).toFixed(5);
    } catch (error) {
      console.warn('Error formatting fee:', error, 'fee:', fee);
      return '0';
    }
  };

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

      {/* Balance and Fee Information */}
      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Your Balance</h3>
            <div className="text-2xl font-bold" style={{ color: 'var(--color-accent)' }}>
              {balance ? `${Number(formatEther(balance.value)).toFixed(4)} ETH` : 'Loading...'}
            </div>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Market Creation Fee</h3>
            <div className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>
              {creationFee ? formatFee(creationFee) : 'Loading...'}
            </div>
            <div className="text-sm text-secondary mt-1">
              One-time fee to create a new market
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
              Market Question *
            </label>
            <input
              type="text"
              id="question"
              name="question"
              value={formData.question}
              onChange={handleInputChange}
              placeholder="e.g., Will Bitcoin reach $100,000 by the end of 2024?"
              className="input-field"
              style={{ 
                borderColor: errors.question ? 'var(--color-danger)' : 'var(--color-border-light)',
                backgroundColor: errors.question ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-bg-secondary)'
              }}
            />
            {errors.question && (
              <p className="mt-1 text-sm" style={{ color: 'var(--color-danger)' }}>{errors.question}</p>
            )}
          </div>

          {/* Description Input */}
          <div className="card">
            <label htmlFor="description" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Description and sources *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Provide additional context and details about the prediction market..."
              rows={4}
              className="input-field"
              style={{ 
                borderColor: errors.description ? 'var(--color-danger)' : 'var(--color-border-light)',
                backgroundColor: errors.description ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-bg-secondary)'
              }}
            />
            {errors.description && (
              <p className="mt-1 text-sm" style={{ color: 'var(--color-danger)' }}>{errors.description}</p>
            )}
          </div>

          {/* Category and Image Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category Input */}
            <div className="card">
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

          {/* End Time Input */}
          <div className="card">
            <label htmlFor="endTime" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Market End Time *
            </label>
            <input
              type="datetime-local"
              id="endTime"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              className="input-field"
              style={{ 
                borderColor: errors.endTime ? 'var(--color-danger)' : 'var(--color-border-light)',
                backgroundColor: errors.endTime ? 'rgba(239, 68, 68, 0.1)' : 'var(--color-bg-secondary)'
              }}
            />
            {errors.endTime && (
              <p className="mt-1 text-sm" style={{ color: 'var(--color-danger)' }}>{errors.endTime}</p>
            )}
            <div className="text-sm text-secondary mt-1">
              When will this prediction market resolve? Choose a future date and time.
            </div>
          </div>

          {/* Trading Fee Information */}
          <div className="card" style={{ backgroundColor: 'var(--color-bg-accent)', borderColor: 'var(--color-border-accent)' }}>
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Trading Fee</h3>
            <div className="text-xl font-bold" style={{ color: 'var(--color-secondary)' }}>
              {tradingFee ? formatFee(tradingFee) : 'Loading...'}
            </div>
            <div className="text-sm text-secondary mt-1">
              Fee charged on each trade (buy/sell) in this market
            </div>
          </div>

          {/* Error Display */}
          {errors.general && (
            <div className="card" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--color-danger)' }}>
              <p className="text-sm" style={{ color: 'var(--color-danger)' }}>{errors.general}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end mb-8">
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

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useBalance } from 'wagmi';
import { usePredictionMarket } from '../hooks/usePredictionMarket';
import { useEventsStore } from '../stores/eventsStore';
import { useNotificationHelpers } from '../hooks/useNotificationHelpers';
import { useMiniApp } from '../contexts/MiniAppContext';
import { useReferral } from '../contexts/ReferralContext';
import ReferralBanner from '../components/ReferralBanner';
import NotificationContainer from '../components/NotificationContainer';
import { parseEther, formatEther } from 'viem';

interface CreateMarketForm {
  question: string;
  description: string;
  category: string;
  image: string;
  source: string;
  endTime: string;
  endDate: string;
}

const CreateMarket: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, address } = useAccount();
  const { createMarket, isPending, isSuccess, hash } = usePredictionMarket();
  const { fetchAllLogs } = useEventsStore();
  const { isMiniApp, composeCast, triggerNotificationHaptic } = useMiniApp();
  const { referralCode, submitReferral } = useReferral();
  
  // Check user's Celo balance
  const { data: balance } = useBalance({
    address: address,
  });
  
  const { 
    notifyMarketCreated, 
    notifyMarketCreationFailed, 
    notifyMarketCreationStarted,
    notifyValidationError,
    // notifyTransactionSuccess
  } = useNotificationHelpers();

  const [formData, setFormData] = useState<CreateMarketForm>({
    question: '',
    description: '',
    category: '',
    image: '',
    source: '',
    endTime: '',
    endDate: ''
  });

  const [validationErrors, setValidationErrors] = useState<Partial<CreateMarketForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Predefined categories
  const categories = [
    'Politics',
    'Sports',
    'Technology',
    'Entertainment',
    'Finance',
    'Science',
    'Weather',
    'Other'
  ];

  // Set minimum date to today (for testing)
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  // Set minimum time to current time + 3 minutes (for testing)
  const now = new Date();
  now.setMinutes(now.getMinutes() + 3);
  const minTime = now.toTimeString().slice(0, 5);

  useEffect(() => {
    if (isSuccess && hash) {
      notifyMarketCreated(formData.question);
      
      // Refresh logs to include the new market (with delay to ensure transaction is processed)
      setTimeout(() => {
        fetchAllLogs();
      }, 5000);
      
      // Submit referral if user was referred
      if (referralCode) {
        submitReferral({
          type: 'market_creation',
          marketId: 'new', // Will be updated when we get the actual market ID
        }, hash);
      }
      
      // Trigger haptic feedback and compose cast for Mini App users
      if (isMiniApp) {
        triggerNotificationHaptic('success');
        composeCast(
          `I just created a prediction market: "${formData.question}" on @zynprotocol! 🚀`,
          [`https://zynp.vercel.app`]
        );
      }
      
      //wait for 4 seconds and redirect to markets page
      setTimeout(() => {
        navigate('/markets');
      }, 4000);
    }
  }, [isSuccess, hash, navigate, formData.question, notifyMarketCreated, isMiniApp, composeCast, triggerNotificationHaptic, referralCode, submitReferral, fetchAllLogs]);

  const validateForm = (): boolean => {
    const errors: Partial<CreateMarketForm> = {};

    if (!formData.question.trim()) {
      errors.question = 'Question is required';
    } else if (formData.question.length < 10) {
      errors.question = 'Question must be at least 10 characters long';
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      errors.description = 'Description must be at least 20 characters long';
    }

    if (!formData.category) {
      errors.category = 'Category is required';
    }

    if (!formData.endDate) {
      errors.endDate = 'End date is required';
    }

    if (!formData.endTime) {
      errors.endTime = 'End time is required';
    }

    // Check if end date/time is at least 3 minutes in the future (for testing)
    if (formData.endDate && formData.endTime) {
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      const now = new Date();
      const minTime = new Date(now.getTime() + 3 * 60 * 1000); // 3 minutes from now
      if (endDateTime <= minTime) {
        errors.endTime = 'End date and time must be at least 3 minutes in the future';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof CreateMarketForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      notifyValidationError('Please connect your wallet to create prediction markets.');
      return;
    }

    if (!validateForm()) {
      notifyValidationError('Please fill out all fields correctly before submitting.');
      return;
    }

    // Check if user has sufficient balance
    const marketCreationFee = parseEther('0.01'); // 0.01 CELO
    if (balance && balance.value < marketCreationFee) {
      notifyValidationError(`Insufficient balance. You need at least 0.01 CELO to create a market. Current balance: ${formatEther(balance.value)} CELO`);
      return;
    }

    try {
      setIsSubmitting(true);
      notifyMarketCreationStarted();

      // Combine date and time
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      const endTimestamp = Math.floor(endDateTime.getTime() / 1000);

      // Create market
      // Process source links - join multiple lines with separator, or use address as fallback
      const sourceLinks = formData.source.trim() 
        ? formData.source.split('\n').filter(link => link.trim()).join(' | ')
        : address || '0x0000000000000000000000000000000000000000';
      
      await createMarket(
        formData.question,
        formData.description,
        formData.category,
        formData.image || 'https://picsum.photos/400/300?random=1',
        sourceLinks, // source
        BigInt(endTimestamp),
        parseEther('0.01') //  0.01 CELO value - market creation fee
      );

      //wait for 4 seconds and redirect to markets page
      setTimeout(() => {
        navigate('/markets');
      }, 4000);

    } catch (err) {
      console.error('Error creating market:', err);
      
      // Provide more specific error messages based on the error type
      let errorMessage = 'Failed to create the prediction market. Please try again.';
      
      if (err instanceof Error) {
        if (err.message.includes('Invalid user address')) {
          errorMessage = 'Wallet connection issue. Please reconnect your wallet and try again.';
        } else if (err.message.includes('Failed to get valid wallet account')) {
          errorMessage = 'Unable to access your wallet account. Please check your wallet connection.';
        } else if (err.message.includes('Core contract not found')) {
          errorMessage = 'Network connection issue. Please check your network settings.';
        } else if (err.message.includes('Insufficient balance')) {
          errorMessage = 'Insufficient CELO balance. You need at least 0.01 CELO to create a market.';
        } else if (err.message.includes('User rejected')) {
          errorMessage = 'Transaction was cancelled. Please try again if you want to create the market.';
        } else if (err.message.includes('gas')) {
          errorMessage = 'Transaction failed due to gas issues. Please try again.';
        }
      }
      
      notifyMarketCreationFailed(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/markets');
  };

  if (!isConnected) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">
              Wallet Not Connected
            </h2>
            <p className="text-yellow-700">
              Please connect your wallet to create prediction markets.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      {/* Referral Banner */}
      <ReferralBanner />
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Create New Prediction Market</h1>
          <p className="text-lg text-gray-600 mb-4">
            Set up a new prediction market and let the community vote on the outcome
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Market Creation Fee: 0.01 CELO
          </div>
        </div>

        {/* Create Market Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Question */}
            <div>
              <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                Market Question *
              </label>
              <input
                type="text"
                id="question"
                value={formData.question}
                onChange={(e) => handleInputChange('question', e.target.value)}
                placeholder="e.g., Will Bitcoin reach $100,000 by the end of 2024?"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  validationErrors.question ? 'border-red-300' : 'border-gray-300'
                }`}
                maxLength={200}
              />
              {validationErrors.question && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.question}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {formData.question.length}/200 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Provide detailed context about the market question, including criteria for resolution..."
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  validationErrors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                maxLength={1000}
              />
              {validationErrors.description && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {formData.description.length}/1000 characters
              </p>
            </div>

            {/* Category and Image Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    validationErrors.category ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {validationErrors.category && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.category}</p>
                )}
              </div>

              {/* Image URL */}
              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  id="image"
                  value={formData.image}
                  onChange={(e) => handleInputChange('image', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Leave empty to use a default image
                </p>
              </div>
            </div>

            {/* Source Links */}
            <div>
              <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-2">
                Source Links (Optional)
              </label>
              <textarea
                id="source"
                value={formData.source}
                onChange={(e) => handleInputChange('source', e.target.value)}
                placeholder="https://example.com/news-article&#10;https://example.com/research-paper&#10;https://example.com/data-source"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter multiple source links, one per line. These can be news articles, research papers, or other relevant sources.
              </p>
            </div>

            {/* End Date and Time Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* End Date */}
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  min={minDate}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    validationErrors.endDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.endDate}</p>
                )}
              </div>

              {/* End Time */}
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <input
                  type="time"
                  id="endTime"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  min={formData.endDate === new Date().toISOString().split('T')[0] ? minTime : undefined}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    validationErrors.endTime ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.endTime && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.endTime}</p>
                )}
              </div>
            </div>

            {/* Market Preview */}
            {formData.question && (
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Market Preview</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Question:</span>
                    <p className="text-gray-900">{formData.question}</p>
                  </div>
                  {formData.description && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Description:</span>
                      <p className="text-gray-900">{formData.description}</p>
                    </div>
                  )}
                  {formData.category && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Category:</span>
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {formData.category}
                      </span>
                    </div>
                  )}
                  {formData.source && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Sources:</span>
                      <div className="mt-1 space-y-1">
                        {formData.source.split('\n').filter(link => link.trim()).map((link, index) => (
                          <div key={index} className="flex items-start">
                            <span className="text-gray-500 mr-2">•</span>
                            <a 
                              href={link.trim()} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline break-all text-sm"
                            >
                              {link.trim()}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {formData.endDate && formData.endTime && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Ends:</span>
                      <p className="text-gray-900">
                        {new Date(`${formData.endDate}T${formData.endTime}`).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Balance and Fee Information */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-amber-800">Market Creation Fee</h4>
                  <p className="text-sm text-amber-700">
                    Creating a prediction market costs <span className="font-semibold">0.01 CELO</span>. 
                    This fee helps maintain the platform and prevent spam.
                  </p>
                  {balance && (
                    <p className="text-sm text-amber-700 mt-1">
                      Your current balance: <span className="font-semibold">{formatEther(balance.value)} {balance.symbol}</span>
                      {balance.value < parseEther('0.01') && (
                        <span className="text-red-600 ml-2">⚠️ Insufficient balance</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || isSubmitting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isPending || isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </div>
                ) : (
                  'Create Market'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">How Prediction Markets Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <div className="font-medium mb-1">1. Create</div>
              <p>Set up a question with clear criteria for resolution</p>
            </div>
            <div>
              <div className="font-medium mb-1">2. Trade</div>
              <p>Users buy Yes/No shares based on their predictions</p>
            </div>
            <div>
              <div className="font-medium mb-1">3. Resolve</div>
              <p>Market resolves when the outcome is determined</p>
            </div>
          </div>
        </div>
      </div>
      <NotificationContainer />
    </div>
  );
};

export default CreateMarket;




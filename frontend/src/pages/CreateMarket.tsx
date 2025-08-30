import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { usePredictionMarket } from '../hooks/usePredictionMarket';
import { useNotificationHelpers } from '../hooks/useNotificationHelpers';
import NotificationContainer from '../components/NotificationContainer';
import { parseEther } from 'viem';

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
  const { createMarket, isPending, isSuccess, isError, hash } = usePredictionMarket();
  
  const { 
    notifyMarketCreated, 
    notifyMarketCreationFailed, 
    notifyMarketCreationStarted,
    notifyValidationError,
    notifyTransactionSuccess
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
  const [isCreating, setIsCreating] = useState(false);

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
      setIsCreating(false); // Hide loader
      notifyMarketCreated(formData.question);
      //wait for 4 seconds and redirect to markets page
      setTimeout(() => {
        navigate('/markets');
      }, 4000);
    }
  }, [isSuccess, hash, navigate, formData.question, notifyMarketCreated]);

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

    try {
      setIsSubmitting(true);
      notifyMarketCreationStarted();
      setIsCreating(true); // Start loader

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
        formData.image || 'https://via.placeholder.com/400x300?text=Market+Image',
        sourceLinks, // source
        BigInt(endTimestamp),
        parseEther('0.001') // value - market creation fee
      );

      //wait for 4 seconds and redirect to markets page
      setTimeout(() => {
        navigate('/markets');
      }, 4000);

    } catch (err) {
      console.error('Error creating market:', err);
      setIsCreating(false); // Hide loader on error
      notifyMarketCreationFailed('Failed to create the prediction market. Please try again or check your wallet connection.');
    } finally {
      setIsSubmitting(false);
      setIsCreating(false); // Stop loader
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

  // Show loader while market is being created
  if (isCreating) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Creating Market...
          </h2> 
          
          <p className="text-xs text-gray-400 mt-4">
            This may take a few moments. Please don't close this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Create New Prediction Market</h1>
          <p className="text-lg text-gray-600">
            Set up a new prediction market and let the community vote on the outcome
          </p>
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
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Market...
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




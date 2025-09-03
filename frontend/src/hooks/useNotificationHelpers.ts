import { useNotifications } from '../contexts/NotificationContext';

export const useNotificationHelpers = () => {
  const { showSuccess, showError, showInfo, showWarning } = useNotifications();

  // Market-related notifications
  const notifyMarketCreated = (question: string) => {
    showSuccess(
      'Market Created Successfully!',
      `Your prediction market "${question}" has been created and is now active.`
    );
  };

  const notifyMarketCreationFailed = (error?: string) => {
    showError(
      'Market Creation Failed',
      error || 'Failed to create the prediction market. Please try again.'
    );
  };

  const notifyMarketCreationStarted = () => {
    showInfo(
      'Creating Market',
      'Your prediction market is being created on the blockchain. This may take a few moments...'
    );
  };

  // Trading-related notifications
  const notifySharesBought = (outcome: boolean, amount: string, marketQuestion: string) => {
    showSuccess(
      'Shares Purchased Successfully!',
      `You've bought ${amount} ${outcome ? 'Yes' : 'No'} shares for "${marketQuestion}".`
    );
  };

  const notifySharesPurchaseFailed = (error?: string) => {
    showError(
      'Purchase Failed',
      error || 'Failed to purchase shares. Please try again or check your wallet balance.'
    );
  };

  const notifySharesPurchaseStarted = (outcome: boolean, amount: string) => {
    showInfo(
      'Processing Purchase',
      `Processing your purchase of ${amount} ${outcome ? 'Yes' : 'No'} shares...`
    );
  };

  // Wallet-related notifications
  const notifyWalletConnected = (address: string) => {
    showSuccess(
      'Wallet Connected',
      `Successfully connected wallet: ${address.slice(0, 6)}...${address.slice(-4)}`
    );
  };

  const notifyWalletDisconnected = () => {
    showInfo(
      'Wallet Disconnected',
      'Your wallet has been disconnected. Connect again to continue trading.'
    );
  };

  const notifyWalletConnectionFailed = (error?: string) => {
    showError(
      'Connection Failed',
      error || 'Failed to connect wallet. Please try again.'
    );
  };

  // Market resolution notifications
  const notifyMarketResolved = (question: string, outcome: boolean) => {
    showSuccess(
      'Market Resolved!',
      `The market "${question}" has been resolved with outcome: ${outcome ? 'Yes' : 'No'}`
    );
  };

  const notifyMarketEnded = (question: string) => {
    showWarning(
      'Market Ended',
      `The market "${question}" has ended and is no longer accepting trades.`
    );
  };

  // General transaction notifications
  const notifyTransactionPending = (action: string) => {
    showInfo(
      'Transaction Pending',
      `${action} transaction is being processed on the blockchain...`
    );
  };

  const notifyTransactionSuccess = (action: string, hash?: string) => {
    showSuccess(
      'Transaction Successful!',
      `${action} completed successfully.${hash ? ` Transaction: ${hash.slice(0, 10)}...${hash.slice(-8)}` : ''}`
    );
  };

  const notifyTransactionFailed = (action: string, error?: string) => {
    showError(
      'Transaction Failed',
      `${action} failed. ${error || 'Please try again.'}`
    );
  };

  // Validation notifications
  const notifyValidationError = (message: string) => {
    showError(
      'Validation Error',
      message
    );
  };

  const notifyInsufficientBalance = () => {
    showError(
      'Insufficient Balance',
      'You don\'t have enough CELO to complete this transaction. Please check your wallet balance.'
    );
  };

  const notifyNetworkError = () => {
    showError(
      'Network Error',
      'Unable to connect to the blockchain. Please check your internet connection and try again.'
    );
  };

  return {
    // Market notifications
    notifyMarketCreated,
    notifyMarketCreationFailed,
    notifyMarketCreationStarted,
    
    // Trading notifications
    notifySharesBought,
    notifySharesPurchaseFailed,
    notifySharesPurchaseStarted,
    
    // Wallet notifications
    notifyWalletConnected,
    notifyWalletDisconnected,
    notifyWalletConnectionFailed,
    
    // Market resolution notifications
    notifyMarketResolved,
    notifyMarketEnded,
    
    // Transaction notifications
    notifyTransactionPending,
    notifyTransactionSuccess,
    notifyTransactionFailed,
    
    // Validation notifications
    notifyValidationError,
    notifyInsufficientBalance,
    notifyNetworkError,
  };
};

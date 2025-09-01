import React, { useEffect, useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import type { Notification } from '../contexts/NotificationContext';

interface NotificationToastProps {
  notification: Notification;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification }) => {
  const { removeNotification } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Auto-dismiss functionality
  useEffect(() => {
    if (notification.duration) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification.duration]);

  // Animation entrance
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      removeNotification(notification.id);
    }, 300); // Match CSS transition duration
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return (
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'warning':
        return (
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        );
      case 'info':
        return (
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const getTypeStyles = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getProgressBarColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-400';
      case 'error':
        return 'bg-red-400';
      case 'warning':
        return 'bg-yellow-400';
      case 'info':
        return 'bg-blue-400';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div
      className={`transform transition-all duration-300 ease-in-out ${
        isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto border ${getTypeStyles()}`}>
        {/* Progress Bar */}
        {notification.duration && (
          <div className="h-1 bg-gray-200 rounded-t-lg overflow-hidden">
            <div
              className={`h-full ${getProgressBarColor()} transition-all duration-300 ease-linear`}
              style={{
                width: '100%',
                animation: `shrink ${notification.duration}ms linear forwards`
              }}
            />
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start">
            {getIcon()}
            
            <div className="ml-3 flex-1 pt-0.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{notification.title}</p>
                <button
                  onClick={handleDismiss}
                  className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <p className="mt-1 text-sm opacity-90">{notification.message}</p>
              
              {/* Action Button */}
              {notification.action && (
                <div className="mt-3">
                  <button
                    onClick={notification.action.onClick}
                    className="text-sm font-medium hover:underline transition-colors"
                  >
                    {notification.action.label}
                  </button>
                </div>
              )}
              
              {/* Timestamp */}
              <p className="mt-2 text-xs opacity-70">
                {notification.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animation for progress bar */}
      <style>
        {`
          @keyframes shrink {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}
      </style>
    </div>
  );
};

export default NotificationToast;

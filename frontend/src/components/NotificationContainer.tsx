import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationToast from './NotificationToast';

const NotificationContainer: React.FC = () => {
  // Add a safety check to ensure we're in the right context
  let context;
  try {
    context = useNotifications();
  } catch (error) {
    // Context not available yet, don't render
    return null;
  }

  const { notifications, clearAllNotifications } = context;

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {/* Header with clear all button */}
      {notifications.length > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow-md px-4 py-2 border border-gray-200">
          <span className="text-sm font-medium text-gray-700">
            {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={clearAllNotifications}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
      
      {/* Notifications stack */}
      <div className="space-y-3">
        {notifications.map((notification) => (
          <NotificationToast key={notification.id} notification={notification} />
        ))}
      </div>
    </div>
  );
};

export default NotificationContainer;

import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
      
      // Show reconnection message
      const event = new CustomEvent('showSuccessToast', {
        detail: { message: 'Connection restored! You\'re back online.' }
      });
      window.dispatchEvent(event);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
      
      // Show offline message
      const event = new CustomEvent('showErrorToast', {
        detail: { 
          message: 'You\'re offline. Some features may not work properly.',
          type: 'OFFLINE',
          severity: 'HIGH'
        }
      });
      window.dispatchEvent(event);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setShowOfflineMessage(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOfflineMessage) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-center">
          <WifiOff className="w-5 h-5 text-red-500 mr-3" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-red-800">
              You're offline
            </h4>
            <p className="text-xs text-red-600 mt-1">
              Check your internet connection. Some features may not work properly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;
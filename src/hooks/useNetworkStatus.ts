import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  effectiveType: string;
}

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionType: 'unknown',
    effectiveType: 'unknown'
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;

      const isSlowConnection = connection ? 
        (connection.effectiveType === 'slow-2g' || 
         connection.effectiveType === '2g' ||
         connection.downlink < 1) : false;

      setNetworkStatus({
        isOnline: navigator.onLine,
        isSlowConnection,
        connectionType: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || 'unknown'
      });
    };

    const handleOnline = () => {
      updateNetworkStatus();
      
      // Show reconnection toast
      const event = new CustomEvent('showSuccessToast', {
        detail: { message: 'Connection restored! You\'re back online.' }
      });
      window.dispatchEvent(event);
    };

    const handleOffline = () => {
      updateNetworkStatus();
      
      // Show offline toast
      const event = new CustomEvent('showErrorToast', {
        detail: { 
          message: 'You\'re offline. Some features may not work properly.',
          type: 'OFFLINE',
          severity: 'HIGH'
        }
      });
      window.dispatchEvent(event);
    };

    const handleConnectionChange = () => {
      updateNetworkStatus();
      
      const connection = (navigator as any).connection;
      if (connection && connection.effectiveType) {
        const isNowSlow = connection.effectiveType === 'slow-2g' || 
                         connection.effectiveType === '2g';
        
        if (isNowSlow && !networkStatus.isSlowConnection) {
          const event = new CustomEvent('showToast', {
            detail: {
              message: 'Slow connection detected. Some operations may take longer.',
              type: 'warning',
              duration: 3000
            }
          });
          window.dispatchEvent(event);
        }
      }
    };

    // Initial status update
    updateNetworkStatus();

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Connection change listener (if supported)
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [networkStatus.isSlowConnection]);

  const checkConnectivity = async (): Promise<boolean> => {
    try {
      // Try to fetch a small resource to test actual connectivity
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok;
    } catch {
      return false;
    }
  };

  return {
    ...networkStatus,
    checkConnectivity
  };
};
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import { connectionManager } from '../../utils/connectionManager';
import { Button } from '../ui/Button';

export const ConnectionStatus: React.FC = () => {
  const [connectionState, setConnectionState] = useState(connectionManager.getConnectionState());
  const [nextRetryTime, setNextRetryTime] = useState<Date | null>(null);
  const [timeUntilRetry, setTimeUntilRetry] = useState<number>(0);

  useEffect(() => {
    const handleStateChange = () => {
      setConnectionState(connectionManager.getConnectionState());
      setNextRetryTime(connectionManager.getNextRetryTime());
    };

    connectionManager.addListener(handleStateChange);
    handleStateChange(); // Initial state

    return () => {
      connectionManager.removeListener(handleStateChange);
    };
  }, []);

  // Update countdown timer
  useEffect(() => {
    if (!nextRetryTime) {
      setTimeUntilRetry(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const timeLeft = Math.max(0, nextRetryTime.getTime() - now);
      setTimeUntilRetry(Math.ceil(timeLeft / 1000));

      if (timeLeft <= 0) {
        setNextRetryTime(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextRetryTime]);

  const handleRetry = () => {
    connectionManager.reset();
    window.location.reload(); // Simple way to retry connection
  };

  // Don't show anything if connection is healthy
  if (connectionState.isHealthy || connectionState.consecutiveFailures < 5) {
    return null;
  }

  // Show different UI based on connection state
  const getStatusContent = () => {
    switch (connectionState.state) {
      case 'connecting':
        return {
          icon: <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />,
          title: 'Connecting to database...',
          message: 'Please wait while we establish connection.',
          color: 'bg-blue-50 border-blue-200 text-blue-800'
        };

      case 'error':
        if (connectionState.consecutiveFailures >= 3) {
          return {
            icon: <WifiOff className="w-4 h-4 text-red-500" />,
            title: 'Connection temporarily unavailable',
            message: timeUntilRetry > 0 
              ? `Automatic retry in ${timeUntilRetry}s. You can also try refreshing the page.`
              : 'You can try refreshing the page or check your internet connection.',
            color: 'bg-red-50 border-red-200 text-red-800'
          };
        } else {
          return {
            icon: <AlertCircle className="w-4 h-4 text-orange-500" />,
            title: 'Connection issues detected',
            message: `Retrying connection... (${connectionState.consecutiveFailures}/3 attempts)`,
            color: 'bg-orange-50 border-orange-200 text-orange-800'
          };
        }

      default:
        return {
          icon: <WifiOff className="w-4 h-4 text-gray-500" />,
          title: 'Not connected',
          message: 'Click retry to connect to the database.',
          color: 'bg-gray-50 border-gray-200 text-gray-800'
        };
    }
  };

  const status = getStatusContent();

  return (
    <div className="fixed bottom-4 right-4 max-w-sm z-50">
      <div className={`rounded-lg border p-4 shadow-lg ${status.color}`}>
        <div className="flex items-start space-x-3">
          {status.icon}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium">{status.title}</h4>
            <p className="text-xs mt-1 leading-relaxed">{status.message}</p>
            
            {connectionState.consecutiveFailures >= 3 && timeUntilRetry <= 0 && (
              <div className="mt-3">
                <Button
                  onClick={handleRetry}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry Connection
                </Button>
              </div>
            )}

            {timeUntilRetry > 0 && (
              <div className="flex items-center mt-2 text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Next retry: {timeUntilRetry}s
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
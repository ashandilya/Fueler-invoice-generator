import React, { useState, useEffect } from 'react';
import { AlertTriangle, Database, Wifi, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface DatabaseFallbackProps {
  onRetrySupabase: () => void;
  onSwitchToLocal: () => void;
  isRetrying: boolean;
}

export const DatabaseFallback: React.FC<DatabaseFallbackProps> = ({
  onRetrySupabase,
  onSwitchToLocal,
  isRetrying
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-white rounded-xl shadow-lg border border-orange-200 p-4 z-50">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900">
            Database Connection Issue
          </h4>
          <p className="text-xs text-gray-600 mt-1">
            Having trouble connecting to the cloud database.
          </p>
          
          {showDetails && (
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              <p>• Check your internet connection</p>
              <p>• Supabase server might be slow</p>
              <p>• Network firewall blocking requests</p>
            </div>
          )}
          
          <div className="flex flex-col space-y-2 mt-3">
            <div className="flex space-x-2">
              <Button
                onClick={onRetrySupabase}
                loading={isRetrying}
                disabled={isRetrying}
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Retry
              </Button>
              
              <Button
                onClick={onSwitchToLocal}
                size="sm"
                variant="primary"
                className="flex-1 text-xs"
              >
                <Database className="w-3 h-3 mr-1" />
                Use Local
              </Button>
            </div>
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-gray-500 hover:text-gray-700 text-left"
            >
              {showDetails ? 'Hide details' : 'Show details'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
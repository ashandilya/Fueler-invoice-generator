import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClients } from './useSupabaseClients';
import { useIndexedDBClients } from './useIndexedDBClients';
import { Client } from '../types/client';

export const useAdaptiveStorage = () => {
  const [useLocal, setUseLocal] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  const supabaseClients = useSupabaseClients();
  const indexedDBClients = useIndexedDBClients();

  // Monitor Supabase connection issues
  useEffect(() => {
    const handleSupabaseError = () => {
      setConnectionAttempts(prev => prev + 1);
      
      // After 2 failed attempts, show fallback option
      if (connectionAttempts >= 1) {
        setShowFallback(true);
      }
      
      // After 3 failed attempts, auto-switch to local
      if (connectionAttempts >= 2) {
        console.log('🔄 Auto-switching to local storage due to connection issues');
        setUseLocal(true);
        setShowFallback(false);
        
        // Show notification
        const event = new CustomEvent('showToast', {
          detail: {
            message: 'Switched to offline mode. Your data will be saved locally.',
            type: 'warning',
            duration: 5000
          }
        });
        window.dispatchEvent(event);
      }
    };

    // Listen for Supabase errors
    window.addEventListener('supabaseConnectionError', handleSupabaseError);
    
    return () => {
      window.removeEventListener('supabaseConnectionError', handleSupabaseError);
    };
  }, [connectionAttempts]);

  const retrySupabase = useCallback(async () => {
    setIsRetrying(true);
    setShowFallback(false);
    
    try {
      // Test connection
      await supabaseClients.refetch();
      
      // If successful, reset everything
      setUseLocal(false);
      setConnectionAttempts(0);
      
      const event = new CustomEvent('showToast', {
        detail: {
          message: 'Connected to cloud database successfully!',
          type: 'success'
        }
      });
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error('Retry failed:', error);
      setConnectionAttempts(prev => prev + 1);
      setShowFallback(true);
    } finally {
      setIsRetrying(false);
    }
  }, [supabaseClients]);

  const switchToLocal = useCallback(() => {
    setUseLocal(true);
    setShowFallback(false);
    setConnectionAttempts(0);
    
    const event = new CustomEvent('showToast', {
      detail: {
        message: 'Switched to offline mode. Data will be saved locally.',
        type: 'info'
      }
    });
    window.dispatchEvent(event);
  }, []);

  // Return the appropriate client based on current mode
  const activeClients = useLocal ? indexedDBClients : supabaseClients;

  return {
    ...activeClients,
    useLocal,
    showFallback,
    isRetrying,
    retrySupabase,
    switchToLocal,
  };
};
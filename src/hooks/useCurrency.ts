import { useState, useEffect, useCallback } from 'react';
import { CurrencyRates } from '../types/invoice';

const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest/USD';

export const useCurrency = () => {
  const [rates, setRates] = useState<CurrencyRates>({
    USD: 1,
    INR: 83.12, // Default fallback rate
    lastUpdated: new Date(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(EXCHANGE_RATE_API);
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      
      const data = await response.json();
      setRates({
        USD: 1,
        INR: data.rates.INR,
        lastUpdated: new Date(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rates');
      console.error('Currency fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const convertCurrency = useCallback((
    amount: number,
    from: 'USD' | 'INR',
    to: 'USD' | 'INR'
  ): number => {
    if (from === to) return amount;
    
    if (from === 'USD' && to === 'INR') {
      return amount * rates.INR;
    } else if (from === 'INR' && to === 'USD') {
      return amount / rates.INR;
    }
    
    return amount;
  }, [rates]);

  const formatCurrency = useCallback((
    amount: number,
    currency: 'USD' | 'INR'
  ): string => {
    const formatter = new Intl.NumberFormat(
      currency === 'USD' ? 'en-US' : 'en-IN',
      {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
    
    return formatter.format(amount);
  }, []);

  useEffect(() => {
    fetchRates();
    
    // Refresh rates every hour
    const interval = setInterval(fetchRates, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchRates]);

  return {
    rates,
    loading,
    error,
    convertCurrency,
    formatCurrency,
    refreshRates: fetchRates,
  };
};
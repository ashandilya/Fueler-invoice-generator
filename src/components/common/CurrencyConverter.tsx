import React from 'react';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';

interface CurrencyConverterProps {
  currentCurrency: 'USD' | 'INR';
  onCurrencyChange: (currency: 'USD' | 'INR') => void;
  amount: number;
  className?: string;
}

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  currentCurrency,
  onCurrencyChange,
  amount,
  className = '',
}) => {
  const { rates, loading, error, convertCurrency, formatCurrency, refreshRates } = useCurrency();
  
  const otherCurrency = currentCurrency === 'USD' ? 'INR' : 'USD';
  const convertedAmount = convertCurrency(amount, currentCurrency, otherCurrency);
  
  const exchangeRate = currentCurrency === 'USD' ? rates.INR : 1 / rates.INR;
  const rateDirection = rates.INR > 80 ? 'up' : 'down'; // Arbitrary threshold for demo

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Currency</h3>
        <button
          onClick={refreshRates}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          title="Refresh exchange rates"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Currency Selection */}
        <div className="flex space-x-2">
          <button
            onClick={() => onCurrencyChange('INR')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              currentCurrency === 'INR'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            INR (₹)
          </button>
          <button
            onClick={() => onCurrencyChange('USD')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              currentCurrency === 'USD'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            USD ($)
          </button>
        </div>

        {/* Exchange Rate Display */}
        <div className="bg-gray-50 rounded-md p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Exchange Rate:</span>
              {rateDirection === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
            </div>
            <span className="text-sm font-medium text-gray-900">
              1 USD = ₹{rates.INR.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Last updated: {rates.lastUpdated.toLocaleTimeString()}
          </p>
        </div>

        {/* Conversion Preview */}
        {amount > 0 && (
          <div className="bg-blue-50 rounded-md p-3">
            <div className="text-center">
              <p className="text-sm text-gray-600">Current Total</p>
              <p className="text-lg font-semibold text-blue-900">
                {formatCurrency(amount, currentCurrency)}
              </p>
              <div className="flex items-center justify-center space-x-2 mt-2">
                <span className="text-xs text-gray-500">≈</span>
                <span className="text-sm font-medium text-gray-700">
                  {formatCurrency(convertedAmount, otherCurrency)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
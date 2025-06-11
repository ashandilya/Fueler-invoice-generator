import React from 'react';
import { Download } from 'lucide-react';

interface HeaderProps {
  onSave: () => void;
  onDownload: () => void;
  onPrint: () => void;
  onReset: () => void;
  isSaving?: boolean;
  isDownloading?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onDownload,
  isDownloading = false,
}) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Fueler Invoice Generator</h1>
          </div>
          
          <div className="flex items-center">
            <button
              onClick={onDownload}
              disabled={isDownloading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#0ce3ee' }}
            >
              {isDownloading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {isDownloading ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
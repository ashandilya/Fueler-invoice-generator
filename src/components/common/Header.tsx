import React from 'react';
import { Download, Share, Save } from 'lucide-react';
import { Button } from '../ui/Button';

interface HeaderProps {
  onSave: () => void;
  onDownload: () => void;
  onShare: () => void;
  onPrint: () => void;
  onReset: () => void;
  isSaving?: boolean;
  isDownloading?: boolean;
  showSaveButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onSave,
  onDownload,
  onShare,
  isSaving = false,
  isDownloading = false,
  showSaveButton = false,
}) => {
  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-soft border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:h-18 space-y-3 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Invoicce.to</h1>
            <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">Free Invoice Generator</p>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
            {showSaveButton && (
              <Button
                onClick={onSave}
                loading={isSaving}
                disabled={isSaving}
                icon={Save}
                variant="primary"
                size="sm"
                className="min-w-[100px] sm:min-w-[140px] flex-1 sm:flex-none text-xs sm:text-sm"
              >
                {isSaving ? 'Saving...' : 'Save Invoice'}
              </Button>
            )}
            
            <Button
              onClick={onShare}
              variant="outline"
              icon={Share}
              size="sm"
              className="flex-1 sm:flex-none text-xs sm:text-sm"
            >
              Share
            </Button>
            
            <Button
              onClick={onDownload}
              loading={isDownloading}
              disabled={isDownloading}
              icon={Download}
              variant="secondary"
              size="sm"
              className="flex-1 sm:flex-none text-xs sm:text-sm"
            >
              {isDownloading ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
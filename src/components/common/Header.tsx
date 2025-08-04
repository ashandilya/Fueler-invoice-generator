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
        <div className="flex justify-between items-center h-18">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoicce.to</h1>
            <p className="text-xs text-gray-500 mt-0.5">Free Invoice Generator</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {showSaveButton && (
              <Button
                onClick={onSave}
                loading={isSaving}
                disabled={isSaving}
                icon={Save}
                variant="primary"
                size="md"
                className="min-w-[140px]"
              >
                {isSaving ? 'Saving...' : 'Save Invoice'}
              </Button>
            )}
            
            <Button
              onClick={onShare}
              variant="outline"
              icon={Share}
              size="md"
            >
              Share
            </Button>
            
            <Button
              onClick={onDownload}
              loading={isDownloading}
              disabled={isDownloading}
              icon={Download}
              variant="secondary"
              size="md"
            >
              {isDownloading ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
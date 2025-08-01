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
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Invoice</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            {showSaveButton && (
              <Button
                onClick={onSave}
                loading={isSaving}
                disabled={isSaving}
                icon={Save}
                variant="outline"
              >
                {isSaving ? 'Saving...' : 'Save Invoice'}
              </Button>
            )}
            
            <Button
              onClick={onShare}
              variant="outline"
              icon={Share}
            >
              Share Link
            </Button>
            
            <Button
              onClick={onDownload}
              loading={isDownloading}
              disabled={isDownloading}
              icon={Download}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {isDownloading ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
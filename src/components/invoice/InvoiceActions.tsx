import React from 'react';
import { Edit, Copy, Trash2, Download, Share } from 'lucide-react';
import { Invoice } from '../../types/invoice';
import { Button } from '../ui/Button';

interface InvoiceActionsProps {
  invoice: Invoice;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDownload: () => void;
  onShare: () => void;
}

export const InvoiceActions: React.FC<InvoiceActionsProps> = ({
  invoice,
  onEdit,
  onDuplicate,
  onDelete,
  onDownload,
  onShare,
}) => {
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-green-800">Invoice Saved Successfully!</h3>
          <p className="text-sm text-green-600 mt-1">Invoice #{invoice.invoiceNumber} has been saved. Form will clear in a moment...</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4">
        <Button
          onClick={onEdit}
          icon={Edit}
          variant="outline"
          size="md"
        >
          Edit
        </Button>
        
        <Button
          onClick={onDuplicate}
          icon={Copy}
          variant="outline"
          size="sm"
        >
          Duplicate
        </Button>
        
        <Button
          onClick={onDownload}
          icon={Download}
          variant="outline"
          size="sm"
        >
          Download PDF
        </Button>
        
        <Button
          onClick={onShare}
          icon={Share}
          variant="outline"
          size="sm"
        >
          Share Link
        </Button>
        
        <Button
          onClick={onDelete}
          icon={Trash2}
          variant="danger"
          size="sm"
        >
          Delete
        </Button>
      </div>
    </div>
  );
};
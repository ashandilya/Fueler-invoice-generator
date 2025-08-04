import React from 'react';
import { Edit, Copy, Trash2, Download, Share, FileText, Calendar, DollarSign } from 'lucide-react';
import { Invoice } from '../../types/invoice';
import { Button } from '../ui/Button';
import { formatDate } from '../../utils/invoiceUtils';
import { useCurrency } from '../../hooks/useCurrency';

interface PastInvoicesTabProps {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onDuplicate: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  onDownload: (invoice: Invoice) => void;
  onShare: (invoice: Invoice) => void;
}

export const PastInvoicesTab: React.FC<PastInvoicesTabProps> = ({
  invoices,
  onEdit,
  onDuplicate,
  onDelete,
  onDownload,
  onShare,
}) => {
  const { formatCurrency } = useCurrency();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
    // Save to global shared storage for sharing
    const globalInvoices = JSON.parse(localStorage.getItem('shared_invoices') || '[]');
    const globalExistingIndex = globalInvoices.findIndex(inv => inv.id === invoice.id);
    
    if (globalExistingIndex >= 0) {
      globalInvoices[globalExistingIndex] = invoice;
    } else {
      globalInvoices.push(invoice);
    }
    
    localStorage.setItem('shared_invoices', JSON.stringify(globalInvoices));
    
      case 'sent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (invoices.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Past Invoices</h2>
            <p className="text-sm text-gray-600 mt-1">View and manage your saved invoices</p>
          </div>
        </div>

        <div className="text-center py-16 bg-white rounded-2xl shadow-soft border border-gray-100">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No invoices yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Create your first invoice to see it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Past Invoices</h2>
          <p className="text-sm text-gray-600 mt-1">View and manage your saved invoices</p>
        </div>
        <div className="text-sm text-gray-500">
          {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {invoices.map((invoice) => (
          <div
            key={invoice.id}
            className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-soft-lg transition-all duration-200 shadow-soft"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Invoice Info */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    #{invoice.invoiceNumber}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 font-medium">Client</p>
                    <p className="text-gray-900">{invoice.client.name || 'No client'}</p>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <div>
                      <p className="text-gray-500 font-medium">Date</p>
                      <p className="text-gray-900">{formatDate(invoice.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                    <div>
                      <p className="text-gray-500 font-medium">Amount</p>
                      <p className="text-gray-900 font-semibold">{formatCurrency(invoice.total, invoice.currency)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 lg:flex-nowrap lg:space-x-2">
                <Button
                  onClick={() => onEdit(invoice)}
                  icon={Edit}
                  variant="outline"
                  size="sm"
                  className="flex-1 lg:flex-none"
                >
                  Edit
                </Button>
                
                <Button
                  onClick={() => onDuplicate(invoice)}
                  icon={Copy}
                  variant="outline"
                  size="sm"
                  className="flex-1 lg:flex-none"
                >
                  Duplicate
                </Button>
                
                <Button
                  onClick={() => onDownload(invoice)}
                  icon={Download}
                  variant="outline"
                  size="sm"
                  className="flex-1 lg:flex-none"
                >
                  PDF
                </Button>
                
                <Button
                  onClick={() => onShare(invoice)}
                  icon={Share}
                  variant="outline"
                  size="sm"
                  className="flex-1 lg:flex-none"
                >
                  Share
                </Button>
                
                <Button
                  onClick={() => onDelete(invoice.id)}
                  icon={Trash2}
                  variant="outline"
                  size="sm"
                  className="flex-1 lg:flex-none text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
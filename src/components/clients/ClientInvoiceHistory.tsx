import React from 'react';
import { FileText, Calendar, DollarSign } from 'lucide-react';
import { Invoice } from '../../types/invoice';
import { Client } from '../../types/client';
import { formatDate } from '../../utils/invoiceUtils';
import { useCurrency } from '../../hooks/useCurrency';

interface ClientInvoiceHistoryProps {
  client: Client;
  invoices: Invoice[];
  onInvoiceClick?: (invoice: Invoice) => void;
  className?: string;
}

export const ClientInvoiceHistory: React.FC<ClientInvoiceHistoryProps> = ({
  client,
  invoices,
  onInvoiceClick,
  className = '',
}) => {
  const { formatCurrency } = useCurrency();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (invoices.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Past Invoices for {client.name}
        </h3>
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h4 className="mt-2 text-sm font-medium text-gray-900">No invoices yet</h4>
          <p className="mt-1 text-sm text-gray-500">
            This is the first invoice for this client.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Past Invoices for {client.name}
      </h3>
      
      <div className="space-y-3">
        {invoices.map((invoice) => (
          <div
            key={invoice.id}
            onClick={() => onInvoiceClick?.(invoice)}
            className={`p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow ${
              onInvoiceClick ? 'cursor-pointer hover:border-blue-300' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    #{invoice.invoiceNumber}
                  </p>
                  <div className="flex items-center space-x-4 mt-1">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(invoice.date)}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <DollarSign className="h-3 w-3 mr-1" />
                      {formatCurrency(invoice.total, invoice.currency)}
                    </div>
                  </div>
                </div>
              </div>
              
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {invoices.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Invoices:</span>
            <span className="font-medium text-gray-900">{invoices.length}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">Total Amount:</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(
                invoices.reduce((sum, inv) => sum + inv.total, 0),
                invoices[0]?.currency || 'INR'
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
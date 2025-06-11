import React from 'react';
import { Invoice } from '../../types/invoice';
import { formatDate } from '../../utils/invoiceUtils';
import { useCurrency } from '../../hooks/useCurrency';

interface InvoicePreviewProps {
  invoice: Invoice;
  compact?: boolean;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ 
  invoice, 
  compact = false 
}) => {
  const { formatCurrency } = useCurrency();

  const containerClasses = compact 
    ? "bg-white rounded-lg shadow-sm border border-gray-200 p-4 max-h-[600px] overflow-y-auto"
    : "bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-3xl mx-auto";

  const headerClasses = compact ? "text-lg" : "text-2xl";
  const sectionSpacing = compact ? "space-y-3" : "space-y-6";

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex flex-col">
          {invoice.company.logo && (
            <img
              src={invoice.company.logo}
              alt="Company Logo"
              className={`object-contain mb-3 ${compact ? 'h-10 w-auto' : 'h-12 w-auto'}`}
            />
          )}
          <div className="text-black text-xs leading-tight">
            <div className="font-semibold">KiwisMedia Technologies Pvt. Ltd.</div>
            <div>CIN: U72900TR2019PTC013632</div>
            <div>PAN: AAHCK4516B</div>
          </div>
        </div>
        <div className="text-right">
          <h2 className={`font-bold text-gray-900 ${compact ? 'text-lg' : 'text-2xl'}`}>
            INVOICE
          </h2>
          <p className="text-sm text-gray-600">#{invoice.invoiceNumber}</p>
        </div>
      </div>

      {/* Company and Client Info + Invoice Details */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${sectionSpacing}`}>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">From:</h3>
          <div className="text-sm text-gray-600 space-y-1">
            {invoice.company.name && <p className="font-medium">{invoice.company.name}</p>}
            {invoice.company.contactName && <p>{invoice.company.contactName}</p>}
            {invoice.company.address && (
              <p className="whitespace-pre-line">{invoice.company.address}</p>
            )}
            {invoice.company.city && <p>{invoice.company.city}</p>}
            {invoice.company.state && <p>{invoice.company.state}</p>}
            {invoice.company.country && <p>{invoice.company.country}</p>}
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">To:</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium">{invoice.client.name || 'Client Name'}</p>
            {invoice.client.address && (
              <p className="whitespace-pre-line">{invoice.client.address}</p>
            )}
            {invoice.client.city && <p>{invoice.client.city}</p>}
            {invoice.client.state && <p>{invoice.client.state}</p>}
            {invoice.client.country && <p>{invoice.client.country}</p>}
            {invoice.client.gstin && <p>GSTIN: {invoice.client.gstin}</p>}
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-bold text-gray-700">Invoice Date</p>
            <p className="text-sm text-gray-900">{formatDate(invoice.date)}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-700">Due Date</p>
            <p className="text-sm text-gray-900">{formatDate(invoice.dueDate)}</p>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className={sectionSpacing}>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-2 font-semibold text-gray-700 w-16">Sr. no</th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">Description</th>
                <th className="text-right py-3 px-2 font-semibold text-gray-700 w-20">Qty</th>
                <th className="text-right py-3 px-2 font-semibold text-gray-700 w-24">Rate</th>
                <th className="text-right py-3 px-2 font-semibold text-gray-700 w-24">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No items added yet
                  </td>
                </tr>
              ) : (
                invoice.items.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-3 px-2 text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-900">
                      {item.description || 'Item description'}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-900 text-right">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-900 text-right">
                      {formatCurrency(item.rate, invoice.currency)}
                    </td>
                    <td className="py-3 px-2 text-sm text-gray-900 text-right font-medium">
                      {formatCurrency(item.amount, invoice.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals - Aligned with Amount column */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <tbody>
            <tr>
              <td className="w-16"></td>
              <td></td>
              <td className="w-20"></td>
              <td className="w-24"></td>
              <td className="w-24 py-2 px-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900 text-right">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Discount {invoice.discountType === 'percentage' ? `(${invoice.discount}%)` : ''}
                      </span>
                      <span className="text-gray-900 text-right">
                        -{formatCurrency(
                          invoice.discountType === 'percentage' 
                            ? (invoice.subtotal * invoice.discount) / 100 
                            : invoice.discount, 
                          invoice.currency
                        )}
                      </span>
                    </div>
                  )}
                  {invoice.taxRate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax ({invoice.taxRate}%)</span>
                      <span className="text-gray-900 text-right">{formatCurrency(invoice.tax, invoice.currency)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-2">
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900 text-right">{formatCurrency(invoice.total, invoice.currency)}</span>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Notes and Payment Terms with Signature */}
      {(invoice.notes || invoice.paymentTerms) && (
        <div className={`border-t border-gray-200 pt-6 ${sectionSpacing} relative`}>
          {invoice.notes && (
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Notes:</h4>
              <div className="text-sm text-gray-600 whitespace-pre-line break-words">{invoice.notes}</div>
            </div>
          )}
          
          {/* Payment Terms and Signature Container */}
          <div className="flex justify-between items-end">
            {/* Payment Terms */}
            {invoice.paymentTerms && (
              <div className="flex-1 pr-8">
                <h4 className="font-semibold text-gray-900 mb-2">Payment Terms:</h4>
                <div className="text-sm text-gray-600 whitespace-pre-line break-words">{invoice.paymentTerms}</div>
              </div>
            )}
            
            {/* Signature positioned in bottom-right */}
            {invoice.company.signature && (
              <div className="text-center flex-shrink-0">
                <img
                  src={invoice.company.signature}
                  alt="Signature"
                  className="h-12 w-auto mx-auto mb-2"
                />
                <p className="text-xs text-gray-600">Authorized Signature</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
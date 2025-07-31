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
    ? "bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 max-h-[500px] sm:max-h-[600px] overflow-y-auto"
    : "bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto";

  const headerClasses = compact ? "text-base sm:text-lg" : "text-xl sm:text-2xl";
  const sectionSpacing = compact ? "space-y-2 sm:space-y-3" : "space-y-4 sm:space-y-6";

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start mb-4 sm:mb-6 lg:mb-8 space-y-3 sm:space-y-0">
        <div className="flex flex-col">
          {invoice.company.logo && (
            <img
              src={invoice.company.logo}
              alt="Company Logo"
              className={`object-contain mb-2 sm:mb-3 ${compact ? 'h-8 sm:h-10 w-auto' : 'h-10 sm:h-12 w-auto'}`}
            />
          )}
          <div className="text-black text-xs sm:text-xs leading-tight">
            <div className="font-semibold">KiwisMedia Technologies Pvt. Ltd.</div>
            <div>CIN: U72900TR2019PTC013632</div>
            <div>PAN: AAHCK4516B</div>
          </div>
        </div>
        <div className="text-left sm:text-right w-full sm:w-auto">
          <h2 className={`font-bold text-gray-900 ${compact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl lg:text-2xl'}`}>
            INVOICE
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">#{invoice.invoiceNumber}</p>
        </div>
      </div>

      {/* Company and Client Info + Invoice Details */}
      <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-3'} gap-3 sm:gap-4 lg:gap-6 ${sectionSpacing}`}>
        <div>
          <h3 className={`font-semibold text-gray-900 mb-1 sm:mb-2 ${compact ? 'text-xs sm:text-sm' : 'text-sm'}`}>From:</h3>
          <div className={`text-gray-600 space-y-1 ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
            {invoice.company.name && <p className="font-medium">{invoice.company.name}</p>}
            {invoice.company.contactName && <p>{invoice.company.contactName}</p>}
            {invoice.company.address && (
              <p className="whitespace-pre-line break-words">{invoice.company.address}</p>
            )}
            {invoice.company.city && <p>{invoice.company.city}</p>}
            {invoice.company.state && <p>{invoice.company.state}</p>}
            {invoice.company.country && <p>{invoice.company.country}</p>}
          </div>
        </div>
        <div>
          <h3 className={`font-semibold text-gray-900 mb-1 sm:mb-2 ${compact ? 'text-xs sm:text-sm' : 'text-sm'}`}>To:</h3>
          <div className={`text-gray-600 space-y-1 ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
            <p className="font-medium">{invoice.client.name || 'Client Name'}</p>
            {invoice.client.address && (
              <p className="whitespace-pre-line break-words">{invoice.client.address}</p>
            )}
            {invoice.client.city && <p>{invoice.client.city}</p>}
            {invoice.client.state && <p>{invoice.client.state}</p>}
            {invoice.client.country && <p>{invoice.client.country}</p>}
            {invoice.client.gstin && <p>GSTIN: {invoice.client.gstin}</p>}
          </div>
        </div>
        <div className={`space-y-2 sm:space-y-3 ${compact ? 'sm:col-span-2 lg:col-span-1' : ''}`}>
          <div>
            <p className={`font-bold text-gray-700 ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>Invoice Date</p>
            <p className={`text-gray-900 ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>{formatDate(invoice.date)}</p>
          </div>
          <div>
            <p className={`font-bold text-gray-700 ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>Due Date</p>
            <p className={`text-gray-900 ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>{formatDate(invoice.dueDate)}</p>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className={sectionSpacing}>
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="min-w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className={`text-left py-2 sm:py-3 px-1 sm:px-2 font-semibold text-gray-700 w-12 sm:w-16 ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>Sr. no</th>
                <th className={`text-left py-2 sm:py-3 px-1 sm:px-2 font-semibold text-gray-700 ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>Description</th>
                <th className={`text-right py-2 sm:py-3 px-1 sm:px-2 font-semibold text-gray-700 w-16 sm:w-20 ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>Qty</th>
                <th className={`text-right py-2 sm:py-3 px-1 sm:px-2 font-semibold text-gray-700 w-20 sm:w-24 ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>Rate</th>
                <th className={`text-right py-2 sm:py-3 px-1 sm:px-2 font-semibold text-gray-700 w-20 sm:w-24 ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`text-center py-4 sm:py-8 text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
                    No items added yet
                  </td>
                </tr>
              ) : (
                invoice.items.map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className={`py-2 sm:py-3 px-1 sm:px-2 text-gray-900 ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                      {index + 1}
                    </td>
                    <td className={`py-2 sm:py-3 px-1 sm:px-2 text-gray-900 ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                      {item.description || 'Item description'}
                    </td>
                    <td className={`py-2 sm:py-3 px-1 sm:px-2 text-gray-900 text-right ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                      {item.quantity}
                    </td>
                    <td className={`py-2 sm:py-3 px-1 sm:px-2 text-gray-900 text-right ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                      {formatCurrency(item.rate, invoice.currency)}
                    </td>
                    <td className={`py-2 sm:py-3 px-1 sm:px-2 text-gray-900 text-right font-medium ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
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
      <div className="overflow-x-auto -mx-3 sm:mx-0">
        <table className="min-w-full">
          <tbody>
            <tr>
              <td className="w-12 sm:w-16"></td>
              <td></td>
              <td className="w-16 sm:w-20"></td>
              <td className="w-20 sm:w-24"></td>
              <td className="w-20 sm:w-24 py-2 px-1 sm:px-2">
                <div className="space-y-1 sm:space-y-2">
                  <div className={`flex justify-between ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900 text-right">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                  </div>
                  {invoice.discount > 0 && (
                    <div className={`flex justify-between ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
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
                    <div className={`flex justify-between ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>
                      <span className="text-gray-600">Tax ({invoice.taxRate}%)</span>
                      <span className="text-gray-900 text-right">{formatCurrency(invoice.tax, invoice.currency)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-1 sm:pt-2">
                    <div className={`flex justify-between font-semibold ${compact ? 'text-sm' : 'text-sm sm:text-base'}`}>
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
        <div className={`border-t border-gray-200 pt-3 sm:pt-4 lg:pt-6 ${sectionSpacing} relative`}>
          {invoice.notes && (
            <div className="mb-3 sm:mb-4">
              <h4 className={`font-semibold text-gray-900 mb-1 sm:mb-2 ${compact ? 'text-xs sm:text-sm' : 'text-sm'}`}>Notes:</h4>
              <div className={`text-gray-600 whitespace-pre-line break-words ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>{invoice.notes}</div>
            </div>
          )}
          
          {/* Payment Terms and Signature Container */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end space-y-3 sm:space-y-0">
            {/* Payment Terms */}
            {invoice.paymentTerms && (
              <div className="flex-1 sm:pr-6 lg:pr-8 w-full sm:w-auto">
                <h4 className={`font-semibold text-gray-900 mb-1 sm:mb-2 ${compact ? 'text-xs sm:text-sm' : 'text-sm'}`}>Payment Terms:</h4>
                <div className={`text-gray-600 whitespace-pre-line break-words ${compact ? 'text-xs' : 'text-xs sm:text-sm'}`}>{invoice.paymentTerms}</div>
              </div>
            )}
            
            {/* Signature positioned in bottom-right */}
            {invoice.company.signature && (
              <div className="text-center flex-shrink-0 self-center sm:self-end">
                <img
                  src={invoice.company.signature}
                  alt="Signature"
                  className={`w-auto mx-auto mb-1 sm:mb-2 ${compact ? 'h-8 sm:h-10' : 'h-10 sm:h-12'}`}
                />
                <p className={`text-gray-600 ${compact ? 'text-xs' : 'text-xs'}`}>Authorized Signature</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
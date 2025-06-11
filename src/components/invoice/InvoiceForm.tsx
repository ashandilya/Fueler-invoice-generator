import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Invoice, LineItem, CompanyInfo, ClientInfo } from '../../types/invoice';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { FileUpload } from '../common/FileUpload';
import { CurrencyConverter } from '../common/CurrencyConverter';
import { formatDateForInput, parseInputDate, calculateDueDate } from '../../utils/invoiceUtils';

interface InvoiceFormProps {
  invoice: Invoice;
  onUpdateCompany: (company: Partial<CompanyInfo>) => void;
  onUpdateClient: (client: Partial<ClientInfo>) => void;
  onAddLineItem: () => void;
  onUpdateLineItem: (id: string, updates: Partial<LineItem>) => void;
  onRemoveLineItem: (id: string) => void;
  onUpdateInvoice: (updates: Partial<Invoice>) => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  invoice,
  onUpdateCompany,
  onUpdateClient,
  onAddLineItem,
  onUpdateLineItem,
  onRemoveLineItem,
  onUpdateInvoice,
}) => {
  const handleCurrencyChange = (currency: 'USD' | 'INR') => {
    onUpdateInvoice({ currency });
  };

  const handleInvoiceDateChange = (dateString: string) => {
    const newDate = parseInputDate(dateString);
    const newDueDate = calculateDueDate(newDate, 30);
    onUpdateInvoice({ 
      date: newDate,
      dueDate: newDueDate
    });
  };

  return (
    <div className="space-y-6">
      {/* Invoice Details Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Invoice Details</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Invoice#"
              value={invoice.invoiceNumber}
              onChange={(e) => onUpdateInvoice({ invoiceNumber: e.target.value })}
              placeholder="FLB-25-XXXX"
            />
          </div>
          <div className="space-y-4">
            <Input
              label="Invoice Date"
              type="date"
              value={formatDateForInput(invoice.date)}
              onChange={(e) => handleInvoiceDateChange(e.target.value)}
            />
            <Input
              label="Due Date"
              type="date"
              value={formatDateForInput(invoice.dueDate)}
              onChange={(e) => onUpdateInvoice({ dueDate: parseInputDate(e.target.value) })}
            />
          </div>
        </div>
      </div>

      {/* Company Information Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Company Information</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Input
              label="Your Company"
              value={invoice.company.name}
              onChange={(e) => onUpdateCompany({ name: e.target.value })}
              placeholder="Your Company"
            />
            <Input
              label="Your Name"
              value={invoice.company.contactName || ''}
              onChange={(e) => onUpdateCompany({ contactName: e.target.value })}
              placeholder="Your Name"
            />
            <Textarea
              label="Company's Address"
              value={invoice.company.address}
              onChange={(e) => onUpdateCompany({ address: e.target.value })}
              placeholder="Company's Address"
              rows={4}
              className="resize-none"
            />
            <Input
              label="City"
              value={invoice.company.city || ''}
              onChange={(e) => onUpdateCompany({ city: e.target.value })}
              placeholder="City"
            />
            <Input
              label="State"
              value={invoice.company.state || ''}
              onChange={(e) => onUpdateCompany({ state: e.target.value })}
              placeholder="State"
            />
            <Input
              label="Country"
              value={invoice.company.country || 'India'}
              onChange={(e) => onUpdateCompany({ country: e.target.value })}
              placeholder="India"
            />
          </div>
          <div className="space-y-4">
            <FileUpload
              label="Company Logo"
              accept="image/*"
              onFileSelect={(file) => onUpdateCompany({ logo: file })}
              currentFile={invoice.company.logo}
              maxSize={2}
            />
            <FileUpload
              label="Digital Signature"
              accept="image/*"
              onFileSelect={(file) => onUpdateCompany({ signature: file })}
              currentFile={invoice.company.signature}
              maxSize={1}
            />
          </div>
        </div>
      </div>

      {/* Client Information Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Client Information</h2>
        <div className="space-y-4">
          <Input
            label="Your Client's Company"
            value={invoice.client.name}
            onChange={(e) => onUpdateClient({ name: e.target.value })}
            placeholder="Your Client's Company"
          />
          <Textarea
            label="Client's Address"
            value={invoice.client.address}
            onChange={(e) => onUpdateClient({ address: e.target.value })}
            placeholder="Client's Address"
            rows={3}
            className="resize-none"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="City"
              value={invoice.client.city || ''}
              onChange={(e) => onUpdateClient({ city: e.target.value })}
              placeholder="City"
            />
            <Input
              label="State"
              value={invoice.client.state || ''}
              onChange={(e) => onUpdateClient({ state: e.target.value })}
              placeholder="State"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Country"
              value={invoice.client.country || 'India'}
              onChange={(e) => onUpdateClient({ country: e.target.value })}
              placeholder="India"
            />
            <Input
              label="GSTIN"
              value={invoice.client.gstin || ''}
              onChange={(e) => onUpdateClient({ gstin: e.target.value })}
              placeholder="GSTIN Number"
            />
          </div>
        </div>
      </div>

      {/* Line Items Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
          <Button onClick={onAddLineItem} icon={Plus} size="sm">
            Add Item
          </Button>
        </div>
        
        <div className="space-y-4">
          {invoice.items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No items added yet. Click "Add Item\" to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 w-16">Sr. no</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Description</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 w-24">Qty</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 w-32">Rate</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 w-32">Amount</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-3 px-3 text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => onUpdateLineItem(item.id, { description: e.target.value })}
                          placeholder="Item description"
                          className="w-full border-0 p-0 focus:ring-0 text-sm"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => onUpdateLineItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                          min="0"
                          step="0.01"
                          className="w-full border-0 p-0 focus:ring-0 text-sm text-right"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => onUpdateLineItem(item.id, { rate: parseFloat(e.target.value) || 0 })}
                          min="0"
                          step="0.01"
                          className="w-full border-0 p-0 focus:ring-0 text-sm text-right"
                        />
                      </td>
                      <td className="py-3 px-3 text-right text-sm font-medium">
                        {invoice.currency === 'USD' ? '$' : '₹'}{item.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => onRemoveLineItem(item.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Tax and Discount Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Tax & Discount</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Tax Rate (%)"
                type="number"
                value={invoice.taxRate}
                onChange={(e) => onUpdateInvoice({ taxRate: parseFloat(e.target.value) || 0 })}
                min="0"
                max="100"
                step="0.01"
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Discount Type</label>
                <select
                  value={invoice.discountType}
                  onChange={(e) => onUpdateInvoice({ discountType: e.target.value as 'percentage' | 'fixed' })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
            </div>
            <Input
              label={`Discount ${invoice.discountType === 'percentage' ? '(%)' : `(${invoice.currency})`}`}
              type="number"
              value={invoice.discount}
              onChange={(e) => onUpdateInvoice({ discount: parseFloat(e.target.value) || 0 })}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <CurrencyConverter
          currentCurrency={invoice.currency}
          onCurrencyChange={handleCurrencyChange}
          amount={invoice.total}
        />
      </div>

      {/* Notes and Payment Terms */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Additional Information</h2>
        <div className="space-y-4">
          <Textarea
            label="Notes"
            value={invoice.notes}
            onChange={(e) => onUpdateInvoice({ notes: e.target.value })}
            placeholder="Additional notes or special instructions..."
            rows={4}
            className="resize-y min-h-[100px]"
          />
          <Textarea
            label="Payment Terms"
            value={invoice.paymentTerms}
            onChange={(e) => onUpdateInvoice({ paymentTerms: e.target.value })}
            placeholder="Payment due within 30 days..."
            rows={6}
            className="resize-y min-h-[150px]"
          />
        </div>
      </div>
    </div>
  );
};
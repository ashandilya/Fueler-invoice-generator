import React, { useState } from 'react';
import { Plus, Trash2, Calendar, User, Building, Mail, MapPin, Hash, Percent } from 'lucide-react';
import { Invoice, LineItem, CompanyInfo, ClientInfo } from '../../types/invoice';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { FileUpload } from '../common/FileUpload';
import { CurrencyConverter } from '../common/CurrencyConverter';
import { formatDateForInput } from '../../utils/invoiceUtils';

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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    
    if (!value.trim()) {
      newErrors[field] = 'This field is required';
    } else {
      delete newErrors[field];
    }
    
    setErrors(newErrors);
  };

  const handleRateChange = (id: string, value: string) => {
    // Allow empty string or valid numbers (including decimals)
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      const numericValue = value === '' ? 0 : parseFloat(value) || 0;
      onUpdateLineItem(id, { rate: numericValue });
    }
  };

  const handleQuantityChange = (id: string, value: string) => {
    // Allow empty string or valid positive integers
    if (value === '' || /^\d+$/.test(value)) {
      const numericValue = value === '' ? 1 : parseInt(value) || 1;
      onUpdateLineItem(id, { quantity: numericValue });
    }
  };

  return (
    <div className="space-y-8">
      {/* Company Information */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-soft border border-gray-100 p-4 sm:p-6 lg:p-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
          <Building className="w-5 h-5 mr-2 text-primary-600" />
          Company Information
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Input
              label="Company Name"
              value={invoice.company.name}
              onChange={(e) => onUpdateCompany({ name: e.target.value })}
              placeholder="Your Company Name"
              leftIcon={<Building className="w-4 h-4" />}
            />
            
            <Textarea
              label="Company Address"
              value={invoice.company.address}
              onChange={(e) => onUpdateCompany({ address: e.target.value })}
              placeholder="Enter your company address"
              rows={3}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Input
                label="City"
                value={invoice.company.city || ''}
                onChange={(e) => onUpdateCompany({ city: e.target.value })}
                placeholder="City"
                leftIcon={<MapPin className="w-4 h-4" />}
              />
              
              <Input
                label="State"
                value={invoice.company.state || ''}
                onChange={(e) => onUpdateCompany({ state: e.target.value })}
                placeholder="State"
              />
              
              <Input
                label="Country"
                value={invoice.company.country || ''}
                onChange={(e) => onUpdateCompany({ country: e.target.value })}
                placeholder="Country"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                value={invoice.company.email}
                onChange={(e) => onUpdateCompany({ email: e.target.value })}
                placeholder="company@example.com"
                leftIcon={<Mail className="w-4 h-4" />}
              />
              
              <Input
                label="Website"
                value={invoice.company.website}
                onChange={(e) => onUpdateCompany({ website: e.target.value })}
                placeholder="www.company.com"
              />
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
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

      {/* Invoice Details */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-soft border border-gray-100 p-4 sm:p-6 lg:p-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
          <Hash className="w-5 h-5 mr-2 text-primary-600" />
          Invoice Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <Input
            label="Invoice Number"
            value={invoice.invoiceNumber}
            onChange={(e) => onUpdateInvoice({ invoiceNumber: e.target.value })}
            placeholder="INV-001"
            leftIcon={<Hash className="w-4 h-4" />}
          />
          
          <Input
            label="Invoice Date"
            type="date"
            value={formatDateForInput(invoice.date)}
            onChange={(e) => onUpdateInvoice({ date: new Date(e.target.value) })}
            leftIcon={<Calendar className="w-4 h-4" />}
          />
          
          <Input
            label="Due Date"
            type="date"
            value={formatDateForInput(invoice.dueDate)}
            onChange={(e) => onUpdateInvoice({ dueDate: new Date(e.target.value) })}
            leftIcon={<Calendar className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Client Information */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-soft border border-gray-100 p-4 sm:p-6 lg:p-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center">
          <User className="w-5 h-5 mr-2 text-primary-600" />
          Bill To
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          <div className="space-y-4 sm:space-y-6">
            <Input
              label="Client Name *"
              value={invoice.client.name}
              onChange={(e) => {
                onUpdateClient({ name: e.target.value });
                validateField('clientName', e.target.value);
              }}
              placeholder="Client Name"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.clientName}
            />
            
            <Input
              label="Email"
              type="email"
              value={invoice.client.email}
              onChange={(e) => onUpdateClient({ email: e.target.value })}
              placeholder="client@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="GSTIN"
              value={invoice.client.gstin || ''}
              onChange={(e) => onUpdateClient({ gstin: e.target.value })}
              placeholder="Enter GSTIN number"
            />
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            <Textarea
              label="Billing Address *"
              value={invoice.client.address}
              onChange={(e) => {
                onUpdateClient({ address: e.target.value });
                validateField('clientAddress', e.target.value);
              }}
              placeholder="Enter client address"
              rows={3}
              error={errors.clientAddress}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Input
                label="City"
                value={invoice.client.city || ''}
                onChange={(e) => onUpdateClient({ city: e.target.value })}
                placeholder="City"
                leftIcon={<MapPin className="w-4 h-4" />}
              />
              
              <Input
                label="State"
                value={invoice.client.state || ''}
                onChange={(e) => onUpdateClient({ state: e.target.value })}
                placeholder="State"
              />
              
              <Input
                label="Country"
                value={invoice.client.country || ''}
                onChange={(e) => onUpdateClient({ country: e.target.value })}
                placeholder="Country"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-soft border border-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Items</h2>
          <Button onClick={onAddLineItem} variant="outline" size="sm" icon={Plus}>
            Add Item
          </Button>
        </div>

        <div className="space-y-4">
          {invoice.items.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-gray-500 bg-gray-50 rounded-xl">
              <p>No items added yet. Click "Add Item" to get started.</p>
              {errors.items && (
                <p className="text-sm text-red-600 mt-2">{errors.items}</p>
              )}
            </div>
          ) : (
            invoice.items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 p-4 sm:p-6 bg-gray-50 rounded-xl">
                <div className="lg:col-span-5 order-1">
                  <Input
                    label={index === 0 ? "Description *" : ""}
                    value={item.description}
                    onChange={(e) => {
                      onUpdateLineItem(item.id, { description: e.target.value });
                      validateField(`item-${item.id}-description`, e.target.value);
                    }}
                    placeholder="Item description"
                    error={errors[`item-${item.id}-description`]}
                  />
                </div>
                
                <div className="lg:col-span-2 order-2">
                  <Input
                    label={index === 0 ? "Quantity" : ""}
                    type="number"
                    value={item.quantity.toString()}
                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                    placeholder="1"
                    min="1"
                  />
                </div>
                
                <div className="lg:col-span-2 order-3">
                  <Input
                    label={index === 0 ? "Rate" : ""}
                    type="number"
                    value={item.rate.toString()}
                    onChange={(e) => handleRateChange(item.id, e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>
                
                <div className="lg:col-span-2 order-4">
                  <Input
                    label={index === 0 ? "Amount" : ""}
                    value={item.amount.toFixed(2)}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
                
                <div className="lg:col-span-1 flex items-end order-5">
                  <Button
                    onClick={() => onRemoveLineItem(item.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 w-full lg:w-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tax and Discount */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-soft border border-gray-100 p-4 sm:p-6 lg:p-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Tax & Discount</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Input
            label="Tax Rate (%)"
            type="number"
            value={invoice.taxRate.toString()}
            onChange={(e) => onUpdateInvoice({ taxRate: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            min="0"
            max="100"
            step="0.01"
            leftIcon={<Percent className="w-4 h-4" />}
          />
          
          <Input
            label="Discount"
            type="number"
            value={invoice.discount.toString()}
            onChange={(e) => onUpdateInvoice({ discount: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            min="0"
            step="0.01"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Type
            </label>
            <select
              value={invoice.discountType}
              onChange={(e) => onUpdateInvoice({ discountType: e.target.value as 'percentage' | 'fixed' })}
              className="block w-full px-4 py-3 rounded-xl border-gray-200 shadow-soft transition-all duration-200 focus:border-primary-500 focus:ring-primary-500 focus:shadow-soft-lg sm:text-sm placeholder:text-gray-400 bg-white"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>

          <CurrencyConverter
            currentCurrency={invoice.currency}
            onCurrencyChange={(currency) => onUpdateInvoice({ currency })}
            amount={invoice.total}
            className="sm:col-span-2 lg:col-span-1"
          />
        </div>
      </div>

      {/* Notes and Payment Terms */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-soft border border-gray-100 p-4 sm:p-6 lg:p-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Additional Information</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          <Textarea
            label="Notes"
            value={invoice.notes}
            onChange={(e) => onUpdateInvoice({ notes: e.target.value })}
            placeholder="Additional notes or terms..."
            rows={4}
          />
          
          <Textarea
            label="Payment Terms"
            value={invoice.paymentTerms}
            onChange={(e) => onUpdateInvoice({ paymentTerms: e.target.value })}
            placeholder="Payment terms and conditions..."
            rows={4}
          />
        </div>
      </div>
    </div>
  );
};
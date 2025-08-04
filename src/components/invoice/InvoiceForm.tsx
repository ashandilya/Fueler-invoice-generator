import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { FileUpload } from '../common/FileUpload';
import { CurrencyConverter } from '../common/CurrencyConverter';
import { Invoice, LineItem, Company, Client } from '../../types/invoice';

interface InvoiceFormProps {
  invoice: Invoice;
  onUpdateInvoice: (updates: Partial<Invoice>) => void;
  onUpdateCompany: (company: Company) => void;
  onUpdateClient: (client: Client) => void;
  onSaveInvoice: () => void;
  onDownloadPDF: () => void;
  isDownloading: boolean;
  selectedClient: Client | null;
  onSelectClient: (client: Client | null) => void;
  onShowSaveModal: (type: 'company' | 'client', data: any) => void;
}

export function InvoiceForm({
  invoice,
  onUpdateInvoice,
  onUpdateCompany,
  onUpdateClient,
  onSaveInvoice,
  onDownloadPDF,
  isDownloading,
  selectedClient,
  onSelectClient,
  onShowSaveModal
}: InvoiceFormProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>(invoice.lineItems || []);

  useEffect(() => {
    setLineItems(invoice.lineItems || []);
  }, [invoice.lineItems]);

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0
    };
    const updatedItems = [...lineItems, newItem];
    setLineItems(updatedItems);
    onUpdateInvoice({ lineItems: updatedItems });
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    const updatedItems = lineItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          // Ensure quantity and rate are valid numbers
          const quantity = Number(updatedItem.quantity) || 0;
          const rate = Number(updatedItem.rate) || 0;
          updatedItem.amount = quantity * rate;
          updatedItem.amount = Number(updatedItem.quantity) * Number(updatedItem.rate);
        }
        return updatedItem;
      }
      return item;
    });
    setLineItems(updatedItems);
    onUpdateInvoice({ lineItems: updatedItems });
  };

  const removeLineItem = (id: string) => {
    const updatedItems = lineItems.filter(item => item.id !== id);
    setLineItems(updatedItems);
    onUpdateInvoice({ lineItems: updatedItems });
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const handleCompanyLogoUpload = (url: string) => {
    onUpdateCompany({ ...invoice.company, logoUrl: url });
  };

  const handleSignatureUpload = (url: string) => {
    onUpdateCompany({ ...invoice.company, signatureUrl: url });
  };

  const handleSaveInvoice = () => {
    if (invoice.client.name && !selectedClient) {
      onShowSaveModal('client', invoice.client);
    } else {
      onSaveInvoice();
    }
  };

  const handleDownloadPDF = () => {
    if (invoice.client.name && !selectedClient) {
      onShowSaveModal('client', invoice.client);
    } else {
      onDownloadPDF();
    }
  };

  return (
    <div className="space-y-8">
      {/* Company Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Company Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Input
              label="Company Name"
              value={invoice.company.name}
              onChange={(e) => onUpdateCompany({ ...invoice.company, name: e.target.value })}
              placeholder="Your Company Name"
            />
            <Textarea
              label="Company Address"
              value={invoice.company.address}
              onChange={(e) => onUpdateCompany({ ...invoice.company, address: e.target.value })}
              placeholder="Company Address"
              rows={3}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                value={invoice.company.city || ''}
                onChange={(e) => onUpdateCompany({ ...invoice.company, city: e.target.value })}
                placeholder="City"
              />
              <Input
                label="State"
                value={invoice.company.state || ''}
                onChange={(e) => onUpdateCompany({ ...invoice.company, state: e.target.value })}
                placeholder="State"
              />
            </div>
          </div>
          <div className="space-y-4">
            <FileUpload
              label="Company Logo"
              onUpload={handleCompanyLogoUpload}
              currentUrl={invoice.company.logoUrl}
              accept="image/*"
            />
            <FileUpload
              label="Digital Signature"
              onUpload={handleSignatureUpload}
              currentUrl={invoice.company.signatureUrl}
              accept="image/*"
            />
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Invoice Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input
            label="Invoice Number"
            value={invoice.invoiceNumber}
            onChange={(e) => onUpdateInvoice({ invoiceNumber: e.target.value })}
            placeholder="INV-001"
          />
          <Input
            label="Date"
            type="date"
            value={invoice.date}
            onChange={(e) => onUpdateInvoice({ date: e.target.value })}
          />
          <Input
            label="Due Date"
            type="date"
            value={invoice.dueDate}
            onChange={(e) => onUpdateInvoice({ dueDate: e.target.value })}
          />
        </div>
      </div>

      {/* Client Information */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Bill To</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Input
              label="Client Name"
              value={invoice.client.name}
              onChange={(e) => onUpdateClient({ ...invoice.client, name: e.target.value })}
              placeholder="Client Name"
            />
            <Input
              label="Email"
              type="email"
              value={invoice.client.email}
              onChange={(e) => onUpdateClient({ ...invoice.client, email: e.target.value })}
              placeholder="client@example.com"
            />
          </div>
          <div className="space-y-4">
            <Textarea
              label="Billing Address"
              value={invoice.client.address}
              onChange={(e) => onUpdateClient({ ...invoice.client, address: e.target.value })}
              placeholder="Client Address"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Items</h2>
          <Button onClick={addLineItem} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        <div className="space-y-4">
          {lineItems.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="md:col-span-5">
                <Input
                  label={index === 0 ? "Description" : ""}
                  value={item.description}
                  onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                  placeholder="Item description"
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label={index === 0 ? "Quantity" : ""}
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                  placeholder="1"
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label={index === 0 ? "Rate" : ""}
                  type="number"
                  value={item.rate}
                  onChange={(e) => updateLineItem(item.id, 'rate', Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label={index === 0 ? "Amount" : ""}
                  value={item.amount?.toFixed(2) || '0.00'}
                  readOnly
                  className="bg-gray-100"
                />
              </div>
              <div className="md:col-span-1 flex items-end">
                <Button
                  onClick={() => removeLineItem(item.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {lineItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No items added yet. Click "Add Item" to get started.</p>
          </div>
        )}
      </div>

      {/* Total and Currency */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CurrencyConverter
            amount={calculateTotal()}
            fromCurrency={invoice.currency}
            onCurrencyChange={(currency) => onUpdateInvoice({ currency })}
          />
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-3xl font-bold text-gray-900">
              {invoice.currency} {calculateTotal().toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Notes and Payment Terms */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={handleSaveInvoice}
          className="flex-1"
          size="lg"
        >
          Save Invoice
        </Button>
        <Button
          onClick={handleDownloadPDF}
          variant="outline"
          className="flex-1"
          size="lg"
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
              <Upload className="w-4 h-4 mr-2 animate-spin" />
              Generating PDF...
            </>
          ) : (
            'Download PDF'
          )}
        </Button>
      </div>
    </div>
  );
}
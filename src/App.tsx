import React, { useState } from 'react';
import { Header } from './components/common/Header';
import { InvoiceForm } from './components/invoice/InvoiceForm';
import { InvoicePreview } from './components/invoice/InvoicePreview';
import { useInvoice } from './hooks/useInvoice';
import { useLocalStorage } from './hooks/useLocalStorage';
import { generateInvoicePDF } from './utils/pdfGenerator';

function App() {
  const {
    invoice,
    updateCompanyInfo,
    updateClientInfo,
    addLineItem,
    updateLineItem,
    removeLineItem,
    updateInvoiceDetails,
    resetInvoice,
  } = useInvoice();

  const [savedInvoices, setSavedInvoices] = useLocalStorage('invoices', []);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedInvoices = [...savedInvoices];
      const existingIndex = updatedInvoices.findIndex(inv => inv.id === invoice.id);
      
      if (existingIndex >= 0) {
        updatedInvoices[existingIndex] = invoice;
      } else {
        updatedInvoices.push(invoice);
      }
      
      setSavedInvoices(updatedInvoices);
      
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error saving invoice:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await generateInvoicePDF(invoice);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the invoice? All unsaved changes will be lost.')) {
      resetInvoice();
      setActiveTab('form');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onSave={handleSave}
        onDownload={handleDownload}
        onPrint={handlePrint}
        onReset={handleReset}
        isSaving={isSaving}
        isDownloading={isDownloading}
      />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('form')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'form'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Invoice Details
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'preview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Preview
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {activeTab === 'form' ? (
            <>
              <div className="lg:col-span-2">
                <InvoiceForm
                  invoice={invoice}
                  onUpdateCompany={updateCompanyInfo}
                  onUpdateClient={updateClientInfo}
                  onAddLineItem={addLineItem}
                  onUpdateLineItem={updateLineItem}
                  onRemoveLineItem={removeLineItem}
                  onUpdateInvoice={updateInvoiceDetails}
                />
              </div>
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  <InvoicePreview invoice={invoice} compact />
                </div>
              </div>
            </>
          ) : (
            <div className="lg:col-span-3">
              <InvoicePreview invoice={invoice} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
import React, { useState } from 'react';
import { Header } from './components/common/Header';
import { InvoiceForm } from './components/invoice/InvoiceForm';
import { InvoicePreview } from './components/invoice/InvoicePreview';
import { VendorList } from './components/vendors/VendorList';
import { VendorSelector } from './components/vendors/VendorSelector';
import { VendorInvoiceHistory } from './components/vendors/VendorInvoiceHistory';
import { useInvoice } from './hooks/useInvoice';
import { useVendors } from './hooks/useVendors';
import { useVendorInvoices } from './hooks/useVendorInvoices';
import { useLocalStorage } from './hooks/useLocalStorage';
import { generateInvoicePDF } from './utils/pdfGenerator';
import { Vendor } from './types/vendor';

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
  const [activeTab, setActiveTab] = useState<'form' | 'preview' | 'vendors'>('form');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const { vendors, loading: vendorsLoading, addVendor, updateVendor, deleteVendor } = useVendors();
  const { addVendorInvoice, getVendorInvoiceDetails } = useVendorInvoices();

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
      
      // If a vendor is selected, associate this invoice with the vendor
      if (selectedVendor) {
        addVendorInvoice(selectedVendor.id, invoice);
      }
      
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
      setSelectedVendor(null);
      setActiveTab('form');
    }
  };

  const handleVendorSelect = (vendor: Vendor | null) => {
    setSelectedVendor(vendor);
    if (vendor) {
      // Auto-fill client information from vendor
      updateClientInfo({
        name: vendor.businessName,
        email: vendor.email,
        city: vendor.city || '',
        state: vendor.state || '',
        country: vendor.country || 'India',
        address: vendor.billingAddress,
        gstin: vendor.gstin || '',
      });
    }
  };

  // Get past invoices for selected vendor
  const vendorInvoices = selectedVendor ? getVendorInvoiceDetails(selectedVendor.id) : [];
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
              <button
                onClick={() => setActiveTab('vendors')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'vendors'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Vendors
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'vendors' ? (
          <VendorList
            vendors={vendors}
            onAddVendor={addVendor}
            onUpdateVendor={updateVendor}
            onDeleteVendor={deleteVendor}
            loading={vendorsLoading}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {activeTab === 'form' ? (
              <>
                {/* Left sidebar for vendor history */}
                {selectedVendor && vendorInvoices.length > 0 && (
                  <div className="lg:col-span-1">
                    <div className="sticky top-8">
                      <VendorInvoiceHistory
                        vendor={selectedVendor}
                        invoices={vendorInvoices}
                      />
                    </div>
                  </div>
                )}
                
                {/* Main form area */}
                <div className={selectedVendor && vendorInvoices.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
                  <div className="space-y-6">
                    {/* Vendor Selector */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <VendorSelector
                        vendors={vendors}
                        selectedVendor={selectedVendor}
                        onVendorSelect={handleVendorSelect}
                      />
                    </div>
                    
                    {/* Invoice Form */}
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
                </div>
                
                {/* Right sidebar for preview */}
                <div className="lg:col-span-1">
                  <div className="sticky top-8">
                    <InvoicePreview invoice={invoice} compact />
                  </div>
                </div>
              </>
            ) : (
              <div className="lg:col-span-4">
                <InvoicePreview invoice={invoice} />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
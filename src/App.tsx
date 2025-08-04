import React, { useState } from 'react';
import { InlineLoginOverlay } from './components/auth/InlineLoginOverlay';
import { useAuth } from './hooks/useAuth';
import { OnboardingForm } from './components/auth/OnboardingForm';
import { Header } from './components/common/Header';
import { InvoiceForm } from './components/invoice/InvoiceForm';
import { InvoicePreview } from './components/invoice/InvoicePreview';
import { ClientList } from './components/clients/ClientList';
import { ClientSelector } from './components/clients/ClientSelector';
import { ClientInvoiceHistory } from './components/clients/ClientInvoiceHistory';
import { PastInvoicesTab } from './components/invoice/PastInvoicesTab';
import { CompanyProfileForm } from './components/profile/CompanyProfileForm';
import { SaveConfirmationModal } from './components/common/SaveConfirmationModal';
import { InvoiceActions } from './components/invoice/InvoiceActions';
import { useInvoice } from './hooks/useInvoice';
import { useSupabaseClients } from './hooks/useSupabaseClients';
import { useClientInvoices } from './hooks/useClientInvoices';
import { useCompanyProfile } from './hooks/useCompanyProfile';
import { useLocalStorage } from './hooks/useLocalStorage';
import { generateInvoicePDF } from './utils/pdfGenerator';
import { Client } from './types/client';

function App() {
  return (
    <AppContent />
  );
}

function AppContent() {
  const { user, loading, needsOnboarding, completeOnboarding } = useAuth();
  const { profile } = useCompanyProfile();
  const {
    invoice,
    updateCompanyInfo,
    updateClientInfo,
    addLineItem,
    updateLineItem,
    removeLineItem,
    updateInvoiceDetails,
    resetInvoice,
  } = useInvoice(profile);

  const [savedInvoices, setSavedInvoices] = useLocalStorage('invoices', []);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'preview' | 'clients' | 'invoices' | 'profile'>('form');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<{ type: 'company' | 'client'; data: any } | null>(null);
  const [showInvoiceActions, setShowInvoiceActions] = useState(false);

  const { clients, loading: clientsLoading, addClient, updateClient, deleteClient } = useSupabaseClients();
  const { addClientInvoice, getClientInvoiceDetails } = useClientInvoices();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <OnboardingForm onComplete={completeOnboarding} />;
  }

  const validateInvoiceForm = (): boolean => {
    return invoice.client.name.trim() !== '' && 
           invoice.client.address.trim() !== '' && 
           invoice.items.length > 0 &&
           invoice.items.every(item => item.description.trim() !== '');
  };

  const handleSave = async () => {
    // Enhanced validation to prevent saving blank invoices
    if (!invoice.client.name.trim()) {
      alert('Please enter a client name before saving.');
      setActiveTab('form');
      return;
    }
    
    if (!invoice.client.address.trim()) {
      alert('Please enter a client address before saving.');
      setActiveTab('form');
      return;
    }
    
    if (invoice.items.length === 0) {
      alert('Please add at least one item before saving.');
      setActiveTab('form');
      return;
    }
    
    if (invoice.items.some(item => !item.description.trim())) {
      alert('Please fill in descriptions for all items before saving.');
      setActiveTab('form');
      return;
    }
    
    if (invoice.total <= 0) {
      alert('Invoice total must be greater than zero.');
      setActiveTab('form');
      return;
    }
    
    // Show save confirmation modal for client info if client data exists and not already a saved client
    if ((invoice.client.name || invoice.client.address) && !selectedClient) {
      setPendingSaveData({ type: 'client', data: invoice.client });
      setShowSaveModal(true);
      return;
    }
    
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
      
      // Also save to global localStorage for sharing
      const globalInvoices = JSON.parse(localStorage.getItem('shared_invoices') || '[]');
      const globalExistingIndex = globalInvoices.findIndex(inv => inv.id === invoice.id);
      
      if (globalExistingIndex >= 0) {
        globalInvoices[globalExistingIndex] = invoice;
      } else {
        globalInvoices.push(invoice);
      }
      
      localStorage.setItem('shared_invoices', JSON.stringify(globalInvoices));
      
      // If a client is selected, associate this invoice with the client
      if (selectedClient) {
        addClientInvoice(selectedClient.id, invoice);
      }
      
      setShowInvoiceActions(true);
      
      // Clear the form after successful save
      setTimeout(() => {
        resetInvoice();
        setSelectedClient(null);
        setShowInvoiceActions(false);
      }, 3000); // Show success message for 3 seconds, then clear
      
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error saving invoice:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    // Validate before sharing
    if (!invoice.client.name.trim() || !invoice.client.address.trim() || invoice.items.length === 0) {
      alert('Please complete the invoice before sharing (client name, address, and at least one item required).');
      setActiveTab('form');
      return;
    }
    
    // Save to both local and global storage for sharing
    const updatedInvoices = [...savedInvoices];
    const existingIndex = updatedInvoices.findIndex(inv => inv.id === invoice.id);
    
    if (existingIndex >= 0) {
      updatedInvoices[existingIndex] = invoice;
    } else {
      updatedInvoices.push(invoice);
    }
    
    setSavedInvoices(updatedInvoices);
    
    // Save to global shared storage
    const globalInvoices = JSON.parse(localStorage.getItem('shared_invoices') || '[]');
    const globalExistingIndex = globalInvoices.findIndex(inv => inv.id === invoice.id);
    
    if (globalExistingIndex >= 0) {
      globalInvoices[globalExistingIndex] = invoice;
    } else {
      globalInvoices.push(invoice);
    }
    
    localStorage.setItem('shared_invoices', JSON.stringify(globalInvoices));
    
    const shareUrl = `${window.location.origin}/invoice/${invoice.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Invoice link copied to clipboard!');
    }).catch(() => {
      prompt('Copy this link to share your invoice:', shareUrl);
    });
  };

  const handleDownload = async () => {
    // Enhanced validation for download
    if (!invoice.client.name.trim()) {
      alert('Please enter a client name before downloading.');
      setActiveTab('form');
      return;
    }
    
    if (!invoice.client.address.trim()) {
      alert('Please enter a client address before downloading.');
      setActiveTab('form');
      return;
    }
    
    if (invoice.items.length === 0) {
      alert('Please add at least one item before downloading.');
      setActiveTab('form');
      return;
    }
    
    if (invoice.items.some(item => !item.description.trim())) {
      alert('Please fill in descriptions for all items before downloading.');
      setActiveTab('form');
      return;
    }
    
    // Show save confirmation modal for client info if client data exists and not already a saved client
    if ((invoice.client.name || invoice.client.address) && !selectedClient) {
      setPendingSaveData({ type: 'client', data: invoice.client });
      setShowSaveModal(true);
      return;
    }
    
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
      setSelectedClient(null);
      setActiveTab('form');
      setShowInvoiceActions(false);
    }
  };

  const handleClientSelect = (client: Client | null) => {
    setSelectedClient(client);
    if (client) {
      // Auto-fill client information from saved client
      updateClientInfo({
        name: client.businessName,
        email: client.email,
        city: client.city || '',
        state: client.state || '',
        country: client.country || 'India',
        address: client.billingAddress,
        gstin: client.gstin || '',
      });
    }
  };

  const handleCompanyInfoChange = (companyInfo: any) => {
    updateCompanyInfo(companyInfo);
    if (companyInfo.name || companyInfo.address) {
      setPendingSaveData({ type: 'company', data: companyInfo });
      setShowSaveModal(true);
    }
  };

  const handleClientInfoChange = (clientInfo: any) => {
    updateClientInfo(clientInfo);
    if (clientInfo.name || clientInfo.address) {
      setPendingSaveData({ type: 'client', data: clientInfo });
      setShowSaveModal(true);
    }
  };

  const handleSaveConfirmation = async () => {
    if (!pendingSaveData) return;

    try {
      if (pendingSaveData.type === 'company') {
        // Save to company profile
        try {
          console.log('Company data to save:', pendingSaveData.data);
        } catch (error) {
          console.error('Error saving company info:', error);
          alert('Failed to save company info.');
        }
      } else if (pendingSaveData.type === 'client') {
        // Save to clients
        try {
          const clientData = {
            name: pendingSaveData.data.name,
            email: pendingSaveData.data.email || '',
            businessName: pendingSaveData.data.name,
            billingAddress: pendingSaveData.data.address || '',
            city: pendingSaveData.data.city,
            state: pendingSaveData.data.state,
            country: pendingSaveData.data.country,
            gstin: pendingSaveData.data.gstin,
          };
          await addClient(clientData);
        } catch (error) {
          console.error('Error saving client info:', error);
          alert('Failed to save info.');
        }
      }
    } catch (error) {
      console.error('Error in save confirmation:', error);
      alert('Failed to save info.');
    } finally {
      setShowSaveModal(false);
      setPendingSaveData(null);
      
      // Continue with the original action after saving
      if (pendingSaveData?.type === 'client') {
        // If we were trying to save, continue with save
        if (isSaving) {
          handleSave();
        }
        // If we were trying to download, continue with download
        if (isDownloading) {
          handleDownload();
        }
      }
    }
  };

  const handleEditInvoice = (invoiceToEdit: Invoice) => {
    // Load the invoice data into the form
    resetInvoice();
    setTimeout(() => {
      updateInvoiceDetails(invoiceToEdit);
      updateCompanyInfo(invoiceToEdit.company);
      updateClientInfo(invoiceToEdit.client);
    }, 0);
    setActiveTab('form');
    setShowInvoiceActions(false);
  };

  const handleDuplicateInvoice = (invoiceToDuplicate: Invoice) => {
    // Create a new invoice with the same data but new ID and number
    const duplicatedInvoice = {
      ...invoiceToDuplicate,
      id: crypto.randomUUID(),
      invoiceNumber: generateInvoiceNumber(invoiceToDuplicate.company.invoicePrefix),
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'draft' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setInvoice(duplicatedInvoice);
    setActiveTab('form');
    setShowInvoiceActions(false);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    if (confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      const updatedInvoices = savedInvoices.filter(inv => inv.id !== invoiceId);
      setSavedInvoices(updatedInvoices);
    }
  };

  // Get past invoices for selected client
  const clientInvoices = selectedClient ? getClientInvoiceDetails(selectedClient.id) : [];
  
  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Show login overlay if not authenticated */}
      {!user && <InlineLoginOverlay />}
      
      {/* Main app content - always rendered but blurred when not authenticated */}
      <div className={`transition-all duration-300 ${!user ? 'blur-sm pointer-events-none' : ''}`}>
      <Header
        onSave={handleSave}
        onDownload={handleDownload}
        onShare={handleShare}
        onPrint={handlePrint}
        onReset={handleReset}
        isSaving={isSaving}
        isDownloading={isDownloading}
        showSaveButton={activeTab === 'form'}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tab Navigation */}
        <div className="mb-12">
          <div className="border-b border-gray-100">
            <nav className="-mb-px flex space-x-12">
              <button
                onClick={() => setActiveTab('form')}
                className={`py-3 px-1 border-b-2 font-medium text-base transition-all duration-200 ${
                  activeTab === 'form'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                }`}
              >
                Create Invoice
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`py-3 px-1 border-b-2 font-medium text-base transition-all duration-200 ${
                  activeTab === 'preview'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setActiveTab('clients')}
                className={`py-3 px-1 border-b-2 font-medium text-base transition-all duration-200 ${
                  activeTab === 'clients'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                }`}
              >
                Clients
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`py-3 px-1 border-b-2 font-medium text-base transition-all duration-200 ${
                  activeTab === 'invoices'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                }`}
              >
                Past Invoices
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-3 px-1 border-b-2 font-medium text-base transition-all duration-200 ${
                  activeTab === 'profile'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                }`}
              >
                Profile
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'profile' ? (
          <CompanyProfileForm />
        ) : activeTab === 'invoices' ? (
          <PastInvoicesTab
            invoices={savedInvoices}
            onEdit={handleEditInvoice}
            onDuplicate={handleDuplicateInvoice}
            onDelete={handleDeleteInvoice}
            onDownload={handleDownload}
            onShare={handleShare}
          />
        ) : activeTab === 'clients' ? (
          <ClientList
            clients={clients}
            onAddClient={addClient}
            onUpdateClient={updateClient}
            onDeleteClient={deleteClient}
            loading={clientsLoading}
          />
        ) : (
          <div className="max-w-5xl mx-auto">
            {activeTab === 'form' ? (
              <div className="space-y-8">
                {/* Client Selector */}
                <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-8">
                  <ClientSelector
                    clients={clients}
                    selectedClient={selectedClient}
                    onClientSelect={handleClientSelect}
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
                
                {showInvoiceActions && (
                  <InvoiceActions
                    invoice={invoice}
                    onEdit={() => setShowInvoiceActions(false)}
                    onDuplicate={() => handleDuplicateInvoice(invoice)}
                    onDelete={() => {
                      if (confirm('Are you sure you want to delete this invoice?')) {
                        resetInvoice();
                        setShowInvoiceActions(false);
                      }
                    }}
                    onDownload={handleDownload}
                    onShare={handleShare}
                  />
                )}
              </div>
            ) : (
              <InvoicePreview invoice={invoice} />
            )}
          </div>
        )}
        
        <SaveConfirmationModal
          isOpen={showSaveModal}
          onClose={() => {
            setShowSaveModal(false);
            setPendingSaveData(null);
          }}
          onConfirm={handleSaveConfirmation}
          loading={isSaving}
          title={pendingSaveData?.type === 'company' ? 'Save Company Information' : 'Save Client Information'}
          message={
            pendingSaveData?.type === 'company' 
              ? 'Would you like to save this company information to your profile for future use?'
              : 'Would you like to save this client information for future invoices?'
          }
        />
      </main>
      </div>
    </div>
  );
}

export default App;
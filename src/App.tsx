import React, { useState } from 'react';
import { AuthGuard } from './components/auth/AuthGuard';
import { useAuth } from './hooks/useAuth';
import { OnboardingForm } from './components/auth/OnboardingForm';
import { Header } from './components/common/Header';
import { InvoiceForm } from './components/invoice/InvoiceForm';
import { InvoicePreview } from './components/invoice/InvoicePreview';
import { ClientList } from './components/clients/ClientList';
import { ClientSelector } from './components/clients/ClientSelector';
import { ClientInvoiceHistory } from './components/clients/ClientInvoiceHistory';
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
    <AuthGuard>
      <AppContent />
    </AuthGuard>
  );
}

function AppContent() {
  const { user, needsOnboarding, completeOnboarding } = useAuth();
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
  const [activeTab, setActiveTab] = useState<'form' | 'preview' | 'clients' | 'profile'>('form');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<{ type: 'company' | 'client'; data: any } | null>(null);
  const [showInvoiceActions, setShowInvoiceActions] = useState(false);

  const { clients, loading: clientsLoading, addClient, updateClient, deleteClient } = useSupabaseClients();
  const { addClientInvoice, getClientInvoiceDetails } = useClientInvoices();

  if (needsOnboarding) {
    return <OnboardingForm onComplete={completeOnboarding} />;
  }

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
      
      // If a client is selected, associate this invoice with the client
      if (selectedClient) {
        addClientInvoice(selectedClient.id, invoice);
      }
      
      setShowInvoiceActions(true);
      
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error saving invoice:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/invoice/${invoice.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Invoice link copied to clipboard!');
    }).catch(() => {
      prompt('Copy this link to share your invoice:', shareUrl);
    });
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
        console.log('Saving company info to profile:', pendingSaveData.data);
      } else if (pendingSaveData.type === 'client') {
        // Save to clients
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
      }
    } catch (error) {
      console.error('Error saving data:', error);
    } finally {
      setShowSaveModal(false);
      setPendingSaveData(null);
    }
  };

  // Get past invoices for selected client
  const clientInvoices = selectedClient ? getClientInvoiceDetails(selectedClient.id) : [];
  
  return (
    <div className="min-h-screen bg-gray-50">
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
                onClick={() => setActiveTab('clients')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'clients'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Clients
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Company Profile
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'profile' ? (
          <CompanyProfileForm />
        ) : activeTab === 'clients' ? (
          <ClientList
            clients={clients}
            onAddClient={addClient}
            onUpdateClient={updateClient}
            onDeleteClient={deleteClient}
            loading={clientsLoading}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {activeTab === 'form' ? (
              <>
                {/* Left sidebar for client history */}
                {selectedClient && clientInvoices.length > 0 && (
                  <div className="lg:col-span-1">
                    <div className="sticky top-8">
                      <ClientInvoiceHistory
                        client={selectedClient}
                        invoices={clientInvoices}
                      />
                    </div>
                  </div>
                )}
                
                {/* Main form area */}
                <div className={selectedClient && clientInvoices.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}>
                  <div className="space-y-6">
                    {/* Client Selector */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <ClientSelector
                        clients={clients}
                        selectedClient={selectedClient}
                        onClientSelect={handleClientSelect}
                      />
                    </div>
                    
                    {/* Invoice Form */}
                    <InvoiceForm
                      invoice={invoice}
                      onUpdateCompany={handleCompanyInfoChange}
                      onUpdateClient={handleClientInfoChange}
                      onAddLineItem={addLineItem}
                      onUpdateLineItem={updateLineItem}
                      onRemoveLineItem={removeLineItem}
                      onUpdateInvoice={updateInvoiceDetails}
                    />
                    
                    {showInvoiceActions && (
                      <InvoiceActions
                        invoice={invoice}
                        onEdit={() => setShowInvoiceActions(false)}
                        onDuplicate={() => {
                          const newInvoice = { ...invoice, id: crypto.randomUUID() };
                          // Handle duplicate logic
                        }}
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
                </div>
              </>
            ) : (
              <div className="lg:col-span-3">
                <InvoicePreview invoice={invoice} />
              </div>
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
  );
}

export default App;
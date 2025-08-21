import React from "react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { InlineLoginOverlay } from "./components/auth/InlineLoginOverlay";
import ToastContainer from "./components/common/ToastContainer";
import OfflineIndicator from "./components/common/OfflineIndicator";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { ConnectionStatus } from "./components/common/ConnectionStatus";
import { useAuth } from "./hooks/useAuth";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { OnboardingForm } from "./components/auth/OnboardingForm";
import { Header } from "./components/common/Header";
import { InvoiceForm } from "./components/invoice/InvoiceForm";
import { InvoicePreview } from "./components/invoice/InvoicePreview";
import { ClientList } from "./components/clients/ClientList";
import { ClientSelector } from "./components/clients/ClientSelector";
import { PastInvoicesTab } from "./components/invoice/PastInvoicesTab";
import { CompanyProfileForm } from "./components/profile/CompanyProfileForm";
import { SaveConfirmationModal } from "./components/common/SaveConfirmationModal";
import { InvoiceActions } from "./components/invoice/InvoiceActions";
import { useInvoice } from "./hooks/useInvoice";
import { useSupabaseClients } from "./hooks/useSupabaseClients";
import { useClientInvoices } from "./hooks/useClientInvoices";
import { useCompanyProfile } from "./hooks/useCompanyProfile";
import { useCloudInvoices } from "./hooks/useCloudInvoices";
import { generateInvoicePDF } from "./utils/pdfGenerator";
import { generateInvoiceNumber } from "./utils/invoiceUtils";
import { Client } from "./types/client";
import { Invoice } from "./types/invoice";

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
      <ToastContainer />
      <OfflineIndicator />
      <ConnectionStatus />
    </ErrorBoundary>
  );
}

function AppContent() {
  const { user, loading, needsOnboarding, completeOnboarding } = useAuth();
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const { profile } = useCompanyProfile();
  const navigate = useNavigate();
  const location = useLocation();
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

  // CLOUD-ONLY: Use Supabase for all data storage
  const cloudInvoices = useCloudInvoices();
  const supabaseClients = useSupabaseClients();

  // Only use cloud storage - no local fallback
  const invoicesData = {
    invoices: cloudInvoices.invoices,
    loading: cloudInvoices.loading,
    saving: cloudInvoices.saving,
    saveInvoice: cloudInvoices.saveInvoice,
    deleteInvoice: cloudInvoices.deleteInvoice,
  };

  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<{
    type: "company" | "client";
    data: any;
  } | null>(null);
  const [showInvoiceActions, setShowInvoiceActions] = useState(false);

  // CLOUD-ONLY: Use only Supabase clients
  const { clients, loading: clientsLoading, saving: clientsSaving, addClient, updateClient, deleteClient } = supabaseClients;
  
  const { addClientInvoice } = useClientInvoices();

  // Get active tab from URL path
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path === '/clients') return 'clients';
    if (path === '/invoices') return 'invoices';
    if (path === '/profile') return 'profile';
    if (path === '/preview') return 'preview';
    return 'form';
  };

  const activeTab = getActiveTabFromPath();

  const setActiveTab = (tab: "form" | "preview" | "clients" | "invoices" | "profile") => {
    const paths = {
      form: '/',
      preview: '/preview',
      clients: '/clients',
      invoices: '/invoices',
      profile: '/profile'
    };
    navigate(paths[tab]);
  };
  // Show slow connection warning
  React.useEffect(() => {
    if (isSlowConnection) {
      const event = new CustomEvent('showToast', {
        detail: {
          message: 'Slow connection detected. Operations may take longer than usual.',
          type: 'warning',
          duration: 4000
        }
      });
      window.dispatchEvent(event);
    }
  }, [isSlowConnection]);

  // Show loading state
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        {loading ? (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        ) : (
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please sign in to access the application.</p>
          </div>
        )}
      </div>
    );
  }

  if (needsOnboarding) {
    return <OnboardingForm onComplete={completeOnboarding} />;
  }

  // STRICT VALIDATION: Prevent saving blank invoices
  const validateInvoiceForSave = (): { isValid: boolean; error: string } => {
    if (!invoice.client.name.trim()) {
      return {
        isValid: false,
        error: "Please enter a client name before saving.",
      };
    }

    if (!invoice.client.address.trim()) {
      return {
        isValid: false,
        error: "Please enter a client address before saving.",
      };
    }

    if (invoice.items.length === 0) {
      return {
        isValid: false,
        error: "Please add at least one item before saving.",
      };
    }

    if (invoice.items.some((item) => !item.description.trim())) {
      return {
        isValid: false,
        error: "Please fill in descriptions for all items before saving.",
      };
    }

    if (invoice.total <= 0) {
      return {
        isValid: false,
        error: "Invoice total must be greater than zero.",
      };
    }

    return { isValid: true, error: "" };
  };

  const handleSave = async () => {
    // STRICT VALIDATION
    const validation = validateInvoiceForSave();
    if (!validation.isValid) {
      alert(validation.error);
      setActiveTab("form");
      return;
    }

    if (!user) {
      alert("Please sign in to save invoices.");
      return;
    }

    setIsSaving(true);
    try {
      // CLOUD-ONLY: Save to Supabase
      await cloudInvoices.saveInvoice(invoice);

      // If a client is selected, associate this invoice with the client
      if (selectedClient) {
        addClientInvoice(selectedClient.id, invoice);
      }

      setShowInvoiceActions(true);

      // CLEAR FORM: Reset after 3 seconds
      setTimeout(() => {
        resetInvoice();
        setSelectedClient(null);
        setShowInvoiceActions(false);
        navigate('/'); // Navigate to form tab
      }, 3000);
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert("Failed to save invoice to cloud. Please check your internet connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    // STRICT VALIDATION for sharing
    const validation = validateInvoiceForSave();
    if (!validation.isValid) {
      alert(validation.error);
      setActiveTab("form");
      return;
    }

    // Auto-save before sharing
    const updatedInvoices = [...savedInvoices];
    const existingIndex = updatedInvoices.findIndex(
      (inv) => inv.id === invoice.id
    );

    if (existingIndex >= 0) {
      updatedInvoices[existingIndex] = invoice;
    } else {
      updatedInvoices.push(invoice);
    }

    setSavedInvoices(updatedInvoices);

    // CRITICAL: Save to global shared storage
    const globalInvoices = JSON.parse(
      localStorage.getItem("shared_invoices") || "[]"
    );
    const globalExistingIndex = globalInvoices.findIndex(
      (inv: Invoice) => inv.id === invoice.id
    );

    if (globalExistingIndex >= 0) {
      globalInvoices[globalExistingIndex] = invoice;
    } else {
      globalInvoices.push(invoice);
    }

    localStorage.setItem("shared_invoices", JSON.stringify(globalInvoices));

    const shareUrl = `${window.location.origin}/invoice/${invoice.id}`;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        alert("Invoice link copied to clipboard!");
      })
      .catch(() => {
        prompt("Copy this link to share your invoice:", shareUrl);
      });
  };

  const handleDownload = async () => {
    // STRICT VALIDATION for download
    const validation = validateInvoiceForSave();
    if (!validation.isValid) {
      alert(validation.error);
      setActiveTab("form");
      return;
    }

    setIsDownloading(true);
    try {
      await generateInvoicePDF(invoice);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    if (
      confirm(
        "Are you sure you want to reset the invoice? All unsaved changes will be lost."
      )
    ) {
      resetInvoice();
      setSelectedClient(null);
      setActiveTab("form");
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
        city: client.city || "",
        state: client.state || "",
        country: client.country || "India",
        address: client.billingAddress,
        gstin: client.gstin || "",
      });
    }
  };

  const handleSaveConfirmation = async () => {
    if (!pendingSaveData) return;

    try {
      if (pendingSaveData.type === "client") {
        // Save to clients
        try {
          const clientData = {
            name: pendingSaveData.data.name,
            email: pendingSaveData.data.email || "",
            businessName: pendingSaveData.data.name,
            billingAddress: pendingSaveData.data.address || "",
            city: pendingSaveData.data.city,
            state: pendingSaveData.data.state,
            country: pendingSaveData.data.country,
            gstin: pendingSaveData.data.gstin,
          };
          await addClient(clientData);
        } catch (error) {
          console.error("Error saving client info:", error);
          alert("Failed to save client info.");
        }
      }
    } catch (error) {
      console.error("Error in save confirmation:", error);
      alert("Failed to save info.");
    } finally {
      setShowSaveModal(false);
      setPendingSaveData(null);
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
    navigate('/');
    setShowInvoiceActions(false);
  };

  const handleDuplicateInvoice = (invoiceToDuplicate: Invoice) => {
    // Create a new invoice with the same data but new ID and number
    const duplicatedInvoice = {
      ...invoiceToDuplicate,
      id: crypto.randomUUID(),
      invoiceNumber: generateInvoiceNumber(
        invoiceToDuplicate.company.invoicePrefix
      ),
      date: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "draft" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    resetInvoice();
    setTimeout(() => {
      updateInvoiceDetails(duplicatedInvoice);
      updateCompanyInfo(duplicatedInvoice.company);
      updateClientInfo(duplicatedInvoice.client);
    }, 0);
    setActiveTab("form");
    setShowInvoiceActions(false);
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    if (
      confirm(
        "Are you sure you want to delete this invoice? This action cannot be undone."
      )
    ) {
      invoicesData.deleteInvoice(invoiceId);
    }
  };

  const handleShareFromPastInvoices = (invoiceToShare: Invoice) => {
    // Create shareable link directly from cloud data
    const shareUrl = `${window.location.origin}/invoice/${invoiceToShare.id}`;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        alert("Invoice link copied to clipboard!");
      })
      .catch(() => {
        prompt("Copy this link to share your invoice:", shareUrl);
      });
  };

  const handleDownloadFromPastInvoices = async (invoiceToDownload: Invoice) => {
    setIsDownloading(true);
    try {
      await generateInvoicePDF(invoiceToDownload);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Show login overlay if not authenticated */}
      {!user && <InlineLoginOverlay />}

      {/* Main app content - always rendered but blurred when not authenticated */}
      <div
        className={`transition-all duration-300 ${
          !user ? "blur-sm pointer-events-none" : ""
        }`}
      >
        {/* Show connection status */}
        {user && (clientsLoading || cloudInvoices.loading) && (
          <div className="fixed top-4 left-4 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm">
            Connecting to cloud database...
          </div>
        )}

        <Header
          onSave={handleSave}
          onDownload={handleDownload}
          onShare={handleShare}
          onPrint={handlePrint}
          onReset={handleReset}
          isSaving={isSaving}
          isDownloading={isDownloading}
          showSaveButton={activeTab === "form"}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Tab Navigation */}
          <div className="mb-8 sm:mb-12">
            <div className="border-b border-gray-100">
              <nav className="-mb-px flex space-x-4 sm:space-x-8 lg:space-x-12 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("form")}
                  className={`py-3 px-1 border-b-2 font-medium text-sm sm:text-base transition-all duration-200 whitespace-nowrap ${
                    activeTab === "form"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
                  }`}
                >
                  Create Invoice
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`py-3 px-1 border-b-2 font-medium text-sm sm:text-base transition-all duration-200 whitespace-nowrap ${
                    activeTab === "preview"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
                  }`}
                >
                  Preview
                </button>
                <button
                  onClick={() => setActiveTab("clients")}
                  className={`py-3 px-1 border-b-2 font-medium text-sm sm:text-base transition-all duration-200 whitespace-nowrap ${
                    activeTab === "clients"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
                  }`}
                >
                  Clients
                </button>
                <button
                  onClick={() => setActiveTab("invoices")}
                  className={`py-3 px-1 border-b-2 font-medium text-sm sm:text-base transition-all duration-200 whitespace-nowrap ${
                    activeTab === "invoices"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
                  }`}
                >
                  Invoices
                </button>
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`py-3 px-1 border-b-2 font-medium text-sm sm:text-base transition-all duration-200 whitespace-nowrap ${
                    activeTab === "profile"
                      ? "border-primary-500 text-primary-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200"
                  }`}
                >
                  Profile
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          {activeTab === "profile" ? (
            <CompanyProfileForm />
          ) : activeTab === "invoices" ? (
            <PastInvoicesTab
              invoices={invoicesData.invoices}
              onEdit={handleEditInvoice}
              onDuplicate={handleDuplicateInvoice}
              onDelete={handleDeleteInvoice}
              onDownload={handleDownloadFromPastInvoices}
              onShare={handleShareFromPastInvoices}
            />
          ) : activeTab === "clients" ? (
            <ClientList
              clients={clients}
              onAddClient={addClient}
              onUpdateClient={updateClient}
              onDeleteClient={deleteClient}
              loading={clientsLoading}
              saving={clientsSaving}
            />
          ) : (
            <div className="max-w-5xl mx-auto">
              {activeTab === "form" ? (
                <div className="space-y-8">
                  {/* Client Selector */}
                  <div className="bg-white rounded-xl sm:rounded-2xl shadow-soft border border-gray-100 p-4 sm:p-6 lg:p-8">
                    <ClientSelector
                      clients={clients}
                      selectedClient={selectedClient || undefined}
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
                        if (
                          confirm(
                            "Are you sure you want to delete this invoice?"
                          )
                        ) {
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
            title={
              pendingSaveData?.type === "company"
                ? "Save Company Information"
                : "Save Client Information"
            }
            message={
              pendingSaveData?.type === "company"
                ? "Would you like to save this company information to your profile for future use?"
                : "Would you like to save this client information for future invoices?"
            }
          />
        </main>
      </div>
    </div>
  );
}

export default App;

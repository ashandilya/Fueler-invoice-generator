import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, FileText } from 'lucide-react';
import { Invoice } from '../../types/invoice';
import { InvoicePreview } from './InvoicePreview';
import { Button } from '../ui/Button';
import { generateInvoicePDF } from '../../utils/pdfGenerator';

export const PublicInvoiceView: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const loadInvoice = () => {
      try {
        let foundInvoice: Invoice | null = null;
        
        // First check global shared invoices storage
        const sharedInvoices = localStorage.getItem('shared_invoices');
        if (sharedInvoices) {
          const invoices = JSON.parse(sharedInvoices, (key, value) => {
            if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
              return new Date(value);
            }
            return value;
          });
          foundInvoice = invoices.find((inv: Invoice) => inv.id === invoiceId);
        }
        
        // If not found, check main invoices storage
        if (!foundInvoice) {
          const savedInvoices = localStorage.getItem('invoices');
          if (savedInvoices) {
            const invoices = JSON.parse(savedInvoices, (key, value) => {
              if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
                return new Date(value);
              }
              return value;
            });
            foundInvoice = invoices.find((inv: Invoice) => inv.id === invoiceId);
          }
        }
        
        // If still not found, check all localStorage keys for user-specific data
        if (!foundInvoice) {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('invoices_') || key === 'invoices')) {
              try {
                const userInvoices = localStorage.getItem(key);
                if (userInvoices) {
                  const invoices = JSON.parse(userInvoices, (key, value) => {
                    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
                      return new Date(value);
                    }
                    return value;
                  });
                  if (Array.isArray(invoices)) {
                    foundInvoice = invoices.find((inv: Invoice) => inv.id === invoiceId);
                    if (foundInvoice) break;
                  }
                }
              } catch (e) {
                continue;
              }
            }
          }
        }
        
        if (foundInvoice) {
          setInvoice(foundInvoice);
        } else {
          setError('Invoice not found. The invoice may have been deleted or the link is invalid.');
        }
      } catch (err) {
        console.error('Error loading invoice:', err);
        setError('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      loadInvoice();
    } else {
      setError('Invalid invoice ID');
      setLoading(false);
    }
  }, [invoiceId]);

  const handleDownload = async () => {
    if (!invoice) return;
    
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Invoice Not Found</h1>
          <p className="mt-2 text-gray-600">{error || 'The requested invoice could not be found.'}</p>
          <div className="mt-6">
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Go to Invoicce.to
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-soft border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Invoicce.to</h1>
              <p className="text-xs text-gray-500">Invoice #{invoice.invoiceNumber}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleDownload}
                loading={isDownloading}
                disabled={isDownloading}
                icon={Download}
                variant="primary"
                size="md"
              >
                {isDownloading ? 'Generating...' : 'Download PDF'}
              </Button>
              
              <a
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Create Your Invoice
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Invoice Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <InvoicePreview invoice={invoice} />
      </main>
    </div>
  );
};
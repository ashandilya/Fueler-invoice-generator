import { useState, useCallback, useMemo } from 'react';
import { VendorInvoice } from '../types/vendor';
import { Invoice } from '../types/invoice';
import { useLocalStorage } from './useLocalStorage';

export const useVendorInvoices = () => {
  const [vendorInvoices, setVendorInvoices] = useLocalStorage<VendorInvoice[]>('vendorInvoices', []);
  const [savedInvoices] = useLocalStorage<Invoice[]>('invoices', []);

  const addVendorInvoice = useCallback((vendorId: string, invoice: Invoice) => {
    const vendorInvoice: VendorInvoice = {
      vendorId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.date,
      amount: invoice.total,
      currency: invoice.currency,
      status: invoice.status,
    };

    setVendorInvoices(prev => {
      // Remove existing entry if it exists (for updates)
      const filtered = prev.filter(vi => vi.invoiceId !== invoice.id);
      return [...filtered, vendorInvoice];
    });
  }, [setVendorInvoices]);

  const getVendorInvoices = useCallback((vendorId: string): VendorInvoice[] => {
    return vendorInvoices.filter(vi => vi.vendorId === vendorId);
  }, [vendorInvoices]);

  const getVendorInvoiceDetails = useCallback((vendorId: string): Invoice[] => {
    const vendorInvoiceIds = vendorInvoices
      .filter(vi => vi.vendorId === vendorId)
      .map(vi => vi.invoiceId);
    
    return savedInvoices.filter(invoice => vendorInvoiceIds.includes(invoice.id));
  }, [vendorInvoices, savedInvoices]);

  const removeVendorInvoice = useCallback((invoiceId: string) => {
    setVendorInvoices(prev => prev.filter(vi => vi.invoiceId !== invoiceId));
  }, [setVendorInvoices]);

  return {
    vendorInvoices,
    addVendorInvoice,
    getVendorInvoices,
    getVendorInvoiceDetails,
    removeVendorInvoice,
  };
};
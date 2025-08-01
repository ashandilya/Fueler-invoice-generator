import { useState, useCallback, useMemo } from 'react';
import { ClientInvoice } from '../types/client';
import { Invoice } from '../types/invoice';
import { useLocalStorage } from './useLocalStorage';

export const useClientInvoices = () => {
  const [clientInvoices, setClientInvoices] = useLocalStorage<ClientInvoice[]>('clientInvoices', []);
  const [savedInvoices] = useLocalStorage<Invoice[]>('invoices', []);

  const addClientInvoice = useCallback((clientId: string, invoice: Invoice) => {
    const clientInvoice: ClientInvoice = {
      clientId,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.date,
      amount: invoice.total,
      currency: invoice.currency,
      status: invoice.status,
    };

    setClientInvoices(prev => {
      // Remove existing entry if it exists (for updates)
      const filtered = prev.filter(ci => ci.invoiceId !== invoice.id);
      return [...filtered, clientInvoice];
    });
  }, [setClientInvoices]);

  const getClientInvoices = useCallback((clientId: string): ClientInvoice[] => {
    return clientInvoices.filter(ci => ci.clientId === clientId);
  }, [clientInvoices]);

  const getClientInvoiceDetails = useCallback((clientId: string): Invoice[] => {
    const clientInvoiceIds = clientInvoices
      .filter(ci => ci.clientId === clientId)
      .map(ci => ci.invoiceId);
    
    return savedInvoices.filter(invoice => clientInvoiceIds.includes(invoice.id));
  }, [clientInvoices, savedInvoices]);

  const removeClientInvoice = useCallback((invoiceId: string) => {
    setClientInvoices(prev => prev.filter(ci => ci.invoiceId !== invoiceId));
  }, [setClientInvoices]);

  return {
    clientInvoices,
    addClientInvoice,
    getClientInvoices,
    getClientInvoiceDetails,
    removeClientInvoice,
  };
};
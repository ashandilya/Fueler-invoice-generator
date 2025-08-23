import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useErrorHandler } from './useErrorHandler';
import { Invoice } from '../types/invoice';

export const useSupabaseInvoices = () => {
  const { user } = useAuth();
  const { handleAsyncOperation } = useErrorHandler();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchInvoices = useCallback(async () => {
    if (!user) {
      setInvoices([]);
      return;
    }

    setLoading(true);
    
    const result = await handleAsyncOperation(
      async () => {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        return data.map(invoice => ({
          id: invoice.id,
          invoiceNumber: invoice.invoice_number,
          date: new Date(invoice.date),
          dueDate: new Date(invoice.due_date),
          company: invoice.company,
          client: invoice.client,
          items: invoice.items,
          subtotal: invoice.subtotal,
          tax: invoice.tax,
          taxRate: invoice.tax_rate,
          discount: invoice.discount,
          discountType: invoice.discount_type,
          total: invoice.total,
          currency: invoice.currency,
          exchangeRate: invoice.exchange_rate,
          notes: invoice.notes,
          paymentTerms: invoice.payment_terms,
          status: invoice.status,
          createdAt: new Date(invoice.created_at),
          updatedAt: new Date(invoice.updated_at),
        }));
      },
      'fetchInvoices'
    );

    if (result) {
      setInvoices(result);
    }
    
    setLoading(false);
  }, [user, handleAsyncOperation]);

  const saveInvoice = useCallback(
    async (invoice: Invoice): Promise<Invoice> => {
      if (!user) throw new Error('User not authenticated');

      setSaving(true);

      const result = await handleAsyncOperation(
        async () => {
          const invoiceData = {
            invoice_number: invoice.invoiceNumber,
            date: invoice.date.toISOString(),
            due_date: invoice.dueDate.toISOString(),
            company: invoice.company,
            client: invoice.client,
            items: invoice.items,
            subtotal: invoice.subtotal,
            tax: invoice.tax,
            tax_rate: invoice.taxRate,
            discount: invoice.discount,
            discount_type: invoice.discountType,
            total: invoice.total,
            currency: invoice.currency,
            exchange_rate: invoice.exchangeRate,
            notes: invoice.notes,
            payment_terms: invoice.paymentTerms,
            status: invoice.status,
            user_id: user.id,
          };

          // Check if invoice exists (update) or create new
          const existingInvoice = invoices.find(inv => inv.id === invoice.id);
          
          if (existingInvoice) {
            // Update existing invoice
            const { data, error } = await supabase
              .from('invoices')
              .update(invoiceData)
              .eq('id', invoice.id)
              .eq('user_id', user.id)
              .select()
              .single();

            if (error) throw error;
            return { ...invoice, updatedAt: new Date() };
          } else {
            // Create new invoice
            const { data, error } = await supabase
              .from('invoices')
              .insert(invoiceData)
              .select()
              .single();

            if (error) throw error;
            return { ...invoice, id: data.id, createdAt: new Date(), updatedAt: new Date() };
          }
        },
        'saveInvoice',
        {
          showSuccess: true,
          successMessage: 'Invoice saved successfully!',
          retries: 2
        }
      );

      setSaving(false);

      if (result) {
        // Update local state
        setInvoices(prev => {
          const existingIndex = prev.findIndex(inv => inv.id === result.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = result;
            return updated;
          } else {
            return [result, ...prev];
          }
        });
        return result;
      }

      throw new Error('Failed to save invoice');
    },
    [user, invoices, handleAsyncOperation]
  );

  const deleteInvoice = useCallback(
    async (invoiceId: string): Promise<void> => {
      if (!user) throw new Error('User not authenticated');

      setSaving(true);

      const result = await handleAsyncOperation(
        async () => {
          const { error } = await supabase
            .from('invoices')
            .delete()
            .eq('id', invoiceId)
            .eq('user_id', user.id);

          if (error) throw error;
        },
        'deleteInvoice',
        {
          showSuccess: true,
          successMessage: 'Invoice deleted successfully!',
          retries: 2
        }
      );

      setSaving(false);

      if (result !== null) {
        // Update local state
        setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
      }
    },
    [user, handleAsyncOperation]
  );

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    invoices,
    loading,
    saving,
    saveInvoice,
    deleteInvoice,
    refetch: fetchInvoices,
  };
};
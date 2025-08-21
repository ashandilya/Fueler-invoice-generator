import { useState, useEffect, useCallback } from 'react';
import { supabase, DatabaseInvoice } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useErrorHandler } from './useErrorHandler';
import { Invoice } from '../types/invoice';

const convertToAppInvoice = (dbInvoice: DatabaseInvoice): Invoice => ({
  id: dbInvoice.invoice_id,
  invoiceNumber: dbInvoice.invoice_number,
  date: new Date(dbInvoice.date),
  dueDate: new Date(dbInvoice.due_date),
  company: dbInvoice.line_items?.[0]?.company || {
    name: 'KiwisMedia Technologies Pvt. Ltd.',
    address: 'HNO 238 , Bhati Abhoynagar, Nr\nVivekananda club rd, Agartala\nWard No - 1, P.O - Ramnagar,\nAgartala, West Tripura TR\n799002 IN.',
    city: 'Agartala',
    state: 'West Tripura',
    country: 'India',
    email: '',
    website: '',
    logo: '/fueler_logo.png',
    signature: '/signature.png.jpg',
    paymentTerms: 'Payment due within 30 days\n\nBank Payment Details:\nKiwisMedia Technologies Private Limited.\nBank: IDFC Bank First\nA/C no: 10043617893\nIFSC: IDF80040101',
    invoicePrefix: 'FLB',
  },
  client: dbInvoice.line_items?.[0]?.client || {
    name: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    email: '',
    gstin: '',
  },
  items: dbInvoice.line_items || [],
  subtotal: dbInvoice.total_amount,
  tax: 0,
  taxRate: 0,
  discount: 0,
  discountType: 'percentage' as const,
  total: dbInvoice.total_amount,
  currency: dbInvoice.currency,
  exchangeRate: 1,
  notes: dbInvoice.notes || '',
  paymentTerms: dbInvoice.payment_terms || '',
  status: dbInvoice.status,
  createdAt: new Date(dbInvoice.created_at),
  updatedAt: new Date(dbInvoice.updated_at),
});

export const useCloudInvoices = () => {
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
        return data;
      },
      'fetchInvoices'
    );

    if (result) {
      const appInvoices = result.map(convertToAppInvoice);
      setInvoices(appInvoices);
    }
    
    setLoading(false);
  }, [user, handleAsyncOperation]);

  const saveInvoice = useCallback(
    async (invoice: Invoice): Promise<Invoice> => {
      if (!user) throw new Error('User not authenticated');

      setSaving(true);

      const result = await handleAsyncOperation(
        async () => {
          const dbInvoice = {
            user_id: user.id,
            invoice_number: invoice.invoiceNumber,
            date: invoice.date.toISOString().split('T')[0],
            due_date: invoice.dueDate.toISOString().split('T')[0],
            total_amount: invoice.total,
            currency: invoice.currency,
            line_items: JSON.stringify({
              items: invoice.items,
              company: invoice.company,
              client: invoice.client,
              subtotal: invoice.subtotal,
              tax: invoice.tax,
              taxRate: invoice.taxRate,
              discount: invoice.discount,
              discountType: invoice.discountType,
            }),
            notes: invoice.notes || null,
            payment_terms: invoice.paymentTerms || null,
            status: invoice.status,
          };

          const { data, error } = await supabase
            .from('invoices')
            .upsert(dbInvoice, {
              onConflict: 'invoice_id',
            })
            .select()
            .single();

          if (error) throw error;
          return convertToAppInvoice(data);
        },
        'saveInvoice',
        {
          showSuccess: true,
          successMessage: 'Invoice saved to cloud successfully!',
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
    [user, handleAsyncOperation]
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
            .eq('invoice_id', invoiceId)
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
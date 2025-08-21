import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import { useErrorHandler } from './useErrorHandler';
import { Invoice } from '../types/invoice';

const convertToAppInvoice = (id: string, data: any): Invoice => ({
  id,
  invoiceNumber: data.invoiceNumber,
  date: data.date?.toDate() || new Date(),
  dueDate: data.dueDate?.toDate() || new Date(),
  company: data.company || {
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
  client: data.client || {
    name: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    email: '',
    gstin: '',
  },
  items: data.items || [],
  subtotal: data.subtotal || 0,
  tax: data.tax || 0,
  taxRate: data.taxRate || 0,
  discount: data.discount || 0,
  discountType: data.discountType || 'percentage',
  total: data.total || 0,
  currency: data.currency || 'INR',
  exchangeRate: data.exchangeRate || 1,
  notes: data.notes || '',
  paymentTerms: data.paymentTerms || '',
  status: data.status || 'draft',
  createdAt: data.createdAt?.toDate() || new Date(),
  updatedAt: data.updatedAt?.toDate() || new Date(),
});

export const useFirebaseInvoices = () => {
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
        const invoicesRef = collection(db, 'invoices');
        const q = query(
          invoicesRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const invoicesData = querySnapshot.docs.map(doc => 
          convertToAppInvoice(doc.id, doc.data())
        );
        
        return invoicesData;
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
          const invoicesRef = collection(db, 'invoices');
          const invoiceData = {
            ...invoice,
            userId: user.uid,
            date: Timestamp.fromDate(invoice.date),
            dueDate: Timestamp.fromDate(invoice.dueDate),
            createdAt: Timestamp.fromDate(invoice.createdAt),
            updatedAt: Timestamp.now(),
          };

          // Check if invoice exists (update) or create new
          const existingInvoice = invoices.find(inv => inv.id === invoice.id);
          
          if (existingInvoice) {
            // Update existing invoice
            const invoiceRef = doc(db, 'invoices', invoice.id);
            await updateDoc(invoiceRef, invoiceData);
            return convertToAppInvoice(invoice.id, invoiceData);
          } else {
            // Create new invoice
            const docRef = await addDoc(invoicesRef, invoiceData);
            return convertToAppInvoice(docRef.id, invoiceData);
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
          const invoiceRef = doc(db, 'invoices', invoiceId);
          await deleteDoc(invoiceRef);
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
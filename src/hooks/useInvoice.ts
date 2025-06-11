import { useState, useCallback } from 'react';
import { Invoice, LineItem, CompanyInfo, ClientInfo } from '../types/invoice';
import { generateInvoiceNumber } from '../utils/invoiceUtils';

const initialCompanyInfo: CompanyInfo = {
  name: 'KiwisMedia Technologies Pvt. Ltd.',
  contactName: '',
  address: 'HNO 238 , Bhati Abhoynagar, Nr\nVivekananda club rd, Agartala\nWard No - 1, P.O - Ramnagar,\nAgartala, West Tripura TR\n799002 IN.',
  city: 'Agartala',
  state: 'West Tripura',
  country: 'India',
  email: '',
  website: '',
  logo: '/fueler_logo.png',
  signature: '/signature.png.jpg',
};

const initialClientInfo: ClientInfo = {
  name: '',
  address: '',
  city: '',
  state: '',
  country: 'India',
  email: '',
  gstin: '',
};

const createInitialInvoice = (): Invoice => ({
  id: crypto.randomUUID(),
  invoiceNumber: generateInvoiceNumber(),
  date: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  company: initialCompanyInfo,
  client: initialClientInfo,
  items: [],
  subtotal: 0,
  tax: 0,
  taxRate: 0, // Default tax rate is 0
  discount: 0,
  discountType: 'percentage',
  total: 0,
  currency: 'INR', // Default currency is INR
  exchangeRate: 1,
  notes: '',
  paymentTerms: 'Payment due within 30 days\n\nBank Payment Details:\nKiwisMedia Technologies Private Limited.\nBank: IDFC Bank First\nA/C no: 10043617893\nIFSC: IDF80040101',
  status: 'draft',
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const useInvoice = () => {
  const [invoice, setInvoice] = useState<Invoice>(createInitialInvoice());

  const updateCompanyInfo = useCallback((companyInfo: Partial<CompanyInfo>) => {
    setInvoice(prev => ({
      ...prev,
      company: { ...prev.company, ...companyInfo },
      updatedAt: new Date(),
    }));
  }, []);

  const updateClientInfo = useCallback((clientInfo: Partial<ClientInfo>) => {
    setInvoice(prev => ({
      ...prev,
      client: { ...prev.client, ...clientInfo },
      updatedAt: new Date(),
    }));
  }, []);

  const addLineItem = useCallback(() => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
    };
    
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, newItem],
      updatedAt: new Date(),
    }));
  }, []);

  const updateLineItem = useCallback((id: string, updates: Partial<LineItem>) => {
    setInvoice(prev => {
      const updatedItems = prev.items.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, ...updates };
          updatedItem.amount = updatedItem.quantity * updatedItem.rate;
          return updatedItem;
        }
        return item;
      });

      const subtotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
      const discountAmount = prev.discountType === 'percentage' 
        ? (subtotal * prev.discount) / 100 
        : prev.discount;
      const taxableAmount = subtotal - discountAmount;
      const tax = (taxableAmount * prev.taxRate) / 100;
      const total = taxableAmount + tax;

      return {
        ...prev,
        items: updatedItems,
        subtotal,
        tax,
        total,
        updatedAt: new Date(),
      };
    });
  }, []);

  const removeLineItem = useCallback((id: string) => {
    setInvoice(prev => {
      const updatedItems = prev.items.filter(item => item.id !== id);
      const subtotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);
      const discountAmount = prev.discountType === 'percentage' 
        ? (subtotal * prev.discount) / 100 
        : prev.discount;
      const taxableAmount = subtotal - discountAmount;
      const tax = (taxableAmount * prev.taxRate) / 100;
      const total = taxableAmount + tax;

      return {
        ...prev,
        items: updatedItems,
        subtotal,
        tax,
        total,
        updatedAt: new Date(),
      };
    });
  }, []);

  const updateInvoiceDetails = useCallback((updates: Partial<Invoice>) => {
    setInvoice(prev => {
      const updated = { ...prev, ...updates, updatedAt: new Date() };
      
      // Recalculate totals if tax rate or discount changes
      if ('taxRate' in updates || 'discount' in updates || 'discountType' in updates) {
        const subtotal = updated.items.reduce((sum, item) => sum + item.amount, 0);
        const discountAmount = updated.discountType === 'percentage' 
          ? (subtotal * updated.discount) / 100 
          : updated.discount;
        const taxableAmount = subtotal - discountAmount;
        const tax = (taxableAmount * updated.taxRate) / 100;
        const total = taxableAmount + tax;
        
        updated.subtotal = subtotal;
        updated.tax = tax;
        updated.total = total;
      }
      
      return updated;
    });
  }, []);

  const resetInvoice = useCallback(() => {
    setInvoice(createInitialInvoice());
  }, []);

  return {
    invoice,
    updateCompanyInfo,
    updateClientInfo,
    addLineItem,
    updateLineItem,
    removeLineItem,
    updateInvoiceDetails,
    resetInvoice,
  };
};
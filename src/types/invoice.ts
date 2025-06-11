export interface CompanyInfo {
  name: string;
  contactName?: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  email: string;
  website: string;
  logo?: string;
  signature?: string;
}

export interface ClientInfo {
  name: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  email: string;
  gstin?: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  company: CompanyInfo;
  client: ClientInfo;
  items: LineItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  total: number;
  currency: 'USD' | 'INR';
  exchangeRate: number;
  notes: string;
  paymentTerms: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdAt: Date;
  updatedAt: Date;
}

export interface CurrencyRates {
  USD: number;
  INR: number;
  lastUpdated: Date;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
}
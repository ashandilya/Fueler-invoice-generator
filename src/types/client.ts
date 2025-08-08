export interface Client {
  id: string;
  name: string;
  email: string;
  businessName: string;
  vendorName?: string; // For database mapping
  phone?: string;
  gstin?: string;
  city?: string;
  state?: string;
  country?: string;
  billingAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientInvoice {
  clientId: string;
  invoiceId: string;
  invoiceNumber: string;
  date: Date;
  amount: number;
  currency: 'USD' | 'INR';
  status: 'draft' | 'sent' | 'paid' | 'overdue';
}
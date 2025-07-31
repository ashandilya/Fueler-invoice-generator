export interface Vendor {
  id: string;
  name: string;
  email: string;
  businessName: string;
  phone?: string;
  gstin?: string;
  billingAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VendorInvoice {
  vendorId: string;
  invoiceId: string;
  invoiceNumber: string;
  date: Date;
  amount: number;
  currency: 'USD' | 'INR';
  status: 'draft' | 'sent' | 'paid' | 'overdue';
}
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface User {
  user_id: string;
  email: string;
  created_at: string;
}

export interface CompanyProfile {
  user_id: string;
  company_name?: string;
  company_address?: string;
  city?: string;
  state?: string;
  country?: string;
  company_logo_url?: string;
  digital_signature_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseVendor {
  vendor_id: string;
  user_id: string;
  vendor_name: string;
  business_name: string;
  email: string;
  phone?: string;
  gstin?: string;
  billing_address: string;
  city?: string;
  state?: string;
  country?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseInvoice {
  invoice_id: string;
  user_id: string;
  vendor_id?: string;
  invoice_number: string;
  date: string;
  due_date: string;
  total_amount: number;
  currency: 'USD' | 'INR';
  line_items: any[];
  notes?: string;
  payment_terms?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  created_at: string;
  updated_at: string;
}
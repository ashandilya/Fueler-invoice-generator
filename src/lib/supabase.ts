import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client with simplified, stable configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable to prevent URL parsing issues
    flowType: 'implicit' // Use simpler flow
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

// Utility function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && 
    supabaseUrl.startsWith('https://') && 
    supabaseAnonKey.length > 20);
};

// Simplified session getter without retry loops
export const getCurrentSession = async (): Promise<any> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Session error:', error);
      return { session: null, user: null };
    }
    return data;
  } catch (error) {
    console.error('Failed to get session:', error);
    return { session: null, user: null };
  }
};

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
  invoice_prefix?: string;
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
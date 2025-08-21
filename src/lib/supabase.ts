import { createClient } from '@supabase/supabase-js';

// Production Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

console.log('🔧 Supabase Config Check:');
console.log('📍 URL:', supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING');
console.log('🔑 Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING');

// Create Supabase client with optimized configuration for stability
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Better security
    debug: false,
    storageKey: 'invoicce-auth'
  },
  global: {
    headers: {
      'X-Client-Info': 'invoicce-app',
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    fetch: async (url, options = {}) => {
      console.log('🌐 Supabase Request:', url);
      
      // Ensure we're not connecting to localhost in production
      if (url.includes('localhost') && window.location.hostname !== 'localhost') {
        console.error('❌ Attempted localhost connection in production:', url);
        throw new Error('Invalid localhost connection in production environment');
      }
      
      // Create abort controller for manual timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('⏰ Supabase request timeout for:', url);
        controller.abort();
      }, 15000); // 15 second timeout
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            ...options.headers,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        clearTimeout(timeoutId);
        console.log('✅ Supabase response:', response.status, response.statusText);
        
        // Check if response is ok
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('❌ Supabase fetch error:', error);
        // Convert AbortError to a more user-friendly error
        if (error.name === 'AbortError') {
          throw new Error('Database connection timeout. Please check your internet connection and try again.');
        }
        throw error;
      }
    }
  },
  db: {
    schema: 'public'
  },
  // Disable realtime to prevent localhost WebSocket connections
  realtime: {
    disabled: true,
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

// Utility function to get current session with retry
export const getCurrentSession = async (retries = 1): Promise<any> => {
  console.log(`🔍 Getting current session (${retries} retries remaining)`);
  
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`📡 Session attempt ${i + 1}/${retries}`);
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error(`❌ Session error on attempt ${i + 1}:`, error);
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 300)); // Even shorter delay
        continue;
      }
      
      console.log(`✅ Session retrieved successfully on attempt ${i + 1}`);
      return data;
    } catch (error) {
      console.error(`💥 Session exception on attempt ${i + 1}:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 300)); // Even shorter delay
    }
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
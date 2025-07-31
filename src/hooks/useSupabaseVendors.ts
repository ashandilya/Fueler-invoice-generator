import { useState, useEffect, useCallback } from 'react';
import { supabase, DatabaseVendor } from '../lib/supabase';
import { useAuth } from './useAuth';
import { Vendor } from '../types/vendor';

// Convert database vendor to app vendor format
const convertToAppVendor = (dbVendor: DatabaseVendor): Vendor => ({
  id: dbVendor.vendor_id,
  name: dbVendor.vendor_name,
  email: dbVendor.email,
  businessName: dbVendor.business_name,
  phone: dbVendor.phone,
  gstin: dbVendor.gstin,
  city: dbVendor.city,
  state: dbVendor.state,
  country: dbVendor.country,
  billingAddress: dbVendor.billing_address,
  createdAt: new Date(dbVendor.created_at),
  updatedAt: new Date(dbVendor.updated_at),
});

// Convert app vendor to database format
const convertToDbVendor = (vendor: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Omit<DatabaseVendor, 'vendor_id' | 'created_at' | 'updated_at'> => ({
  user_id: userId,
  vendor_name: vendor.name,
  business_name: vendor.businessName,
  email: vendor.email,
  phone: vendor.phone,
  gstin: vendor.gstin,
  billing_address: vendor.billingAddress,
  city: vendor.city,
  state: vendor.state,
  country: vendor.country,
});

export const useSupabaseVendors = () => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVendors = useCallback(async () => {
    if (!user) {
      setVendors([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const appVendors = data.map(convertToAppVendor);
      setVendors(appVendors);

      // Cache in localStorage
      localStorage.setItem(`vendors_${user.id}`, JSON.stringify(appVendors));
    } catch (err) {
      console.error('Error fetching vendors:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vendors');
      
      // Try to load from cache on error
      try {
        const cached = localStorage.getItem(`vendors_${user.id}`);
        if (cached) {
          const cachedVendors = JSON.parse(cached, (key, value) => {
            if (key === 'createdAt' || key === 'updatedAt') {
              return new Date(value);
            }
            return value;
          });
          setVendors(cachedVendors);
        }
      } catch (cacheError) {
        console.error('Error loading cached vendors:', cacheError);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addVendor = useCallback(async (vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vendor> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const dbVendor = convertToDbVendor(vendorData, user.id);

      const { data, error } = await supabase
        .from('vendors')
        .insert(dbVendor)
        .select()
        .single();

      if (error) throw error;

      const newVendor = convertToAppVendor(data);
      setVendors(prev => [newVendor, ...prev]);

      // Update cache
      const updatedVendors = [newVendor, ...vendors];
      localStorage.setItem(`vendors_${user.id}`, JSON.stringify(updatedVendors));

      return newVendor;
    } catch (err) {
      console.error('Error adding vendor:', err);
      setError(err instanceof Error ? err.message : 'Failed to add vendor');
      throw err;
    }
  }, [user, vendors]);

  const updateVendor = useCallback(async (id: string, updates: Partial<Vendor>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);

      const { error } = await supabase
        .from('vendors')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('vendor_id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setVendors(prev => prev.map(vendor => 
        vendor.id === id 
          ? { ...vendor, ...updates, updatedAt: new Date() }
          : vendor
      ));

      // Update cache
      const updatedVendors = vendors.map(vendor => 
        vendor.id === id 
          ? { ...vendor, ...updates, updatedAt: new Date() }
          : vendor
      );
      localStorage.setItem(`vendors_${user.id}`, JSON.stringify(updatedVendors));
    } catch (err) {
      console.error('Error updating vendor:', err);
      setError(err instanceof Error ? err.message : 'Failed to update vendor');
      throw err;
    }
  }, [user, vendors]);

  const deleteVendor = useCallback(async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);

      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('vendor_id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setVendors(prev => prev.filter(vendor => vendor.id !== id));

      // Update cache
      const updatedVendors = vendors.filter(vendor => vendor.id !== id);
      localStorage.setItem(`vendors_${user.id}`, JSON.stringify(updatedVendors));
    } catch (err) {
      console.error('Error deleting vendor:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete vendor');
      throw err;
    }
  }, [user, vendors]);

  const getVendorById = useCallback((id: string): Vendor | undefined => {
    return vendors.find(vendor => vendor.id === id);
  }, [vendors]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Load from cache immediately while fetching
  useEffect(() => {
    if (user) {
      try {
        const cached = localStorage.getItem(`vendors_${user.id}`);
        if (cached) {
          const cachedVendors = JSON.parse(cached, (key, value) => {
            if (key === 'createdAt' || key === 'updatedAt') {
              return new Date(value);
            }
            return value;
          });
          setVendors(cachedVendors);
        }
      } catch (error) {
        console.error('Error loading cached vendors:', error);
      }
    }
  }, [user]);

  return {
    vendors,
    loading,
    error,
    addVendor,
    updateVendor,
    deleteVendor,
    getVendorById,
    refetch: fetchVendors,
  };
};
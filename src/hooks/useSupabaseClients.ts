import { useState, useEffect, useCallback } from 'react';
import { supabase, DatabaseVendor } from '../lib/supabase';
import { useAuth } from './useAuth';
import { Client } from '../types/client';

// Convert database vendor to app client format
const convertToAppClient = (dbVendor: DatabaseVendor): Client => ({
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

// Convert app client to database format
const convertToDbClient = (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Omit<DatabaseVendor, 'vendor_id' | 'created_at' | 'updated_at'> => ({
  user_id: userId,
  vendor_name: client.name,
  business_name: client.businessName,
  email: client.email,
  phone: client.phone,
  gstin: client.gstin,
  billing_address: client.billingAddress,
  city: client.city,
  state: client.state,
  country: client.country,
});

export const useSupabaseClients = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    if (!user) {
      setClients([]);
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

      const appClients = data.map(convertToAppClient);
      setClients(appClients);

      // Cache in localStorage
      localStorage.setItem(`clients_${user.id}`, JSON.stringify(appClients));
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch clients');
      
      // Try to load from cache on error
      try {
        const cached = localStorage.getItem(`clients_${user.id}`);
        if (cached) {
          const cachedClients = JSON.parse(cached, (key, value) => {
            if (key === 'createdAt' || key === 'updatedAt') {
              return new Date(value);
            }
            return value;
          });
          setClients(cachedClients);
        }
      } catch (cacheError) {
        console.error('Error loading cached clients:', cacheError);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addClient = useCallback(async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> => {
    if (!user) throw new Error('User not authenticated');

    // Validate client data before saving
    if (!clientData.name.trim()) {
      throw new Error('Client name is required');
    }
    if (!clientData.email.trim()) {
      throw new Error('Email is required');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientData.email)) {
      throw new Error('Please enter a valid email address');
    }
    if (!clientData.businessName.trim()) {
      throw new Error('Business name is required');
    }
    if (!clientData.billingAddress.trim()) {
      throw new Error('Billing address is required');
    }

    try {
      setError(null);
      const dbClient = convertToDbClient(clientData, user.id);

      const { data, error } = await supabase
        .from('vendors')
        .insert(dbClient)
        .select()
        .single();

      if (error) throw error;

      const newClient = convertToAppClient(data);
      setClients(prev => [newClient, ...prev]);

      // Update cache
      const updatedClients = [newClient, ...clients];
      localStorage.setItem(`clients_${user.id}`, JSON.stringify(updatedClients));

      return newClient;
    } catch (err) {
      console.error('Error adding client:', err);
      setError(err instanceof Error ? err.message : 'Failed to add client');
      throw err;
    }
  }, [user, clients]);

  const updateClient = useCallback(async (id: string, updates: Partial<Client>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    // Validate updates if they contain required fields
    if (updates.name !== undefined && !updates.name.trim()) {
      throw new Error('Client name cannot be empty');
    }
    if (updates.email !== undefined && (!updates.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email))) {
      throw new Error('Please enter a valid email address');
    }
    if (updates.businessName !== undefined && !updates.businessName.trim()) {
      throw new Error('Business name cannot be empty');
    }
    if (updates.billingAddress !== undefined && !updates.billingAddress.trim()) {
      throw new Error('Billing address cannot be empty');
    }

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

      setClients(prev => prev.map(client => 
        client.id === id 
          ? { ...client, ...updates, updatedAt: new Date() }
          : client
      ));

      // Update cache
      const updatedClients = clients.map(client => 
        client.id === id 
          ? { ...client, ...updates, updatedAt: new Date() }
          : client
      );
      localStorage.setItem(`clients_${user.id}`, JSON.stringify(updatedClients));
    } catch (err) {
      console.error('Error updating client:', err);
      setError(err instanceof Error ? err.message : 'Failed to update client');
      throw err;
    }
  }, [user, clients]);

  const deleteClient = useCallback(async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);

      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('vendor_id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setClients(prev => prev.filter(client => client.id !== id));

      // Update cache
      const updatedClients = clients.filter(client => client.id !== id);
      localStorage.setItem(`clients_${user.id}`, JSON.stringify(updatedClients));
    } catch (err) {
      console.error('Error deleting client:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete client');
      throw err;
    }
  }, [user, clients]);

  const getClientById = useCallback((id: string): Client | undefined => {
    return clients.find(client => client.id === id);
  }, [clients]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Load from cache immediately while fetching
  useEffect(() => {
    if (user) {
      try {
        const cached = localStorage.getItem(`clients_${user.id}`);
        if (cached) {
          const cachedClients = JSON.parse(cached, (key, value) => {
            if (key === 'createdAt' || key === 'updatedAt') {
              return new Date(value);
            }
            return value;
          });
          setClients(cachedClients);
        }
      } catch (error) {
        console.error('Error loading cached clients:', error);
      }
    }
  }, [user]);

  return {
    clients,
    loading,
    error,
    addClient,
    updateClient,
    deleteClient,
    getClientById,
    refetch: fetchClients,
  };
};
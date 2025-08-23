import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useErrorHandler } from './useErrorHandler';
import { Client } from '../types/client';

export const useSupabaseClients = () => {
  const { user } = useAuth();
  const { handleAsyncOperation, validateForm } = useErrorHandler();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Validation rules
  const clientValidationRules = {
    name: {
      required: true,
      minLength: 1,
      maxLength: 100
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      customMessage: 'Please enter a valid email address'
    },
    billingAddress: {
      required: true,
      minLength: 5,
      maxLength: 500
    }
  };

  const fetchClients = useCallback(async () => {
    if (!user) {
      setClients([]);
      return;
    }

    setLoading(true);
    
    const result = await handleAsyncOperation(
      async () => {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        return data.map(client => ({
          id: client.id,
          name: client.name,
          email: client.email,
          businessName: client.business_name,
          phone: client.phone,
          gstin: client.gstin,
          city: client.city,
          state: client.state,
          country: client.country || 'India',
          billingAddress: client.billing_address,
          createdAt: new Date(client.created_at),
          updatedAt: new Date(client.updated_at),
        }));
      },
      'fetchClients'
    );

    if (result) {
      setClients(result);
    }
    
    setLoading(false);
  }, [user, handleAsyncOperation]);

  const addClient = useCallback(
    async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> => {
      if (!user) throw new Error('User not authenticated');

      // Validate form data
      const validationErrors = validateForm(clientData, clientValidationRules);
      if (Object.keys(validationErrors).length > 0) {
        const firstError = Object.values(validationErrors)[0];
        throw new Error(firstError);
      }

      setSaving(true);

      try {
        const { data, error } = await supabase
          .from('clients')
          .insert({
            name: clientData.name.trim(),
            email: clientData.email.toLowerCase().trim(),
            business_name: (clientData.businessName || clientData.name).trim(),
            phone: clientData.phone?.trim(),
            gstin: clientData.gstin?.trim(),
            city: clientData.city?.trim(),
            state: clientData.state?.trim(),
            country: clientData.country?.trim() || 'India',
            billing_address: clientData.billingAddress.trim(),
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        const newClient: Client = {
          id: data.id,
          name: data.name,
          email: data.email,
          businessName: data.business_name,
          phone: data.phone,
          gstin: data.gstin,
          city: data.city,
          state: data.state,
          country: data.country,
          billingAddress: data.billing_address,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };
        
        // Update local state
        setClients(prev => [newClient, ...prev]);
        
        // Show success message
        const event = new CustomEvent('showToast', {
          detail: {
            message: 'Client saved successfully!',
            type: 'success'
          }
        });
        window.dispatchEvent(event);

        return newClient;
      } catch (error) {
        console.error('Failed to add client:', error);
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [user, validateForm]
  );

  const updateClient = useCallback(
    async (id: string, updates: Partial<Client>): Promise<void> => {
      if (!user) throw new Error('User not authenticated');

      // Validate updates
      const validationErrors = validateForm(updates, clientValidationRules);
      if (Object.keys(validationErrors).length > 0) {
        const firstError = Object.values(validationErrors)[0];
        throw new Error(firstError);
      }

      setSaving(true);

      try {
        const { error } = await supabase
          .from('clients')
          .update({
            name: updates.name?.trim(),
            email: updates.email?.toLowerCase().trim(),
            business_name: updates.businessName?.trim(),
            phone: updates.phone?.trim(),
            gstin: updates.gstin?.trim(),
            city: updates.city?.trim(),
            state: updates.state?.trim(),
            country: updates.country?.trim(),
            billing_address: updates.billingAddress?.trim(),
          })
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        
        // Update local state
        setClients(prev =>
          prev.map(client =>
            client.id === id
              ? { ...client, ...updates, updatedAt: new Date() }
              : client
          )
        );

        // Show success message
        const event = new CustomEvent('showToast', {
          detail: {
            message: 'Client updated successfully!',
            type: 'success'
          }
        });
        window.dispatchEvent(event);
      } catch (error) {
        console.error('Failed to update client:', error);
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [user, validateForm]
  );

  const deleteClient = useCallback(
    async (id: string): Promise<void> => {
      if (!user) throw new Error('User not authenticated');

      setSaving(true);

      try {
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        
        // Update local state
        setClients(prev => prev.filter(client => client.id !== id));

        // Show success message
        const event = new CustomEvent('showToast', {
          detail: {
            message: 'Client deleted successfully!',
            type: 'success'
          }
        });
        window.dispatchEvent(event);
      } catch (error) {
        console.error('Failed to delete client:', error);
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [user]
  );

  const getClientById = useCallback(
    (id: string): Client | undefined => {
      return clients.find(client => client.id === id);
    },
    [clients]
  );

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    loading,
    saving,
    addClient,
    updateClient,
    deleteClient,
    getClientById,
    refetch: fetchClients,
  };
};
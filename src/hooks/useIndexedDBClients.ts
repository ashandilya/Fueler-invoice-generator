import { useState, useEffect, useCallback } from 'react';
import { Client } from '../types/client';
import { indexedDBManager, DBClient } from '../lib/indexedDB';
import { useErrorHandler } from './useErrorHandler';

const convertToAppClient = (dbClient: DBClient): Client => ({
  id: dbClient.id,
  name: dbClient.name,
  email: dbClient.email,
  businessName: dbClient.businessName,
  phone: dbClient.phone,
  gstin: dbClient.gstin,
  city: dbClient.city,
  state: dbClient.state,
  country: dbClient.country || 'India',
  billingAddress: dbClient.billingAddress,
  createdAt: new Date(dbClient.createdAt),
  updatedAt: new Date(dbClient.updatedAt),
});

export const useIndexedDBClients = () => {
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
    setLoading(true);
    
    const result = await handleAsyncOperation(
      async () => {
        const dbClients = await indexedDBManager.getClients();
        return dbClients.map(convertToAppClient);
      },
      'fetchClients'
    );

    if (result) {
      setClients(result);
    }
    
    setLoading(false);
  }, [handleAsyncOperation]);

  const addClient = useCallback(
    async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Promise<Client> => {
      console.log('🔄 IndexedDB: Adding client:', clientData.name);

      // Validate form data
      const validationErrors = validateForm(clientData, clientValidationRules);
      if (Object.keys(validationErrors).length > 0) {
        const firstError = Object.values(validationErrors)[0];
        throw new Error(firstError);
      }

      setSaving(true);

      try {
        const dbClient = await indexedDBManager.addClient({
          name: clientData.name.trim(),
          email: clientData.email.toLowerCase().trim(),
          businessName: (clientData.businessName || clientData.name).trim(),
          phone: clientData.phone?.trim(),
          gstin: clientData.gstin?.trim(),
          city: clientData.city?.trim(),
          state: clientData.state?.trim(),
          country: clientData.country?.trim() || 'India',
          billingAddress: clientData.billingAddress.trim(),
        });

        const newClient = convertToAppClient(dbClient);
        
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
        console.error('❌ IndexedDB: Failed to add client:', error);
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [validateForm]
  );

  const updateClient = useCallback(
    async (id: string, updates: Partial<Client>): Promise<void> => {
      console.log('🔄 IndexedDB: Updating client:', id);

      // Validate updates
      const validationErrors = validateForm(updates, clientValidationRules);
      if (Object.keys(validationErrors).length > 0) {
        const firstError = Object.values(validationErrors)[0];
        throw new Error(firstError);
      }

      setSaving(true);

      try {
        await indexedDBManager.updateClient(id, updates);
        
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
        console.error('❌ IndexedDB: Failed to update client:', error);
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [validateForm]
  );

  const deleteClient = useCallback(
    async (id: string): Promise<void> => {
      console.log('🔄 IndexedDB: Deleting client:', id);

      setSaving(true);

      try {
        await indexedDBManager.deleteClient(id);
        
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
        console.error('❌ IndexedDB: Failed to delete client:', error);
        throw error;
      } finally {
        setSaving(false);
      }
    },
    []
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
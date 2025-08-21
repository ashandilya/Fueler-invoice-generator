import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import { useErrorHandler } from './useErrorHandler';
import { Client } from '../types/client';

const convertToAppClient = (id: string, data: any): Client => ({
  id,
  name: data.name,
  email: data.email,
  businessName: data.businessName,
  phone: data.phone,
  gstin: data.gstin,
  city: data.city,
  state: data.state,
  country: data.country || 'India',
  billingAddress: data.billingAddress,
  createdAt: data.createdAt?.toDate() || new Date(),
  updatedAt: data.updatedAt?.toDate() || new Date(),
});

export const useFirebaseClients = () => {
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
        const clientsRef = collection(db, 'clients');
        const q = query(
          clientsRef,
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const clientsData = querySnapshot.docs.map(doc => 
          convertToAppClient(doc.id, doc.data())
        );
        
        return clientsData;
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
        const clientsRef = collection(db, 'clients');
        const newClientData = {
          ...clientData,
          userId: user.uid,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        const docRef = await addDoc(clientsRef, newClientData);
        const newClient = convertToAppClient(docRef.id, newClientData);
        
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
        const clientRef = doc(db, 'clients', id);
        await updateDoc(clientRef, {
          ...updates,
          updatedAt: Timestamp.now(),
        });
        
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
        const clientRef = doc(db, 'clients', id);
        await deleteDoc(clientRef);
        
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
import { useState, useEffect, useCallback } from "react";
import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { supabase, DatabaseVendor, isSupabaseConfigured, getCurrentSession } from "../lib/supabase";
import { useAuth } from "./useAuth";
import { useErrorHandler } from "./useErrorHandler";
import { Client } from "../types/client";
import { connectionManager } from "../utils/connectionManager";

// Simple timeout wrapper for Supabase operations
const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number = 10000
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
};

const convertToAppClient = (dbVendor: DatabaseVendor): Client => ({
  id: dbVendor.vendor_id,
  name: dbVendor.business_name,
  email: dbVendor.email,
  businessName: dbVendor.business_name,
  vendorName: dbVendor.vendor_name,
  phone: dbVendor.phone,
  gstin: dbVendor.gstin,
  city: dbVendor.city,
  state: dbVendor.state,
  country: dbVendor.country,
  billingAddress: dbVendor.billing_address,
  createdAt: new Date(dbVendor.created_at),
  updatedAt: new Date(dbVendor.updated_at),
});

export const useSupabaseClients = () => {
  const { user } = useAuth();
  const { handleAsyncOperation, validateForm } = useErrorHandler();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  

  const fetchClients = useCallback(async () => {
    if (!user) {
      setClients([]);
      return;
    }

    setLoading(true);
    
    const result = await handleAsyncOperation(
      async () => {
        const { data, error } = await withTimeout(
          supabase
            .from("vendors")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          8000 // 8 second timeout
        );

        if (error) throw error;
        return data;
      },
      'fetchClients'
    );

    if (result) {
      const appClients = result.map(convertToAppClient);
      setClients(appClients);
    }
    
    setLoading(false);
  }, [user, handleAsyncOperation]);

  // Validation rules for client data
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
    },
    phone: {
      pattern: /^[\+]?[1-9][\d]{0,15}$/,
      customMessage: 'Please enter a valid phone number'
    },
    gstin: {
      custom: (value: string) => !value || value.length === 15,
      customMessage: 'GSTIN must be exactly 15 characters'
    }
  };

  const addClient = useCallback(
    async (
      clientData: Omit<Client, "id" | "createdAt" | "updatedAt">
    ): Promise<Client> => {
      console.log('🔄 addClient called with data:', clientData);
      
      if (!user) throw new Error("User not authenticated");

      console.log('👤 User authenticated:', user.id);

      if (!isSupabaseConfigured()) {
        console.error('❌ Supabase not configured properly');
        throw new Error("Database connection not configured. Please check your environment variables.");
      }
      console.log('✅ Supabase configuration verified');

      // Validate form data
      const validationErrors = validateForm(clientData, clientValidationRules);
      if (Object.keys(validationErrors).length > 0) {
        console.error('❌ Validation failed:', validationErrors);
        const firstError = Object.values(validationErrors)[0];
        throw new Error(firstError);
      }
      
      console.log('✅ Validation passed');

      setSaving(true);
      console.log('🔄 Setting saving state to true');

      try {
        console.log('🚀 Starting database operation...');
        
        const result = await handleAsyncOperation(
          async () => {
            console.log('🚀 Starting Supabase insert operation...');
            
            // Prepare client data
            const dbClient = {
              user_id: user.id,
              vendor_name: clientData.name.trim(),
              business_name: (clientData.businessName || clientData.name).trim(),
              email: clientData.email.toLowerCase().trim(),
              phone: clientData.phone?.trim() || null,
              gstin: clientData.gstin?.trim() || null,
              billing_address: clientData.billingAddress.trim(),
              city: clientData.city?.trim() || null,
              state: clientData.state?.trim() || null,
              country: clientData.country?.trim() || "India",
            };
            
            console.log('📝 Prepared database client data:', dbClient);
            console.log('🌐 Making Supabase request...');
            
            const { data, error } = await withTimeout(
              supabase
                .from("vendors")
                .insert(dbClient)
                .select()
                .single(),
              10000 // 10 second timeout for insert
            );

            console.log('📡 Supabase response received');
            console.log('📊 Data:', data);
            console.log('⚠️ Error:', error);

            if (error) {
              console.error('❌ Supabase error:', error);
              throw error;
            }

            if (!data) {
              console.error('❌ No data returned from insert operation');
              throw new Error("No data returned from insert operation");
            }
            
            console.log('✅ Database operation successful');
            return convertToAppClient(data);
          },
          'addClient',
          {
            showSuccess: true,
            successMessage: 'Client saved successfully!',
            retries: 2
          }
        );

        console.log('🎉 Operation completed, result:', result);
        setSaving(false);

        if (result) {
          // Update local state with the new client
          console.log('🔄 Updating local state...');
          setClients((prev) => [result, ...prev]);
          console.log('✅ Local state updated');
          
          // Show success message
          const event = new CustomEvent('showToast', {
            detail: {
              message: 'Client saved successfully!',
              type: 'success'
            }
          });
          window.dispatchEvent(event);
          
          return result;
        }

        throw new Error("Failed to create client");
        
      } catch (error) {
        console.error('💥 Final error in addClient:', error);
        
        setSaving(false);
        
        throw error;
      }
    },
    [user, handleAsyncOperation, validateForm]
  );

  const updateClient = useCallback(
    async (id: string, updates: Partial<Client>): Promise<void> => {
      if (!user) throw new Error("User not authenticated");

      // Validate updates
      const validationErrors = validateForm(updates, clientValidationRules);
      if (Object.keys(validationErrors).length > 0) {
        const firstError = Object.values(validationErrors)[0];
        throw new Error(firstError);
      }

      setSaving(true);

      const result = await handleAsyncOperation(
        async () => {
          // Get current client for version check
          const currentClient = clients.find(c => c.id === id);
          if (!currentClient) {
            throw new Error("Client not found");
          }

          // Prepare database updates with proper field mapping
          const dbUpdates: any = {
            updated_at: new Date().toISOString(),
          };

          if (updates.name !== undefined) {
            dbUpdates.vendor_name = updates.name;
            dbUpdates.business_name = updates.businessName || updates.name;
          }
          if (updates.businessName !== undefined) {
            dbUpdates.business_name = updates.businessName;
          }
          if (updates.email !== undefined) {
            dbUpdates.email = updates.email;
          }
          if (updates.phone !== undefined) {
            dbUpdates.phone = updates.phone || null;
          }
          if (updates.gstin !== undefined) {
            dbUpdates.gstin = updates.gstin || null;
          }
          if (updates.billingAddress !== undefined) {
            dbUpdates.billing_address = updates.billingAddress;
          }
          if (updates.city !== undefined) {
            dbUpdates.city = updates.city || null;
          }
          if (updates.state !== undefined) {
            dbUpdates.state = updates.state || null;
          }
          if (updates.country !== undefined) {
            dbUpdates.country = updates.country || "India";
          }

          // Check for conflicts by comparing updated_at timestamp
          const { error } = await withTimeout(
            supabase
              .from("vendors")
              .update(dbUpdates)
              .eq("vendor_id", id)
              .eq("user_id", user.id)
              .eq("updated_at", currentClient.updatedAt.toISOString()),
            8000
          );

          if (error) {
            throw error;
          }
        },
        'updateClient',
        {
          showLoading: true,
          showSuccess: true,
          successMessage: 'Client updated successfully!',
          retries: 3
        }
      );

      setSaving(false);

      if (result !== null) {
        // Update local state
        setClients((prev) =>
          prev.map((client) =>
            client.id === id
              ? { ...client, ...updates, updatedAt: new Date() }
              : client
          )
        );
      }
    },
    [user, clients, handleAsyncOperation, validateForm]
  );

  const deleteClient = useCallback(
    async (id: string): Promise<void> => {
      if (!user) throw new Error("User not authenticated");

      setSaving(true);

      const result = await handleAsyncOperation(
        async () => {
          const { error } = await withTimeout(
            supabase
              .from("vendors")
              .delete()
              .eq("vendor_id", id)
              .eq("user_id", user.id),
            8000
          );

          if (error) throw error;
        },
        'deleteClient',
        {
          showLoading: true,
          showSuccess: true,
          successMessage: 'Client deleted successfully!',
          retries: 2
        }
      );

      setSaving(false);

      if (result !== null) {
        // Update local state
        setClients((prev) => prev.filter((client) => client.id !== id));
      }
    },
    [user, handleAsyncOperation]
  );

  const getClientById = useCallback(
    (id: string): Client | undefined => {
      return clients.find((client) => client.id === id);
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

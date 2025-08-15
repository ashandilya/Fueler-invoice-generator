import { useState, useEffect, useCallback } from "react";
import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { supabase, DatabaseVendor, isSupabaseConfigured, getCurrentSession } from "../lib/supabase";
import { useAuth } from "./useAuth";
import { Client } from "../types/client";

// Retry utility with exponential backoff
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}`);
      const result = await operation();
      console.log(`Operation succeeded on attempt ${attempt}`);
      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        console.error('All retry attempts failed');
        throw lastError;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

// Check if user is online
const checkOnlineStatus = (): boolean => {
  return navigator.onLine;
};

// Debounce utility for preventing rapid saves
const createDebouncer = (delay: number = 5000) => {
  let lastSaveTime = 0;
  
  return {
    canSave: (): boolean => {
      const now = Date.now();
      return now - lastSaveTime > delay;
    },
    markSaved: (): void => {
      lastSaveTime = Date.now();
    }
  };
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
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Create debouncer instance
  const debouncer = createDebouncer(5000);

  const fetchClients = useCallback(async () => {
    if (!user) {
      setClients([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const appClients = data.map(convertToAppClient);
      setClients(appClients);
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addClient = useCallback(
    async (
      clientData: Omit<Client, "id" | "createdAt" | "updatedAt">
    ): Promise<Client> => {
      if (!user) throw new Error("User not authenticated");

      // Check online status
      if (!checkOnlineStatus()) {
        throw new Error("You appear to be offline. Please check your internet connection and try again.");
      }

      // Check debounce
      if (!debouncer.canSave()) {
        throw new Error("Too many requests. Please wait a moment before saving again.");
      }

      // Check Supabase configuration
      if (!isSupabaseConfigured()) {
        throw new Error("Supabase is not properly configured. Please check your environment variables.");
      }

      // Validate input data
      if (!clientData.name.trim()) {
        throw new Error("Client name is required");
      }
      if (!clientData.email.trim()) {
        throw new Error("Email is required");
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientData.email)) {
        throw new Error("Please enter a valid email address");
      }
      if (!clientData.billingAddress.trim()) {
        throw new Error("Billing address is required");
      }

      console.log('Starting client creation process...');
      setError(null);
      setSaving(true);
      
      // Set up timeout warning
      const timeoutWarning = setTimeout(() => {
        console.log("Saving is taking longer than usual...");
      }, 5000);

      try {
        // Mark save attempt
        debouncer.markSaved();

        // Use retry mechanism for the entire operation
        const newClient = await retryWithBackoff(async () => {
          // Step 1: Verify authentication with retry
          console.log('Verifying authentication...');
          const { session } = await getCurrentSession();
          
          if (!session?.user) {
            throw new Error("No active session. Please sign in again.");
          }
          
          if (session.user.id !== user.id) {
            throw new Error("Session user mismatch. Please refresh and try again.");
          }
          
          console.log('Authentication verified for user:', session.user.email);
          
          // Step 2: Prepare client data
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
          
          console.log('Prepared client data:', dbClient);
          
          // Step 3: Insert into database
          console.log('Inserting client into database...');
          const { data, error } = await supabase
            .from("vendors")
            .insert(dbClient)
            .select()
            .single();

          if (error) {
            console.error("Database insert error:", error);
            
            // Handle specific error types
            if (error.code === '23505') { // Unique constraint violation
              throw new Error("A client with this email already exists");
            }
            if (error.code === '23514') { // Check constraint violation
              throw new Error("Please check that all required fields are filled correctly");
            }
            if (error.message.includes('rate limit')) {
              throw new Error("Too many requests. Please wait a moment before saving again.");
            }
            
            throw error;
          }

          if (!data) {
            throw new Error("No data returned from insert operation");
          }
          
          console.log('Client inserted successfully:', data);
          return convertToAppClient(data);
        }, 3, 1000); // 3 retries with 1s, 2s, 4s delays

        clearTimeout(timeoutWarning);
        console.log('Client creation completed successfully');

        // Update local state immediately with the new client
        setClients((prev) => [newClient, ...prev]);


        return newClient;
      } catch (err) {
        clearTimeout(timeoutWarning);
        console.error("Error adding client:", err);

        // Provide more specific error messages
        let errorMessage = "Failed to add client";
        if (err instanceof Error) {
          if (err.message.includes("offline") || err.message.includes("internet connection")) {
            errorMessage = err.message;
          } else if (err.message.includes("Too many requests")) {
            errorMessage = err.message;
          } else if (err.message.includes("already exists")) {
            errorMessage = err.message;
          if (err.message.includes("Authentication check timed out") || 
              err.message.includes("No active session")) {
            errorMessage = "Authentication expired. Please refresh the page and try again.";
          } else if (err.message.toLowerCase().includes("timed out")) {
            errorMessage = err.message;
          } else if (
            err.message.includes("duplicate key") ||
            err.message.includes("unique constraint")
          ) {
            errorMessage = "A client with this email already exists";
          } else if (
            err.message.includes("check constraint") ||
            err.message.includes("email_check")
          ) {
            errorMessage = "Please enter a valid email address";
          } else if (err.message.includes("violates check constraint")) {
            errorMessage =
              "Please check that all required fields are filled correctly";
          } else if (
            err.message.includes("permission denied") ||
            err.message.includes("RLS")
          ) {
            errorMessage =
              "Permission denied. Please try logging out and back in.";
          } else if (err.message.includes("JWT")) {
            errorMessage =
              "Authentication expired. Please refresh the page and try again.";
          } else if (err.message.includes("not properly configured")) {
            errorMessage = "Application configuration error. Please contact support.";
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [user, debouncer]
  );

  const updateClient = useCallback(
    async (id: string, updates: Partial<Client>): Promise<void> => {
      if (!user) throw new Error("User not authenticated");

      // Check online status
      if (!checkOnlineStatus()) {
        throw new Error("You appear to be offline. Please check your internet connection and try again.");
      }

      // Check debounce
      if (!debouncer.canSave()) {
        throw new Error("Too many requests. Please wait a moment before saving again.");
      }
      // Validate updates if they contain required fields
      if (updates.name !== undefined && !updates.name.trim()) {
        throw new Error("Client name cannot be empty");
      }
      if (
        updates.email !== undefined &&
        (!updates.email.trim() ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email))
      ) {
        throw new Error("Please enter a valid email address");
      }
      if (
        updates.billingAddress !== undefined &&
        !updates.billingAddress.trim()
      ) {
        throw new Error("Billing address cannot be empty");
      }

      try {
        setError(null);
        setSaving(true);
        debouncer.markSaved();

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
        const { error } = await supabase
          .from("vendors")
          .update(dbUpdates)
          .eq("vendor_id", id)
          .eq("user_id", user.id);
          .eq("updated_at", currentClient.updatedAt.toISOString());

        if (error) {
          if (error.code === '23505') {
            throw new Error("A client with this email already exists");
          }
          if (error.message.includes('rate limit')) {
            throw new Error("Too many requests. Please wait a moment before saving again.");
          }
          throw error;
        }

        // Update local state
        setClients((prev) =>
          prev.map((client) =>
            client.id === id
              ? { ...client, ...updates, updatedAt: new Date() }
              : client
          )
        );

      } catch (err) {
        console.error("Error updating client:", err);

        // Provide more specific error messages
        let errorMessage = "Failed to update client";
        if (err instanceof Error) {
          if (err.message.includes("offline") || err.message.includes("internet connection")) {
            errorMessage = err.message;
          } else if (err.message.includes("Too many requests")) {
            errorMessage = err.message;
          } else if (err.message.includes("already exists")) {
            errorMessage = err.message;
          if (err.message.includes("duplicate key")) {
            errorMessage = "A client with this email already exists";
          } else if (err.message.includes("violates check constraint")) {
            errorMessage =
              "Please check that all required fields are filled correctly";
          } else if (
            err.message.includes("permission denied") ||
            err.message.includes("RLS")
          ) {
            errorMessage =
              "Permission denied. Please try logging out and back in.";
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [user, clients, debouncer]
  );

  const deleteClient = useCallback(
    async (id: string): Promise<void> => {
      if (!user) throw new Error("User not authenticated");

      // Check online status
      if (!checkOnlineStatus()) {
        throw new Error("You appear to be offline. Please check your internet connection and try again.");
      }
      try {
        setError(null);
        setSaving(true);

        const { error } = await supabase
          .from("vendors")
          .delete()
          .eq("vendor_id", id)
          .eq("user_id", user.id);

        if (error) throw error;

        // Update local state
        setClients((prev) => prev.filter((client) => client.id !== id));

      } catch (err) {
        console.error("Error deleting client:", err);
        
        let errorMessage = "Failed to delete client";
        if (err instanceof Error) {
          if (err.message.includes("offline") || err.message.includes("internet connection")) {
            errorMessage = err.message;
          } else {
            errorMessage = err.message;
          }
        }
        
        setError(errorMessage);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [user]
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
    error,
    addClient,
    updateClient,
    deleteClient,
    getClientById,
    refetch: fetchClients,
  };
};

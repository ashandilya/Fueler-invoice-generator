import { useState, useEffect, useCallback } from "react";
import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { supabase, DatabaseVendor } from "../lib/supabase";
import { useAuth } from "./useAuth";
import { Client } from "../types/client";

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

      // Cache in localStorage
      localStorage.setItem(`clients_${user.id}`, JSON.stringify(appClients));
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch clients");

      // Try to load from cache on error
      try {
        const cached = localStorage.getItem(`clients_${user.id}`);
        if (cached) {
          const cachedClients = JSON.parse(cached, (key, value) => {
            if (key === "createdAt" || key === "updatedAt") {
              return new Date(value);
            }
            return value;
          });
          setClients(cachedClients);
        }
      } catch (cacheError) {
        console.error("Error loading cached clients:", cacheError);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addClient = useCallback(
    async (
      clientData: Omit<Client, "id" | "createdAt" | "updatedAt">
    ): Promise<Client> => {
      if (!user) throw new Error("User not authenticated");

      if (
        !import.meta.env.VITE_SUPABASE_URL ||
        !import.meta.env.VITE_SUPABASE_ANON_KEY
      ) {
        throw new Error(
          "Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
        );
      }

      const withTimeout = async <T>(
        promise: Promise<T> | PromiseLike<T>,
        ms: number,
        message: string
      ): Promise<T> => {
        return new Promise<T>((resolve, reject) => {
          const timeoutId = setTimeout(() => reject(new Error(message)), ms);
          Promise.resolve(promise)
            .then((result) => {
              clearTimeout(timeoutId);
              resolve(result);
            })
            .catch((error: unknown) => {
              clearTimeout(timeoutId);
              reject(error);
            });
        });
      };

      const {
        data: { session },
        error: sessionError,
      } = await withTimeout<
        Awaited<ReturnType<typeof supabase.auth.getSession>>
      >(
        supabase.auth.getSession(),
        10000,
        "Authentication check timed out. Please check your network connection and try again."
      );

      if (sessionError) {
        console.error("Session error:", sessionError);
        throw new Error(
          "Authentication session invalid. Please refresh and try again."
        );
      }

      if (!session?.user) {
        throw new Error("No active session. Please sign in again.");
      }

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

      try {
        setError(null);
        const dbClient = {
          user_id: user.id,
          vendor_name: clientData.name,
          business_name: clientData.businessName || clientData.name,
          email: clientData.email.toLowerCase().trim(),
          phone: clientData.phone || null,
          gstin: clientData.gstin || null,
          billing_address: clientData.billingAddress,
          city: clientData.city || null,
          state: clientData.state || null,
          country: clientData.country || "India",
        };

        const { data, error } = await withTimeout<
          PostgrestSingleResponse<DatabaseVendor>
        >(
          supabase.from("vendors").insert(dbClient).select().single(),
          15000,
          "Saving client timed out. Please check your network/Supabase configuration and try again."
        );

        if (error) {
          console.error("Supabase insert error:", error);
          throw error;
        }

        if (!data) {
          throw new Error("No data returned from insert operation");
        }

        const newClient = convertToAppClient(data);
        console.log(`Client saved : ${newClient}`);

        setClients((prev) => [newClient, ...prev]);

        // Update cache
        const updatedClients = [newClient, ...clients];
        localStorage.setItem(
          `clients_${user.id}`,
          JSON.stringify(updatedClients)
        );

        return newClient;
      } catch (err) {
        console.error("Error adding client:", err);
        console.error("Full error object:", JSON.stringify(err, null, 2));

        // Provide more specific error messages
        let errorMessage = "Failed to add client";
        if (err instanceof Error) {
          if (err.message.toLowerCase().includes("timed out")) {
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
          } else {
            errorMessage = err.message;
          }
        }

        setError(errorMessage);
        throw err;
      }
    },
    [user, clients]
  );

  const updateClient = useCallback(
    async (id: string, updates: Partial<Client>): Promise<void> => {
      if (!user) throw new Error("User not authenticated");

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

        const { error } = await supabase
          .from("vendors")
          .update(dbUpdates)
          .eq("vendor_id", id)
          .eq("user_id", user.id);

        if (error) throw error;

        setClients((prev) =>
          prev.map((client) =>
            client.id === id
              ? { ...client, ...updates, updatedAt: new Date() }
              : client
          )
        );

        // Update cache
        const updatedClients = clients.map((client) =>
          client.id === id
            ? { ...client, ...updates, updatedAt: new Date() }
            : client
        );
        localStorage.setItem(
          `clients_${user.id}`,
          JSON.stringify(updatedClients)
        );
      } catch (err) {
        console.error("Error updating client:", err);

        // Provide more specific error messages
        let errorMessage = "Failed to update client";
        if (err instanceof Error) {
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
      }
    },
    [user, clients]
  );

  const deleteClient = useCallback(
    async (id: string): Promise<void> => {
      if (!user) throw new Error("User not authenticated");

      try {
        setError(null);

        const { error } = await supabase
          .from("vendors")
          .delete()
          .eq("vendor_id", id)
          .eq("user_id", user.id);

        if (error) throw error;

        setClients((prev) => prev.filter((client) => client.id !== id));

        // Update cache
        const updatedClients = clients.filter((client) => client.id !== id);
        localStorage.setItem(
          `clients_${user.id}`,
          JSON.stringify(updatedClients)
        );
      } catch (err) {
        console.error("Error deleting client:", err);
        setError(
          err instanceof Error ? err.message : "Failed to delete client"
        );
        throw err;
      }
    },
    [user, clients]
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

  useEffect(() => {
    if (user) {
      try {
        const cached = localStorage.getItem(`clients_${user.id}`);
        if (cached) {
          const cachedClients = JSON.parse(cached, (key, value) => {
            if (key === "createdAt" || key === "updatedAt") {
              return new Date(value);
            }
            return value;
          });
          setClients(cachedClients);
        }
      } catch (error) {
        console.error("Error loading cached clients:", error);
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

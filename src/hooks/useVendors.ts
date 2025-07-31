import { useState, useCallback } from 'react';
import { Vendor } from '../types/vendor';
import { useLocalStorage } from './useLocalStorage';

export const useVendors = () => {
  const [vendors, setVendors] = useLocalStorage<Vendor[]>('vendors', []);
  const [loading, setLoading] = useState(false);

  const addVendor = useCallback(async (vendorData: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    try {
      const newVendor: Vendor = {
        ...vendorData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setVendors(prev => [...prev, newVendor]);
      
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return newVendor;
    } finally {
      setLoading(false);
    }
  }, [setVendors]);

  const updateVendor = useCallback(async (id: string, updates: Partial<Vendor>) => {
    setLoading(true);
    try {
      setVendors(prev => prev.map(vendor => 
        vendor.id === id 
          ? { ...vendor, ...updates, updatedAt: new Date() }
          : vendor
      ));
      
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setLoading(false);
    }
  }, [setVendors]);

  const deleteVendor = useCallback(async (id: string) => {
    setLoading(true);
    try {
      setVendors(prev => prev.filter(vendor => vendor.id !== id));
      
      // Simulate delete delay
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setLoading(false);
    }
  }, [setVendors]);

  const getVendorById = useCallback((id: string): Vendor | undefined => {
    return vendors.find(vendor => vendor.id === id);
  }, [vendors]);

  return {
    vendors,
    loading,
    addVendor,
    updateVendor,
    deleteVendor,
    getVendorById,
  };
};
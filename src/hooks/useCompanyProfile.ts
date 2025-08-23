import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface CompanyProfile {
  userId: string;
  company_name?: string;
  company_address?: string;
  city?: string;
  state?: string;
  country?: string;
  company_logo_url?: string;
  digital_signature_url?: string;
  invoice_prefix?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const useCompanyProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          userId: user.id,
          company_name: data.company_name,
          company_address: data.company_address,
          city: data.city,
          state: data.state,
          country: data.country,
          company_logo_url: data.company_logo_url,
          digital_signature_url: data.digital_signature_url,
          invoice_prefix: data.invoice_prefix,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        });
      } else {
        // Create default profile
        const defaultProfile = {
          user_id: user.id,
          company_name: 'KiwisMedia Technologies Pvt. Ltd.',
          company_address: 'HNO 238 , Bhati Abhoynagar, Nr\nVivekananda club rd, Agartala\nWard No - 1, P.O - Ramnagar,\nAgartala, West Tripura TR\n799002 IN.',
          city: 'Agartala',
          state: 'West Tripura',
          country: 'India',
          company_logo_url: '/fueler_logo.png',
          digital_signature_url: '/signature.png.jpg',
          invoice_prefix: 'FLB',
        };
        
        try {
          const { data: newData, error: insertError } = await supabase
            .from('company_profiles')
            .insert(defaultProfile)
            .select()
            .single();

          if (insertError) throw insertError;

          setProfile({
            userId: user.id,
            company_name: newData.company_name,
            company_address: newData.company_address,
            city: newData.city,
            state: newData.state,
            country: newData.country,
            company_logo_url: newData.company_logo_url,
            digital_signature_url: newData.digital_signature_url,
            invoice_prefix: newData.invoice_prefix,
            createdAt: new Date(newData.created_at),
            updatedAt: new Date(newData.updated_at),
          });
        } catch (createErr) {
          setProfile({
            userId: user.id,
            company_name: defaultProfile.company_name,
            company_address: defaultProfile.company_address,
            city: defaultProfile.city,
            state: defaultProfile.state,
            country: defaultProfile.country,
            company_logo_url: defaultProfile.company_logo_url,
            digital_signature_url: defaultProfile.digital_signature_url,
            invoice_prefix: defaultProfile.invoice_prefix,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    } catch (err) {
      console.error('Error fetching company profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateProfile = useCallback(async (updates: Partial<CompanyProfile>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);

      const { error } = await supabase
        .from('company_profiles')
        .upsert({
          user_id: user.id,
          company_name: updates.company_name,
          company_address: updates.company_address,
          city: updates.city,
          state: updates.state,
          country: updates.country,
          company_logo_url: updates.company_logo_url,
          digital_signature_url: updates.digital_signature_url,
          invoice_prefix: updates.invoice_prefix,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setProfile(prev => prev ? {
        ...prev,
        ...updates,
        updatedAt: new Date(),
      } : null);

      return updates;
    } catch (err) {
      console.error('Error updating company profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    }
  }, [user]);

  const uploadFile = useCallback(async (file: File, type: 'logo' | 'signature'): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('company-assets')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading file:', err);
      throw err;
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadFile,
    refetch: fetchProfile,
  };
};
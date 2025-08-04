import { useState, useEffect, useCallback } from 'react';
import { supabase, CompanyProfile } from '../lib/supabase';
import { useAuth } from './useAuth';

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

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setProfile(data);
      } else {
        // Create default profile if none exists
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
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        try {
          const { data: newProfile, error: createError } = await supabase
            .from('company_profiles')
            .insert(defaultProfile)
            .select()
            .single();
            
          if (!createError && newProfile) {
            setProfile(newProfile);
          } else {
            setProfile(defaultProfile);
          }
        } catch (createErr) {
          setProfile(defaultProfile);
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

      const { data, error } = await supabase
        .from('company_profiles')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      return data;
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

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('company-assets')
        .getPublicUrl(fileName);

      return data.publicUrl;
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
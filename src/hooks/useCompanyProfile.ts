import { useState, useEffect, useCallback } from 'react';
import { supabase, CompanyProfile } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useCompanyProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // If Supabase is not configured, return mock state
  if (!supabase) {
    return {
      profile: null,
      loading: false,
      error: 'Supabase not configured',
      updateProfile: async () => { throw new Error('Supabase not configured'); },
      uploadFile: async () => { throw new Error('Supabase not configured'); },
      refetch: async () => {},
    };
  }

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

      setProfile(data || null);
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
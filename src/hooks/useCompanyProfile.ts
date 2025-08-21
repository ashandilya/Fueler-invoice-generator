import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from './useAuth';

export interface CompanyProfile {
  userId: string;
  companyName?: string;
  companyAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  companyLogoUrl?: string;
  digitalSignatureUrl?: string;
  invoicePrefix?: string;
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

      const profileRef = doc(db, 'companyProfiles', user.uid);
      const profileDoc = await getDoc(profileRef);

      if (profileDoc.exists()) {
        const data = profileDoc.data();
        setProfile({
          userId: user.uid,
          companyName: data.companyName,
          companyAddress: data.companyAddress,
          city: data.city,
          state: data.state,
          country: data.country,
          companyLogoUrl: data.companyLogoUrl,
          digitalSignatureUrl: data.digitalSignatureUrl,
          invoicePrefix: data.invoicePrefix,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      } else {
        // Create default profile
        const defaultProfile = {
          userId: user.uid,
          companyName: 'KiwisMedia Technologies Pvt. Ltd.',
          companyAddress: 'HNO 238 , Bhati Abhoynagar, Nr\nVivekananda club rd, Agartala\nWard No - 1, P.O - Ramnagar,\nAgartala, West Tripura TR\n799002 IN.',
          city: 'Agartala',
          state: 'West Tripura',
          country: 'India',
          companyLogoUrl: '/fueler_logo.png',
          digitalSignatureUrl: '/signature.png.jpg',
          invoicePrefix: 'FLB',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        
        try {
          await setDoc(profileRef, defaultProfile);
          setProfile({
            ...defaultProfile,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } catch (createErr) {
          setProfile({
            ...defaultProfile,
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

      const profileRef = doc(db, 'companyProfiles', user.uid);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      await setDoc(profileRef, updateData, { merge: true });

      setProfile(prev => prev ? {
        ...prev,
        ...updates,
        updatedAt: new Date(),
      } : null);

      return updateData;
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
      const fileName = `${user.uid}/${type}-${Date.now()}.${fileExt}`;
      const storageRef = ref(storage, `company-assets/${fileName}`);

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return downloadURL;
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
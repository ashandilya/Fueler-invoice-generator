import { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle user authentication
        if (event === 'SIGNED_IN' && session?.user) {
          const isNewUser = await createUserRecord(session.user);
          setNeedsOnboarding(isNewUser);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const createUserRecord = async (user: SupabaseUser): Promise<boolean> => {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (existingUser) {
        return false; // User already exists
      }

      // Create new user record
      const { error } = await supabase
        .from('users')
        .insert({
          user_id: user.id,
          email: user.email!,
        });

      if (error) {
        console.error('Error creating user record:', error);
        return false;
      }

      return true; // New user created
    } catch (error) {
      console.error('Error creating user record:', error);
      return false;
    }
  };

  const completeOnboarding = async (profile: UserProfile) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // Update user record with profile info
      const { error } = await supabase
        .from('users')
        .update({
          email: profile.email,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setNeedsOnboarding(false);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google sign-in...');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin.includes('localhost') 
            ? `${window.location.origin}/`
            : 'https://fueler-invoice-generator.netlify.app/'
        }
      });
      
      if (error) {
        console.error('Supabase auth error:', error);
        throw error;
      }
      console.log('Google sign-in initiated successfully');
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
      
      // Only clear auth-related data, preserve invoices and clients
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('auth') || 
          key.includes('session') ||
          key.includes('supabase')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Force page reload to clear all state
      window.location.reload();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    needsOnboarding,
    signInWithGoogle,
    signOut,
    completeOnboarding,
  };
};
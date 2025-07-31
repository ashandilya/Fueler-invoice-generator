import { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

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

        // Create user record in database if signing in for first time
        if (event === 'SIGNED_IN' && session?.user) {
          await createUserRecord(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const createUserRecord = async (user: SupabaseUser) => {
    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          user_id: user.id,
          email: user.email!,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error creating user record:', error);
      }
    } catch (error) {
      console.error('Error creating user record:', error);
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google sign-in...');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
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
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    signInWithGoogle,
    signOut,
  };
};
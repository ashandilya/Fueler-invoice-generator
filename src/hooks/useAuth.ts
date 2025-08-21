import { useState, useEffect } from 'react';
import { 
  User,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      console.log('⚠️ Firebase not configured');
      setUser(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔄 Auth state changed:', user?.email || 'No user');
      setUser(user);
      
      if (user) {
        console.log('✅ User signed in, checking user record...');
        const isNewUser = await createUserRecord(user);
        setNeedsOnboarding(isNewUser);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createUserRecord = async (user: User): Promise<boolean> => {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        return false; // User already exists
      }

      // Create new user record
      await setDoc(userDocRef, {
        email: user.email!,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return true; // New user created
    } catch (error) {
      console.error('Error creating user record:', error);
      return false;
    }
  };

  const completeOnboarding = async (profile: UserProfile) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        email: profile.email,
        name: profile.name,
        phone: profile.phone,
        updatedAt: new Date()
      }, { merge: true });

      setNeedsOnboarding(false);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google sign-in...');
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      console.log('Google sign-in successful:', result.user.email);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      
      // Clear local storage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('auth') || 
          key.includes('session') ||
          key.includes('firebase')
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
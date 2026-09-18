'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { getUser } from '@/lib/firestore';
import { User as AppUser } from '@/types';

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  isSupervisor: boolean;
  isAuditor: boolean;
  isCashier: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          const appUser = await getUser(firebaseUser.uid);
          if (appUser) {
            setUser(appUser);
            console.log('User loaded from Firestore:', appUser);
          } else {
            console.warn('User not found in Firestore, creating default user');
            // Create default user in Firestore if not exists
            const defaultUser: AppUser = {
              id: firebaseUser.uid,
              username: firebaseUser.email?.split('@')[0] || 'user',
              role: 'admin', // Default to admin for first user
              created_at: new Date().toISOString(),
            };
            // TODO: Create user in Firestore
            setUser(defaultUser);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback: create default user with admin role
          const defaultUser: AppUser = {
            id: firebaseUser.uid,
            username: firebaseUser.email?.split('@')[0] || 'user',
            role: 'admin',
            created_at: new Date().toISOString(),
          };
          setUser(defaultUser);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  const isAdmin = user?.role === 'admin';
  const isSupervisor = user?.role === 'supervisor';
  const isAuditor = user?.role === 'auditor';
  const isCashier = user?.role === 'cashier';

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, isAdmin, isSupervisor, isAuditor, isCashier, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

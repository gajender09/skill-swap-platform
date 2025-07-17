import React, { createContext, useContext, useEffect, useState } from 'react';
import { Profile, getFromStorage, setToStorage, generateId, initializeMockData } from '../lib/mockData';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize mock data
    initializeMockData();
    
    // Check for existing session
    const savedUser = getFromStorage<User | null>('currentUser', null);
    if (savedUser) {
      setUser(savedUser);
      fetchProfile(savedUser.id);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = (userId: string) => {
    const users = getFromStorage<Profile[]>('users', []);
    const userProfile = users.find(u => u.id === userId);
    if (userProfile) {
      setProfile(userProfile);
    }
    setLoading(false);
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const users = getFromStorage<Profile[]>('users', []);
      const existingUser = users.find(u => u.name.toLowerCase() === email.toLowerCase());
      
      if (existingUser) {
        throw new Error('User already exists');
      }

      const userId = generateId();
      const newUser: User = { id: userId, email };
      const newProfile: Profile = {
        id: userId,
        name,
        is_public: true,
        is_banned: false,
        is_admin: false,
        availability: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedUsers = [...users, newProfile];
      setToStorage('users', updatedUsers);
      setToStorage('currentUser', newUser);
      
      setUser(newUser);
      setProfile(newProfile);
      
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const users = getFromStorage<Profile[]>('users', []);
      let userProfile: Profile | undefined;
      
      // Check for demo accounts
      if (email === 'admin@demo.com') {
        userProfile = users.find(u => u.is_admin);
      } else if (email === 'user@demo.com') {
        userProfile = users.find(u => !u.is_admin && u.name === 'Alice Johnson');
      } else {
        userProfile = users.find(u => u.name.toLowerCase() === email.toLowerCase());
      }
      
      if (!userProfile) {
        throw new Error('Invalid credentials');
      }

      if (userProfile.is_banned) {
        throw new Error('Account has been banned');
      }

      const user: User = { id: userProfile.id, email };
      setToStorage('currentUser', user);
      
      setUser(user);
      setProfile(userProfile);
      
      toast.success('Signed in successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      localStorage.removeItem('currentUser');
      setUser(null);
      setProfile(null);
      toast.success('Signed out successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) throw new Error('No user logged in');

    try {
      const users = getFromStorage<Profile[]>('users', []);
      const updatedProfile = { 
        ...profile, 
        ...updates, 
        updated_at: new Date().toISOString() 
      };
      
      const updatedUsers = users.map(u => 
        u.id === profile.id ? updatedProfile : u
      );
      
      setToStorage('users', updatedUsers);
      setProfile(updatedProfile);
      
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
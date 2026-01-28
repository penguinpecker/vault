// VAULT - Profile Context with Supabase Sync
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// Types
export interface Profile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  currency: 'USD' | 'GBP' | 'EUR' | 'JPY' | 'CAD' | 'AUD';
  hideBalance: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const DEFAULT_PROFILE: Omit<Profile, 'id' | 'email' | 'createdAt' | 'updatedAt'> = {
  fullName: '',
  avatarUrl: null,
  currency: 'USD',
  hideBalance: false,
};

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile from Supabase
  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        // If profile doesn't exist, create one
        if (fetchError.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || '',
            })
            .select()
            .single();

          if (createError) throw createError;

          setProfile({
            id: newProfile.id,
            email: newProfile.email,
            fullName: newProfile.full_name || '',
            avatarUrl: newProfile.avatar_url,
            currency: newProfile.currency || 'USD',
            hideBalance: newProfile.hide_balance || false,
            createdAt: newProfile.created_at,
            updatedAt: newProfile.updated_at,
          });
        } else {
          throw fetchError;
        }
      } else {
        setProfile({
          id: data.id,
          email: data.email,
          fullName: data.full_name || '',
          avatarUrl: data.avatar_url,
          currency: data.currency || 'USD',
          hideBalance: data.hide_balance || false,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch profile when user changes
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user || !profile) return;

    try {
      setError(null);

      const dbUpdates: Record<string, any> = {};
      if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
      if (updates.hideBalance !== undefined) dbUpdates.hide_balance = updates.hideBalance;
      dbUpdates.updated_at = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, ...updates, updatedAt: dbUpdates.updated_at } : null);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    }
  }, [user, profile]);

  // Refresh profile
  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        error,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}

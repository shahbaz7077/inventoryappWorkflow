'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) loadProfile(data.session.user);
      else setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) loadProfile(session.user);
      else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadProfile(authUser) {
    setUser(authUser);
    const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
    setProfile(data);
    setLoading(false);
  }

  async function refreshProfile() {
    if (user) await loadProfile(user);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    needsOnboarding: !!user && !profile?.name,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
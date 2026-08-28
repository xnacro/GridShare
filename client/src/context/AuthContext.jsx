import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [household, setHousehold] = useState(null);
  const [energyNode, setEnergyNode] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync token into localStorage for API requests
  const saveTokenToStorage = (token) => {
    if (token) {
      localStorage.setItem('gridshare_access_token', token);
    } else {
      localStorage.removeItem('gridshare_access_token');
    }
  };

  // Fetch verified user identity & owned household from Flask backend
  const fetchMe = useCallback(async (accessToken) => {
    try {
      const res = await api.getMe(accessToken);
      if (res.data?.status === 'SUCCESS') {
        setProfile(res.data.user);
        setHousehold(res.data.household);
        setEnergyNode(res.data.energy_node);
        return res.data;
      }
    } catch (err) {
      console.warn('Unable to resolve user profile from backend:', err);
    }
    return null;
  }, []);

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      // 1. Check if demo user token in localStorage
      const storedDemoToken = localStorage.getItem('gridshare_demo_user');
      const storedToken = localStorage.getItem('gridshare_access_token');
      const activeToken = storedDemoToken || storedToken;

      if (activeToken) {
        saveTokenToStorage(activeToken);
        const meData = await fetchMe(activeToken);
        if (meData && isMounted) {
          setUser(meData.user);
          setLoading(false);
          return;
        }
      }

      if (isSupabaseConfigured) {
        try {
          const { data: { session: initSession } } = await supabase.auth.getSession();
          if (initSession && isMounted) {
            setSession(initSession);
            setUser(initSession.user);
            saveTokenToStorage(initSession.access_token);
            await fetchMe(initSession.access_token);
          }
        } catch (err) {
          console.error('Error fetching Supabase session:', err);
        }
      } else {
        // Fallback: Default to Anjali's Home (Prosumer)
        const defaultDemoToken = 'demo-token-anjali';
        saveTokenToStorage(defaultDemoToken);
        const meData = await fetchMe(defaultDemoToken);
        if (meData && isMounted) {
          setUser(meData.user);
        }
      }

      if (isMounted) setLoading(false);
    }

    initAuth();

    // Listen to Supabase auth state changes
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (!isMounted) return;
        setSession(currentSession);
        setUser(currentSession?.user || null);

        if (currentSession?.access_token) {
          saveTokenToStorage(currentSession.access_token);
          await fetchMe(currentSession.access_token);
        } else {
          saveTokenToStorage(null);
          setProfile(null);
          setHousehold(null);
          setEnergyNode(null);
        }
        setLoading(false);
      });

      return () => {
        isMounted = false;
        subscription?.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, [fetchMe]);

  // Sign In with Email & Password (e.g. admin@123)
  const signIn = async (email, password) => {
    setError(null);
    setLoading(true);

    try {
      // 1. Try Backend Local/PostgreSQL Login first
      const res = await api.login({ email, password });
      if (res.data?.status === 'SUCCESS') {
        const token = res.data.access_token;
        saveTokenToStorage(token);
        setProfile(res.data.user);
        setHousehold(res.data.household);
        setEnergyNode(res.data.energy_node);
        setUser(res.data.user);
        setLoading(false);
        return res.data;
      }
    } catch (backendErr) {
      // 2. If Supabase is configured, fallback to Supabase Auth
      if (isSupabaseConfigured) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) {
          setLoading(false);
          setError(authError.message);
          throw authError;
        }
        setSession(data.session);
        setUser(data.user);
        saveTokenToStorage(data.session.access_token);
        await fetchMe(data.session.access_token);
        setLoading(false);
        return data;
      }
      setLoading(false);
      const errMsg = backendErr.response?.data?.message || 'Login failed. Please check credentials.';
      setError(errMsg);
      throw new Error(errMsg);
    }
  };

  // Sign Up with Email & Password
  const signUp = async (displayName, email, password) => {
    setError(null);
    setLoading(true);

    if (isSupabaseConfigured) {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });
      if (authError) {
        setLoading(false);
        setError(authError.message);
        throw authError;
      }
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        saveTokenToStorage(data.session.access_token);
        await fetchMe(data.session.access_token);
      }
      setLoading(false);
      return data;
    } else {
      // Local fallback: use login with default password
      const res = await api.login({ email, password: password || 'admin@123' });
      if (res.data?.status === 'SUCCESS') {
        saveTokenToStorage(res.data.access_token);
        setProfile(res.data.user);
        setHousehold(res.data.household);
        setUser(res.data.user);
      }
      setLoading(false);
      return res.data;
    }
  };

  // Google OAuth Login
  const signInWithGoogle = async () => {
    setError(null);
    if (!isSupabaseConfigured) {
      return signInAsDemo('anjali');
    }
    const { data, error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (authError) {
      setError(authError.message);
      throw authError;
    }
    return data;
  };

  // Instant Demo Switcher for the 4 authentic users
  const signInAsDemo = async (role = 'anjali') => {
    setLoading(true);
    const tokenMap = {
      anjali: 'demo-token-anjali',
      prince: 'demo-token-prince',
      ayush: 'demo-token-ayush',
      rahul: 'demo-token-rahul',
      // Legacy aliases mapped cleanly
      house_a: 'demo-token-anjali',
      house_b: 'demo-token-prince',
      house_c: 'demo-token-ayush',
      house_d: 'demo-token-rahul',
    };
    const demoToken = tokenMap[role.toLowerCase()] || 'demo-token-anjali';
    localStorage.setItem('gridshare_demo_user', demoToken);
    saveTokenToStorage(demoToken);
    const meData = await fetchMe(demoToken);
    if (meData) {
      setUser(meData.user);
    }
    setLoading(false);
    return meData;
  };

  // Sign Out
  const signOut = async () => {
    setLoading(true);
    localStorage.removeItem('gridshare_demo_user');
    saveTokenToStorage(null);

    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
    }

    setUser(null);
    setProfile(null);
    setHousehold(null);
    setEnergyNode(null);
    setSession(null);
    setLoading(false);
  };

  const value = {
    user,
    profile,
    household,
    energyNode,
    session,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signInAsDemo,
    signOut,
    refreshUserProfile: () => {
      const token = localStorage.getItem('gridshare_access_token');
      if (token) fetchMe(token);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

type User = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Error getting session:', sessionError);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (currentSession) {
          if (mounted) {
            setSession(currentSession);
          }
          await fetchUserData(currentSession.user.id);
        } else {
          if (mounted) {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth state changed:', event);

      if (!mounted) return;

      if (currentSession) {
        setSession(currentSession);
        await fetchUserData(currentSession.user.id);
      } else {
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserData = async (authUserId: string) => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .eq('is_enabled', true)
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user data:', userError);
        setUser(null);
        setLoading(false);
        return;
      }

      if (!userData) {
        console.error('No user data found for auth user:', authUserId);
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(userData);
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      setUser(null);
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('Login error:', authError);
        return {
          success: false,
          error: authError.message === 'Invalid login credentials'
            ? 'Invalid email or password'
            : 'An error occurred during login'
        };
      }

      if (!authData.user) {
        return { success: false, error: 'Login failed - no user returned' };
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .eq('is_enabled', true)
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user data:', userError);
        await supabase.auth.signOut();
        return { success: false, error: 'Failed to load user data' };
      }

      if (!userData) {
        await supabase.auth.signOut();
        return { success: false, error: 'User account is disabled or not found' };
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id);

      if (updateError) {
        console.error('Error updating last login:', updateError);
      }

      await supabase.from('activity_logs').insert({
        user_id: userData.id,
        action: 'login',
        description: `User ${userData.username} logged in`,
        table_affected: 'users',
        record_id: userData.id,
      });

      setUser(userData);
      setSession(authData.session);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    if (user) {
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'logout',
        description: `User ${user.username} logged out`,
        table_affected: 'users',
        record_id: user.id,
      });
    }

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

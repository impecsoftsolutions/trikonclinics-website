import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';
import bcrypt from 'bcryptjs';

type User = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('hospital_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('is_enabled', true)
        .maybeSingle();

      if (error) {
        console.error('Login error:', error);
        return { success: false, error: 'An error occurred during login' };
      }

      if (!users) {
        return { success: false, error: 'Invalid username or password' };
      }

      const passwordMatch = await bcrypt.compare(password, users.password);

      if (!passwordMatch) {
        return { success: false, error: 'Invalid username or password' };
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', users.id);

      if (updateError) {
        console.error('Error updating last login:', updateError);
      }

      await supabase.from('activity_logs').insert({
        user_id: users.id,
        action: 'login',
        description: `User ${users.username} logged in`,
        table_affected: 'users',
        record_id: users.id,
      });

      setUser(users);
      localStorage.setItem('hospital_user', JSON.stringify(users));

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

    setUser(null);
    localStorage.removeItem('hospital_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

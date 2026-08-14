'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { User } from '@/types';
import { authService, LoginPayload, RegisterPayload } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    const token = Cookies.get('token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { user: currentUser } = await authService.getMe();
      setUser(currentUser);
    } catch (err) {
      console.error('Session check failed:', err instanceof Error ? err.message : err);
      toast.error('Your session could not be verified — please log in again.');
      setUser(null);
      Cookies.remove('token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (payload: LoginPayload) => {
    const { token, user: loggedInUser } = await authService.login(payload);
    Cookies.set('token', token, { expires: 7 });
    setUser(loggedInUser);
    toast.success(`Welcome back, ${loggedInUser.name.split(' ')[0]}!`);
    router.push(`/dashboard/${loggedInUser.role}`);
  };

  const register = async (payload: RegisterPayload) => {
    const { token, user: newUser } = await authService.register(payload);
    Cookies.set('token', token, { expires: 7 });
    setUser(newUser);
    toast.success('Account created successfully!');
    router.push(`/dashboard/${newUser.role}`);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // proceed with client-side logout regardless
    }
    Cookies.remove('token');
    setUser(null);
    toast.success('Logged out successfully');
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

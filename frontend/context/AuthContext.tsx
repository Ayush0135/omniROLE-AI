'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  plan?: string;
  is_admin?: boolean;
  status?: string;
  avatar_url?: string | null;
  monthly_token_limit?: number;
  tokens_used_this_month?: number;
  created_at?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<{ requires_otp?: boolean; message?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ message: string }>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  sendOtp: (email: string) => Promise<{ message: string }>;
  logout: () => void;
  updateProfile: (data: { name?: string; avatar_url?: string; password?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Helper to sync token in cookie for middleware
  const setAuthCookie = (tokenValue: string | null) => {
    if (tokenValue) {
      document.cookie = `omni_token=${tokenValue}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    } else {
      document.cookie = `omni_token=; path=/; max-age=0; SameSite=Lax`;
    }
  };

  const refreshUser = async () => {
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('omni_token') : null;
    if (!savedToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        setToken(savedToken);
        setAuthCookie(savedToken);
        localStorage.setItem('omni_current_user_id', userData.id);
      } else {
        localStorage.removeItem('omni_token');
        localStorage.removeItem('omni_current_user_id');
        setAuthCookie(null);
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password?: string) => {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to sign in.');
    }

    if (data.requires_otp) {
      return { requires_otp: true, message: data.message };
    }

    if (data.token) {
      localStorage.setItem('omni_token', data.token);
      localStorage.setItem('omni_current_user_id', data.user.id);
      setAuthCookie(data.token);
      setToken(data.token);
      setUser(data.user);
    }
    return { requires_otp: false };
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await fetch('/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to create account.');
    }
    return { message: data.message };
  };

  const verifyOtp = async (email: string, otp: string) => {
    const res = await fetch('/api/v1/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Invalid or expired OTP code.');
    }

    if (data.token) {
      localStorage.setItem('omni_token', data.token);
      localStorage.setItem('omni_current_user_id', data.user.id);
      setAuthCookie(data.token);
      setToken(data.token);
      setUser(data.user);
    }
  };

  const sendOtp = async (email: string) => {
    const res = await fetch('/api/v1/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to dispatch OTP code.');
    }
    return { message: data.message };
  };

  const logout = () => {
    localStorage.removeItem('omni_token');
    localStorage.removeItem('omni_current_user_id');
    setAuthCookie(null);
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  const updateProfile = async (updateData: { name?: string; avatar_url?: string; password?: string }) => {
    const currentToken = token || localStorage.getItem('omni_token');
    if (!currentToken) throw new Error('Not authenticated');

    const res = await fetch('/api/v1/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`,
      },
      body: JSON.stringify(updateData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Failed to update profile');
    }
    await refreshUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        verifyOtp,
        sendOtp,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

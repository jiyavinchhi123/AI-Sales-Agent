'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, AuthResponse } from '../lib/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, companyName?: string) => Promise<void>;
  logout: () => void;
  updateUser: (partialUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check saved session on mount
    const savedToken = localStorage.getItem('sales_agent_token');
    const savedUser = localStorage.getItem('sales_agent_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Verify with backend
        fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${savedToken}` },
        })
          .then((res) => {
            if (res.ok) {
              return res.json();
            } else {
              // Token expired or invalid
              logout();
            }
          })
          .then((freshUser) => {
            if (freshUser) {
              setUser(freshUser);
              localStorage.setItem('sales_agent_user', JSON.stringify(freshUser));
            }
          })
          .catch(() => {
            // Keep offline user if network issue
          })
          .finally(() => setIsLoading(false));
      } catch (e) {
        logout();
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const updateUser = (partialUser: Partial<User>) => {
    setUser((prev) => {
      const baseUser: User = prev || {
        id: 'workspace-user',
        email: partialUser.email || 'user@workspace.ai',
        full_name: partialUser.full_name || 'Sales User',
        company_name: partialUser.company_name || 'My Workspace',
      };
      const updated = { ...baseUser, ...partialUser };
      try {
        localStorage.setItem('sales_agent_user', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(err.detail || 'Invalid email or password');
    }

    const data: AuthResponse = await res.json();
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('sales_agent_token', data.access_token);
    localStorage.setItem('sales_agent_user', JSON.stringify(data.user));
    router.push('/dashboard');
  };

  const register = async (fullName: string, email: string, password: string, companyName?: string) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName,
        email,
        password,
        company_name: companyName,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(err.detail || 'Registration failed');
    }

    const data: AuthResponse = await res.json();
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('sales_agent_token', data.access_token);
    localStorage.setItem('sales_agent_user', JSON.stringify(data.user));
    router.push('/business');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('sales_agent_token');
    localStorage.removeItem('sales_agent_user');
    router.push('/login');
  };

  // Route protection redirect
  useEffect(() => {
    if (!isLoading) {
      const publicPaths = ['/login', '/register', '/landing', '/'];
      const isPublic = publicPaths.includes(pathname);
      if (!user && !isPublic) {
        router.push('/login');
      } else if (user && (pathname === '/login' || pathname === '/register')) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

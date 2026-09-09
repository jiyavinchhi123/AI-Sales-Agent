'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Bot } from 'lucide-react';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 animate-bounce mb-3">
          <Bot className="w-8 h-8 text-white" />
        </div>
        <p className="text-sm font-semibold text-slate-700">Loading AI Sales Agent...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in AuthContext
  }

  return (
    <div className="h-full flex overflow-hidden text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

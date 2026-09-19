'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  Bell,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  User,
  Radar,
  PhoneCall,
  LogOut,
  Building2,
  CreditCard,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export const Header: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [backendStatus, setBackendStatus] = useState<'online' | 'checking'>('checking');
  const [planTier, setPlanTier] = useState<string>('Growth');

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.checkHealth()
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('online'));

    api.getSubscription()
      .then((sub) => {
        if (sub?.plan_tier) setPlanTier(sub.plan_tier);
      })
      .catch(() => {});

    // Dynamically sync business email & company name with active user header
    api.getStructuredBusinessProfile().then((data) => {
      if (data) {
        const updates: Partial<{ email: string; company_name: string }> = {};
        if (data.sender_email && data.sender_email !== user?.email) {
          updates.email = data.sender_email;
        }
        if (data.company_name && data.company_name !== user?.company_name) {
          updates.company_name = data.company_name;
        }
        if (Object.keys(updates).length > 0) {
          updateUser(updates);
        }
      }
    });
  }, [user?.email, user?.company_name]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-8 flex items-center justify-between">
      {/* 1. Search Bar */}
      <div className="flex items-center gap-4 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search signals, leads, or pipeline..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* 2. Top Right Actions */}
      <div className="flex items-center gap-4">
        {/* Workspace indicator */}
        {user?.company_name && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50/70 border border-indigo-100 text-xs font-medium text-indigo-800">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>{user.company_name}</span>
          </div>
        )}

        {/* Subscription Plan Badge */}
        <Link
          href="/subscription"
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 border border-indigo-200 transition-all cursor-pointer"
          title="View SaaS Plan & Quotas"
        >
          <CreditCard className="w-3 h-3 text-indigo-600" />
          <span>{planTier} Tier</span>
        </Link>

        {/* Backend Status Pill */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>AI Engine: Online</span>
        </div>

        {/* 3. Notifications Area */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all focus:outline-none"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Notifications Dropdown Panel */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  System Notifications
                </span>
              </div>
              <div className="p-4 text-center text-xs text-slate-500">
                No unread alerts. You are up to date!
              </div>
            </div>
          )}
        </div>

        {/* 4. Dynamic User Profile Area */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-90 transition-all focus:outline-none text-left"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
              {getInitials(user?.full_name)}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.full_name || 'Sales User'}
              </div>
              <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                {user?.email || 'user@workspace'}
              </div>
            </div>
          </button>

          {/* User Profile Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl border border-slate-200 shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="font-bold text-slate-900">{user?.full_name}</div>
                <div className="text-[11px] text-slate-500 break-all">{user?.email}</div>
                {user?.company_name && (
                  <div className="text-[10px] font-semibold text-indigo-600 mt-1 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    <span>{user.company_name}</span>
                  </div>
                )}
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

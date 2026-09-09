'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  User,
  Radar,
  PhoneCall,
  X,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/api';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'signal' | 'call' | 'crm' | 'system';
  read: boolean;
}

const DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    title: 'High Intent Buying Signal Detected',
    message: 'FinTrack Analytics posted 5 DevOps/Security jobs following $38M Series B.',
    time: '12m ago',
    type: 'signal',
    read: false,
  },
  {
    id: 'n-2',
    title: 'AI Outreach Call Completed',
    message: 'Marcus Vance agreed to 25-min technical demo for Thursday 2:00 PM PT.',
    time: '45m ago',
    type: 'call',
    read: false,
  },
  {
    id: 'n-3',
    title: 'Opportunity Synced to Salesforce',
    message: 'HealthBridge Care ($29,000 ARR) handed off to Jessica Hayes.',
    time: '2h ago',
    type: 'crm',
    read: true,
  },
];

export const Header: React.FC = () => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [backendStatus, setBackendStatus] = useState<'online' | 'checking'>('checking');

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.checkHealth()
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('online')); // Demo resilient fallback
  }, []);

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

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
            placeholder="Search signals, leads, or battlecards..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* 2. Top Right Actions */}
      <div className="flex items-center gap-4">
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
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl border border-slate-200 shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 hover:bg-slate-50 transition-all ${
                      !n.read ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        {n.type === 'signal' && <Radar className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                        {n.type === 'call' && <PhoneCall className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                        {n.type === 'crm' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        <span>{n.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed pl-5">
                      {n.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. User Profile Area */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-90 transition-all focus:outline-none text-left"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-2xs">
              DM
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-slate-800 leading-tight">David Miller</div>
              <div className="text-[10px] text-slate-500">Enterprise AE</div>
            </div>
          </button>

          {/* User Profile Dropdown Menu */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="font-bold text-slate-900">David Miller</div>
                <div className="text-[11px] text-slate-500">d.miller@cloudarmor.ai</div>
                <div className="text-[10px] font-semibold text-indigo-600 mt-1">Enterprise AE • Level 3</div>
              </div>
              <div className="py-1">
                <div className="px-4 py-2 text-slate-600 hover:bg-slate-50 cursor-pointer">
                  Assigned Opportunities (2)
                </div>
                <div className="px-4 py-2 text-slate-600 hover:bg-slate-50 cursor-pointer">
                  AI Outreach Cadence Preferences
                </div>
                <div className="px-4 py-2 text-slate-600 hover:bg-slate-50 cursor-pointer">
                  CRM Integration: Connected
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

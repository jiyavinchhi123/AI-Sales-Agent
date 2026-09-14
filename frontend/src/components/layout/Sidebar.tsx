'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Radar,
  Users,
  PhoneCall,
  Send,
  BarChart3,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Business Profile', href: '/business', icon: Building2 },
  { label: 'Lead Discovery', href: '/discovery', icon: Radar },
  { label: 'Leads', href: '/leads', icon: Users },
  { label: 'AI Calling', href: '/calling', icon: PhoneCall },
  { label: 'Campaigns', href: '/campaigns', icon: Send },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-sm tracking-tight text-slate-900 flex items-center gap-1.5">
            AI Sales Agent
          </div>
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Signal to Opportunity
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Main Menu
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-50/70 text-indigo-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
            </Link>
          );
        })}
      </nav>

      {/* Dynamic Workspace Pill */}
      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
            <span className="truncate max-w-[130px]">{user?.company_name || 'My Workspace'}</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
              Live
            </span>
          </div>
          <div className="text-xs text-slate-600 truncate font-medium">{user?.full_name || 'Sales User'}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">{user?.email || 'sales@workspace.ai'}</div>
        </div>
      </div>
    </aside>
  );
};

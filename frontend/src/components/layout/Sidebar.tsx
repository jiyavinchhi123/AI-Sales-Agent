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
  BarChart3,
  CreditCard,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Business Profile', href: '/business', icon: Building2 },
  { label: 'Lead Discovery', href: '/discovery', icon: Radar },
  { label: 'Leads', href: '/leads', icon: Users },
  { label: 'AI Calling', href: '/calling', icon: PhoneCall },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Subscription', href: '/subscription', icon: CreditCard },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const [planTier, setPlanTier] = React.useState<string>('Growth');

  React.useEffect(() => {
    import('@/lib/api').then(({ api }) => {
      api.getSubscription()
        .then((data) => {
          if (data?.plan_tier) setPlanTier(data.plan_tier);
        })
        .catch(() => {});
    });
  }, [pathname]);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-100 gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-xs border border-indigo-100 bg-white flex items-center justify-center shrink-0">
          <img
            src="/logo.png"
            alt="AI Sales Agent Logo"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <div className="font-bold text-sm tracking-tight text-slate-900 flex items-center gap-1.5">
            AI Sales Agent
          </div>
          <div className="text-[10.5px] font-medium text-slate-500 uppercase tracking-wider">
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

      {/* Dynamic Workspace Pill & Subscription Tier */}
      <div className="p-4 border-t border-slate-100 space-y-2">
        <Link
          href="/subscription"
          className="block bg-slate-50 hover:bg-slate-100/80 rounded-xl p-3 border border-slate-200/80 transition-all group"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
            <span className="truncate max-w-[120px]">{user?.company_name || 'My Workspace'}</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              {planTier}
            </span>
          </div>
          <div className="text-xs text-slate-600 truncate font-medium">{user?.full_name || 'Sales User'}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate">{user?.email || 'sales@workspace.ai'}</div>
        </Link>
      </div>
    </aside>
  );
};
